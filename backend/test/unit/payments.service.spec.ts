import { ConflictException, ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PaymentResourceType } from '../../src/payments/dto/create-transfer-payment.dto';
import { PaymentsService } from '../../src/payments/payments.service';
import { PrismaService } from '../../src/prisma/prisma.service';

const instructions = new Map<string, string>([
  ['TRANSFER_BANK_NAME', 'Banco de prueba'],
  ['TRANSFER_ACCOUNT_HOLDER', 'Nexo QA'],
  ['TRANSFER_CLABE', '000000000000000000'],
]);

function config(values = instructions): ConfigService {
  return { get: jest.fn((key: string) => values.get(key)) } as unknown as ConfigService;
}

describe('PaymentsService', () => {
  it('uses the backend subscription price and currency', async () => {
    const create = jest.fn().mockImplementation(({ data }) => Promise.resolve({
      ...data,
      id: 'payment-id',
      estado: 'PENDIENTE',
      monto: data.monto,
    }));
    const prismaMock = {
      usuario: { findFirst: jest.fn().mockResolvedValue({ id: 'user-id' }) },
      suscripcion: { findFirst: jest.fn().mockResolvedValue({ id: 'subscription-id', precioMensualAplicado: new Prisma.Decimal(499), moneda: 'MXN' }) },
      pago: { findFirst: jest.fn().mockResolvedValue(null), create },
    };
    const service = new PaymentsService(prismaMock as unknown as PrismaService, config());

    const result = await service.createTransferPayment('user-id', {
      resourceType: PaymentResourceType.SUBSCRIPTION,
      resourceId: 'subscription-id',
    });

    expect(result.amount).toBe(499);
    expect(result.currency).toBe('MXN');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ monto: new Prisma.Decimal(499), moneda: 'MXN' }),
    }));
  });

  it('does not disclose or accept a resource owned by another customer', async () => {
    const prismaMock = {
      usuario: { findFirst: jest.fn().mockResolvedValue({ id: 'user-id' }) },
      suscripcion: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new PaymentsService(prismaMock as unknown as PrismaService, config());

    await expect(service.createTransferPayment('user-id', {
      resourceType: PaymentResourceType.SUBSCRIPTION,
      resourceId: 'another-users-subscription',
    })).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.suscripcion.findFirst).toHaveBeenCalledWith({
      where: { id: 'another-users-subscription', usuarioId: 'user-id', estado: 'PENDIENTE_PAGO' },
    });
  });

  it('rejects a second pending payment for the same resource', async () => {
    const prismaMock = {
      usuario: { findFirst: jest.fn().mockResolvedValue({ id: 'user-id' }) },
      suscripcion: { findFirst: jest.fn().mockResolvedValue({ id: 'subscription-id', precioMensualAplicado: new Prisma.Decimal(149), moneda: 'MXN' }) },
      pago: { findFirst: jest.fn().mockResolvedValue({ id: 'existing-payment' }), create: jest.fn() },
    };
    const service = new PaymentsService(prismaMock as unknown as PrismaService, config());

    await expect(service.createTransferPayment('user-id', {
      resourceType: PaymentResourceType.SUBSCRIPTION,
      resourceId: 'subscription-id',
    })).rejects.toBeInstanceOf(ConflictException);
    expect(prismaMock.pago.create).not.toHaveBeenCalled();
  });

  it('only lets an administrator review a transfer', async () => {
    const service = new PaymentsService({} as PrismaService, config());

    await expect(service.reviewTransfer('reviewer-id', 'CLIENTE', 'payment-id', {
      approved: true,
    })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('only lets the payment owner submit its receipt', async () => {
    const prismaMock = {
      pago: { updateMany: jest.fn().mockResolvedValue({ count: 0 }), findUniqueOrThrow: jest.fn() },
    };
    const service = new PaymentsService(prismaMock as unknown as PrismaService, config());

    await expect(service.submitReceipt('user-id', 'payment-id', {
      transferReference: '123456',
      senderName: 'Cliente QA',
      receiptUrl: 'https://files.example.test/receipt.png',
    })).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.pago.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'payment-id', usuarioId: 'user-id', metodo: 'TRANSFERENCIA', estado: 'PENDIENTE' },
    }));
  });

  it('fails closed when bank instructions are incomplete', async () => {
    const service = new PaymentsService({} as PrismaService, config(new Map()));

    await expect(service.createTransferPayment('user-id', {
      resourceType: PaymentResourceType.SUBSCRIPTION,
      resourceId: 'subscription-id',
    })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
