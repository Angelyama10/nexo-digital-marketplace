import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { configureApplication } from '../../src/app.setup';
import { resetAuditDatabase } from '../helpers/audit-db';

type JsonRecord = Record<string, unknown>;
type HttpResult<T = JsonRecord> = {
  status: number;
  body: T;
  headers: Headers;
};

const prisma = new PrismaClient();
let app: INestApplication;
let baseUrl: string;

async function request<T = JsonRecord>(
  path: string,
  init: RequestInit & { token?: string; cookie?: string } = {},
): Promise<HttpResult<T>> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  if (init.token) headers.set('authorization', `Bearer ${init.token}`);
  if (init.cookie) headers.set('cookie', init.cookie);
  const response = await fetch(`${baseUrl}/api${path}`, { ...init, headers });
  const text = await response.text();
  return {
    status: response.status,
    body: (text ? JSON.parse(text) : {}) as T,
    headers: response.headers,
  };
}

async function register(email: string, password = 'Segura123!x', extra: JsonRecord = {}) {
  return request<{ accessToken: string; user: { id: string; email: string; role: string } }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombre: 'Cliente QA', email, password, ...extra }),
  });
}

function cookieFrom(result: HttpResult<unknown>): string {
  return result.headers.get('set-cookie')?.split(';')[0] ?? '';
}

async function seedCommerce() {
  const [level, product, botFunction] = await Promise.all([
    prisma.nivelMembresia.create({ data: { nombre: 'Plan E2E', precioMensual: 299 } }),
    prisma.producto.create({ data: { slug: 'office-e2e', nombre: 'Office E2E', tipo: 'LICENCIA_OFFICE', precio: 799, stock: 10 } }),
    prisma.funcionBot.create({ data: { slug: 'bot-e2e', nombre: 'Bot E2E', precioBase: 600 } }),
  ]);
  return { level, product, botFunction };
}

describe('Nexo HTTP E2E', () => {
  beforeAll(async () => {
    await prisma.$connect();
    const testingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = testingModule.createNestApplication();
    app.useLogger(false);
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  beforeEach(async () => {
    await resetAuditDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('serves health and the public catalogs without authentication', async () => {
    await seedCommerce();

    const [health, products, memberships, functions] = await Promise.all([
      request<{ status: string }>('/health'),
      request<unknown[]>('/products'),
      request<unknown[]>('/membership-levels'),
      request<unknown[]>('/bot-functions'),
    ]);

    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');
    expect(products.status).toBe(200);
    expect(products.body).toHaveLength(1);
    expect(memberships.body).toHaveLength(1);
    expect(functions.body).toHaveLength(1);
  });

  it('registers, normalizes email, hashes the password and sets a protected refresh cookie', async () => {
    const result = await register('  PERSONA@EXAMPLE.TEST  ');

    expect(result.status).toBe(201);
    expect(result.body.user.email).toBe('persona@example.test');
    expect(result.body.user.role).toBe('CLIENTE');
    const setCookie = result.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('nexo_refresh=');
    expect(setCookie.toLowerCase()).toContain('httponly');
    expect(setCookie.toLowerCase()).toContain('samesite=lax');
    expect(setCookie).toContain('Path=/api/auth');
    const stored = await prisma.usuario.findUniqueOrThrow({ where: { emailNormalizado: 'persona@example.test' } });
    expect(stored.passwordHash).not.toContain('Segura123!x');
    expect(stored.passwordHash.startsWith('$argon2id$')).toBe(true);
  });

  it.each([
    ['invalid email', { email: 'not-an-email', password: 'Segura123!x' }],
    ['weak password', { email: 'weak@example.test', password: 'password' }],
    ['empty name', { email: 'empty@example.test', password: 'Segura123!x', nombre: '   ' }],
    ['unknown role field', { email: 'role@example.test', password: 'Segura123!x', rol: 'ADMIN' }],
  ])('rejects invalid registration input: %s', async (_label, values) => {
    const result = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'Cliente QA', ...values }),
    });

    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).not.toMatch(/Prisma|stack|node_modules/i);
  });

  it('returns a controlled conflict for a duplicate normalized email', async () => {
    expect((await register('duplicate@example.test')).status).toBe(201);
    const duplicate = await register('DUPLICATE@example.test');

    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toMatchObject({ statusCode: 409, message: 'Ya existe una cuenta con ese correo.' });
  });

  it('uses the same generic login error for a bad password and an unknown user', async () => {
    await register('login@example.test');
    const badPassword = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ email: 'login@example.test', password: 'Incorrecta123!' }),
    });
    const unknown = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ email: 'unknown@example.test', password: 'Incorrecta123!' }),
    });

    expect(badPassword.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(badPassword.body).toMatchObject({ message: 'Correo o contraseña incorrectos.' });
    expect(unknown.body).toMatchObject({ message: 'Correo o contraseña incorrectos.' });
  });

  it('rotates refresh tokens and rejects replay of the previous cookie', async () => {
    const session = await register('refresh@example.test');
    const oldCookie = cookieFrom(session);
    const refreshed = await request<{ accessToken: string }>('/auth/refresh', { method: 'POST', cookie: oldCookie });
    const replay = await request('/auth/refresh', { method: 'POST', cookie: oldCookie });

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toEqual(expect.any(String));
    expect(cookieFrom(refreshed)).not.toBe(oldCookie);
    expect(replay.status).toBe(401);
  });

  it('invalidates both refresh and access credentials on logout', async () => {
    const session = await register('logout@example.test');
    const token = session.body.accessToken;
    const cookie = cookieFrom(session);

    expect((await request('/auth/me', { token })).status).toBe(200);
    expect((await request('/auth/logout', { method: 'POST', token, cookie })).status).toBe(204);
    expect((await request('/auth/me', { token })).status).toBe(401);
    expect((await request('/auth/refresh', { method: 'POST', cookie })).status).toBe(401);
  });

  it('rejects protected endpoints without a valid bearer token', async () => {
    const missing = await request('/subscriptions', { method: 'POST', body: JSON.stringify({ levelId: crypto.randomUUID() }) });
    const invalid = await request('/subscriptions', { method: 'POST', token: 'invalid.jwt.token', body: JSON.stringify({ levelId: crypto.randomUUID() }) });

    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
  });

  it('completes an ecommerce transfer flow with server-owned prices and an admin review', async () => {
    const { product } = await seedCommerce();
    const customer = await register('buyer@example.test');
    const adminRegistration = await register('admin@example.test');
    await prisma.usuario.update({ where: { id: adminRegistration.body.user.id }, data: { rol: 'ADMIN' } });
    const adminLogin = await request<{ accessToken: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email: 'admin@example.test', password: 'Segura123!x' }),
    });

    const order = await request<{ id: string; total: number; status: string }>('/ecommerce-orders', {
      method: 'POST', token: customer.body.accessToken,
      body: JSON.stringify({ items: [{ productId: product.id, quantity: 2 }] }),
    });
    expect(order.status).toBe(201);
    expect(order.body.total).toBe(1598);
    expect(order.body.status).toBe('PENDIENTE');

    const payment = await request<{ paymentId: string; amount: number; status: string }>('/payments/transfer', {
      method: 'POST', token: customer.body.accessToken,
      body: JSON.stringify({ resourceType: 'ECOMMERCE_ORDER', resourceId: order.body.id, amount: 0.01, currency: 'USD' }),
    });
    expect(payment.status).toBe(400);

    const validPayment = await request<{ paymentId: string; amount: number; status: string }>('/payments/transfer', {
      method: 'POST', token: customer.body.accessToken,
      body: JSON.stringify({ resourceType: 'ECOMMERCE_ORDER', resourceId: order.body.id }),
    });
    expect(validPayment.status).toBe(201);
    expect(validPayment.body.amount).toBe(1598);

    const receipt = await request(`/payments/${validPayment.body.paymentId}/receipt`, {
      method: 'POST', token: customer.body.accessToken,
      body: JSON.stringify({ transferReference: 'E2E-123456', senderName: 'Cliente QA', receiptUrl: 'https://receipts.example.test/e2e.png' }),
    });
    expect(receipt.status).toBe(201);

    expect((await request('/payments/review-queue', { token: customer.body.accessToken })).status).toBe(403);
    const queue = await request<Array<{ paymentId: string }>>('/payments/review-queue', { token: adminLogin.body.accessToken });
    expect(queue.status).toBe(200);
    expect(queue.body.map((item) => item.paymentId)).toContain(validPayment.body.paymentId);

    const review = await request(`/payments/${validPayment.body.paymentId}/review`, {
      method: 'POST', token: adminLogin.body.accessToken, body: JSON.stringify({ approved: true, note: 'Aprobado por E2E' }),
    });
    expect(review.status).toBe(200);
    expect((await prisma.ordenEcommerce.findUniqueOrThrow({ where: { id: order.body.id } })).estado).toBe('PAGADA');
    expect((await prisma.producto.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(8);
  });

  it('prevents one customer from paying another customer resource', async () => {
    const { level } = await seedCommerce();
    const owner = await register('owner@example.test');
    const attacker = await register('attacker@example.test');
    const subscription = await request<{ id: string }>('/subscriptions', {
      method: 'POST', token: owner.body.accessToken, body: JSON.stringify({ levelId: level.id }),
    });

    const result = await request('/payments/transfer', {
      method: 'POST', token: attacker.body.accessToken,
      body: JSON.stringify({ resourceType: 'SUBSCRIPTION', resourceId: subscription.body.id }),
    });

    expect(result.status).toBe(404);
  });

  it('deduplicates repeated ecommerce requests with the same idempotency key', async () => {
    const { product } = await seedCommerce();
    const customer = await register('idempotent-order@example.test');
    const body = JSON.stringify({ items: [{ productId: product.id, quantity: 1 }] });
    const headers = { 'Idempotency-Key': 'e2e-order-00000001' };

    const first = await request<{ id: string }>('/ecommerce-orders', { method: 'POST', token: customer.body.accessToken, headers, body });
    const repeated = await request<{ id: string }>('/ecommerce-orders', { method: 'POST', token: customer.body.accessToken, headers, body });

    expect(first.status).toBe(201);
    expect(repeated.status).toBe(201);
    expect(repeated.body.id).toBe(first.body.id);
    expect(await prisma.ordenEcommerce.count({ where: { usuarioId: customer.body.user.id } })).toBe(1);
    expect((await prisma.producto.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(9);
  });

  it('rejects reuse of an ecommerce idempotency key with a different payload', async () => {
    const { product } = await seedCommerce();
    const customer = await register('idempotent-mismatch@example.test');
    const headers = { 'Idempotency-Key': 'e2e-order-mismatch-0001' };

    const first = await request('/ecommerce-orders', {
      method: 'POST', token: customer.body.accessToken, headers,
      body: JSON.stringify({ items: [{ productId: product.id, quantity: 1 }] }),
    });
    const mismatch = await request('/ecommerce-orders', {
      method: 'POST', token: customer.body.accessToken, headers,
      body: JSON.stringify({ items: [{ productId: product.id, quantity: 2 }] }),
    });

    expect(first.status).toBe(201);
    expect(mismatch.status).toBe(409);
    expect(await prisma.ordenEcommerce.count()).toBe(1);
    expect((await prisma.producto.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(9);
  });

  it('deduplicates subscriptions with an idempotency key', async () => {
    const { level } = await seedCommerce();
    const customer = await register('idempotent-subscription@example.test');
    const headers = { 'Idempotency-Key': 'e2e-subscription-0001' };
    const body = JSON.stringify({ levelId: level.id });

    const first = await request<{ id: string }>('/subscriptions', { method: 'POST', token: customer.body.accessToken, headers, body });
    const repeated = await request<{ id: string }>('/subscriptions', { method: 'POST', token: customer.body.accessToken, headers, body });

    expect(first.status).toBe(201);
    expect(repeated.status).toBe(201);
    expect(repeated.body.id).toBe(first.body.id);
    expect(await prisma.suscripcion.count({ where: { usuarioId: customer.body.user.id } })).toBe(1);
  });

  it('deduplicates online orders and rejects malformed idempotency keys', async () => {
    const customer = await register('idempotent-online@example.test');
    const body = JSON.stringify({ urlProducto: 'https://shop.example.test/item', montoProducto: 1000 });
    const headers = { 'Idempotency-Key': 'e2e-online-order-0001' };

    const malformed = await request('/online-orders', {
      method: 'POST', token: customer.body.accessToken,
      headers: { 'Idempotency-Key': 'short' }, body,
    });
    const first = await request<{ id: string }>('/online-orders', { method: 'POST', token: customer.body.accessToken, headers, body });
    const repeated = await request<{ id: string }>('/online-orders', { method: 'POST', token: customer.body.accessToken, headers, body });

    expect(malformed.status).toBe(400);
    expect(first.status).toBe(201);
    expect(repeated.status).toBe(201);
    expect(repeated.body.id).toBe(first.body.id);
    expect(await prisma.pedidoOnline.count({ where: { usuarioId: customer.body.user.id } })).toBe(1);
  });

  it('deduplicates bot quotes with an idempotency key', async () => {
    const { botFunction } = await seedCommerce();
    const customer = await register('idempotent-bot@example.test');
    const headers = { 'Idempotency-Key': 'e2e-bot-quote-00001' };
    const body = JSON.stringify({ funcionIds: [botFunction.id], descripcion: 'Bot sintético E2E' });

    const first = await request<{ id: string }>('/bot-quotes', { method: 'POST', token: customer.body.accessToken, headers, body });
    const repeated = await request<{ id: string }>('/bot-quotes', { method: 'POST', token: customer.body.accessToken, headers, body });

    expect(first.status).toBe(201);
    expect(repeated.status).toBe(201);
    expect(repeated.body.id).toBe(first.body.id);
    expect(await prisma.cotizacionBot.count({ where: { usuarioId: customer.body.user.id } })).toBe(1);
  });

  it('deduplicates transfer creation with an idempotency key', async () => {
    const { level } = await seedCommerce();
    const customer = await register('idempotent-payment@example.test');
    const subscription = await request<{ id: string }>('/subscriptions', {
      method: 'POST', token: customer.body.accessToken, body: JSON.stringify({ levelId: level.id }),
    });
    const headers = { 'Idempotency-Key': 'e2e-transfer-payment-01' };
    const body = JSON.stringify({ resourceType: 'SUBSCRIPTION', resourceId: subscription.body.id });

    const first = await request<{ paymentId: string }>('/payments/transfer', { method: 'POST', token: customer.body.accessToken, headers, body });
    const repeated = await request<{ paymentId: string }>('/payments/transfer', { method: 'POST', token: customer.body.accessToken, headers, body });

    expect(first.status).toBe(201);
    expect(repeated.status).toBe(201);
    expect(repeated.body.paymentId).toBe(first.body.paymentId);
    expect(await prisma.pago.count({ where: { usuarioId: customer.body.user.id } })).toBe(1);
  });
});
