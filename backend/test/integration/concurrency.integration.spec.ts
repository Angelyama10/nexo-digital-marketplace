import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EstadoPago, PrismaClient, RolUsuario, Usuario } from '@prisma/client';
import { AuthService } from '../../src/auth/auth.service';
import { AuthRateLimiterService } from '../../src/auth/auth-rate-limiter.service';
import { EcommerceOrdersService } from '../../src/ecommerce-orders/ecommerce-orders.service';
import { PaymentResourceType } from '../../src/payments/dto/create-transfer-payment.dto';
import { PaymentsService } from '../../src/payments/payments.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SubscriptionsService } from '../../src/subscriptions/subscriptions.service';
import { resetAuditDatabase } from '../helpers/audit-db';

const prisma = new PrismaClient();
const prismaService = prisma as unknown as PrismaService;

const transferConfig = {
  get: jest.fn((key: string) => ({
    TRANSFER_BANK_NAME: 'Banco QA',
    TRANSFER_ACCOUNT_HOLDER: 'Nexo QA',
    TRANSFER_CLABE: '000000000000000000',
  })[key]),
} as unknown as ConfigService;

async function createUser(email: string, role: RolUsuario = 'CLIENTE'): Promise<Usuario> {
  return prisma.usuario.create({
    data: {
      nombre: 'Usuario QA',
      email,
      emailNormalizado: email,
      passwordHash: 'synthetic-test-hash',
      rol: role,
    },
  });
}

function fulfilledCount(results: PromiseSettledResult<unknown>[]): number {
  return results.filter((result) => result.status === 'fulfilled').length;
}

describe('database concurrency and atomicity', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetAuditDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates at most one active or pending subscription per customer', async () => {
    const user = await createUser('subscription-race@example.test');
    const level = await prisma.nivelMembresia.create({
      data: { nombre: 'QA Pro', precioMensual: 299 },
    });
    const service = new SubscriptionsService(prismaService);

    const attempts = await Promise.allSettled(
      Array.from({ length: 10 }, () => service.create(user.id, { levelId: level.id })),
    );

    expect(fulfilledCount(attempts)).toBe(1);
    expect(await prisma.suscripcion.count({ where: { usuarioId: user.id } })).toBe(1);
  });

  it('does not oversell the final product unit', async () => {
    const [firstUser, secondUser] = await Promise.all([
      createUser('stock-one@example.test'),
      createUser('stock-two@example.test'),
    ]);
    const product = await prisma.producto.create({
      data: { slug: 'last-office-license', nombre: 'Office QA', tipo: 'LICENCIA_OFFICE', precio: 500, stock: 1 },
    });
    const service = new EcommerceOrdersService(prismaService);

    const attempts = await Promise.allSettled([
      service.create(firstUser.id, { items: [{ productId: product.id, quantity: 1 }] }),
      service.create(secondUser.id, { items: [{ productId: product.id, quantity: 1 }] }),
    ]);

    expect(fulfilledCount(attempts)).toBe(1);
    expect((await prisma.producto.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(0);
    expect(await prisma.ordenEcommerce.count()).toBe(1);
    expect(await prisma.itemOrdenEcommerce.count()).toBe(1);
  });

  it('creates at most one pending transfer for the same resource', async () => {
    const user = await createUser('payment-race@example.test');
    const level = await prisma.nivelMembresia.create({
      data: { nombre: 'QA Basic', precioMensual: 149 },
    });
    const subscription = await prisma.suscripcion.create({
      data: {
        usuarioId: user.id,
        nivelId: level.id,
        precioMensualAplicado: 149,
        fechaCorte: new Date(Date.now() + 30 * 86_400_000),
      },
    });
    const service = new PaymentsService(prismaService, transferConfig);

    const attempts = await Promise.allSettled(
      Array.from({ length: 10 }, () => service.createTransferPayment(user.id, {
        resourceType: PaymentResourceType.SUBSCRIPTION,
        resourceId: subscription.id,
      })),
    );

    expect(fulfilledCount(attempts)).toBe(1);
    expect(await prisma.pago.count({ where: { suscripcionId: subscription.id } })).toBe(1);
  });

  it('accepts only one receipt submission for a pending payment', async () => {
    const user = await createUser('receipt-race@example.test');
    const level = await prisma.nivelMembresia.create({ data: { nombre: 'QA Receipt', precioMensual: 149 } });
    const subscription = await prisma.suscripcion.create({
      data: { usuarioId: user.id, nivelId: level.id, precioMensualAplicado: 149, fechaCorte: new Date(Date.now() + 30 * 86_400_000) },
    });
    const payment = await prisma.pago.create({
      data: { referencia: 'TRF-RECEIPT-RACE', usuarioId: user.id, origen: 'SUSCRIPCION', suscripcionId: subscription.id, metodo: 'TRANSFERENCIA', monto: 149 },
    });
    const service = new PaymentsService(prismaService, transferConfig);

    const attempts = await Promise.allSettled([
      service.submitReceipt(user.id, payment.id, { transferReference: 'FIRST', senderName: 'First QA', receiptUrl: 'https://example.test/first.png' }),
      service.submitReceipt(user.id, payment.id, { transferReference: 'SECOND', senderName: 'Second QA', receiptUrl: 'https://example.test/second.png' }),
    ]);

    expect(fulfilledCount(attempts)).toBe(1);
    expect((await prisma.pago.findUniqueOrThrow({ where: { id: payment.id } })).estado).toBe('COMPROBANTE_ENVIADO');
  });

  it('allows exactly one terminal review and keeps payment/resource states coherent', async () => {
    const [user, admin] = await Promise.all([
      createUser('review-customer@example.test'),
      createUser('review-admin@example.test', 'ADMIN'),
    ]);
    const level = await prisma.nivelMembresia.create({ data: { nombre: 'QA Review', precioMensual: 149 } });
    const subscription = await prisma.suscripcion.create({
      data: { usuarioId: user.id, nivelId: level.id, precioMensualAplicado: 149, fechaCorte: new Date(Date.now() + 30 * 86_400_000) },
    });
    const payment = await prisma.pago.create({
      data: {
        referencia: 'TRF-REVIEW-RACE', usuarioId: user.id, origen: 'SUSCRIPCION', suscripcionId: subscription.id,
        metodo: 'TRANSFERENCIA', monto: 149, estado: 'COMPROBANTE_ENVIADO', comprobanteEnviadoEn: new Date(),
      },
    });
    const service = new PaymentsService(prismaService, transferConfig);

    const attempts = await Promise.allSettled([
      service.reviewTransfer(admin.id, 'ADMIN', payment.id, { approved: true }),
      service.reviewTransfer(admin.id, 'ADMIN', payment.id, { approved: false }),
    ]);
    const [storedPayment, storedSubscription] = await Promise.all([
      prisma.pago.findUniqueOrThrow({ where: { id: payment.id } }),
      prisma.suscripcion.findUniqueOrThrow({ where: { id: subscription.id } }),
    ]);

    expect(fulfilledCount(attempts)).toBe(1);
    const expectedSubscriptionStatus = storedPayment.estado === EstadoPago.APROBADO ? 'ACTIVA' : 'PENDIENTE_PAGO';
    expect(storedSubscription.estado).toBe(expectedSubscriptionStatus);
  });

  it('maps concurrent duplicate registration to a controlled conflict', async () => {
    const jwtService = new JwtService();
    const authConfig = {
      get: jest.fn(),
      getOrThrow: jest.fn((key: string) => key === 'JWT_ACCESS_SECRET' ? 'audit-access-secret-32-characters' : 'audit-refresh-secret-32-characters'),
    } as unknown as ConfigService;
    const service = new AuthService(prismaService, jwtService, authConfig, new AuthRateLimiterService());
    const dto = { nombre: 'Registro QA', email: 'registration-race@example.test', password: 'Segura123!x' };

    const attempts = await Promise.allSettled([
      service.register(dto, {}),
      service.register(dto, {}),
      service.register(dto, {}),
    ]);
    const rejected = attempts.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

    expect(fulfilledCount(attempts)).toBe(1);
    expect(rejected).toHaveLength(2);
    expect(rejected.every((result) => result.reason instanceof ConflictException)).toBe(true);
    expect(await prisma.usuario.count({ where: { emailNormalizado: dto.email } })).toBe(1);
  });
});
