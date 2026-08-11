import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { configureApplication } from '../../src/app.setup';
import { resetAuditDatabase } from '../helpers/audit-db';

type HttpResult<T = Record<string, unknown>> = { status: number; body: T; headers: Headers };

const prisma = new PrismaClient();
let app: INestApplication;
let baseUrl: string;

async function request<T = Record<string, unknown>>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<HttpResult<T>> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  if (init.token) headers.set('authorization', `Bearer ${init.token}`);
  const response = await fetch(`${baseUrl}/api${path}`, { ...init, headers });
  const text = await response.text();
  return { status: response.status, body: (text ? JSON.parse(text) : {}) as T, headers: response.headers };
}

async function register(email: string) {
  return request<{ accessToken: string; user: { id: string } }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombre: 'API QA', email, password: 'Segura123!x' }),
  });
}

describe('API validation boundaries', () => {
  beforeAll(async () => {
    await prisma.$connect();
    const testingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = testingModule.createNestApplication();
    app.useLogger(false);
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  beforeEach(async () => resetAuditDatabase(prisma));

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('rejects missing, negative, oversized and unknown mutation inputs', async () => {
    const session = await register('boundaries@example.test');
    const token = session.body.accessToken;
    const cases: Array<[string, Record<string, unknown>]> = [
      ['/subscriptions', {}],
      ['/subscriptions', { levelId: crypto.randomUUID(), price: 0.01 }],
      ['/ecommerce-orders', { items: [] }],
      ['/ecommerce-orders', { items: [{ productId: crypto.randomUUID(), quantity: -1 }] }],
      ['/online-orders', { urlProducto: 'https://example.test/item', montoProducto: -1 }],
      ['/online-orders', { urlProducto: 'https://example.test/item', montoProducto: 100_000_000 }],
      ['/online-orders', { urlProducto: 'file:///etc/passwd', montoProducto: 100 }],
      ['/bot-quotes', { funcionIds: [] }],
      ['/payments/transfer', { resourceType: 'UNKNOWN', resourceId: crypto.randomUUID() }],
    ];

    for (const [path, body] of cases) {
      const result = await request(path, { method: 'POST', token, body: JSON.stringify(body) });
      expect(result.status).toBe(400);
      expect(JSON.stringify(result.body)).not.toMatch(/Prisma|stack|node_modules|SELECT |INSERT /i);
    }
  });

  it('rejects oversized carts and bot function arrays at the HTTP boundary', async () => {
    const session = await register('arrays@example.test');
    const items = Array.from({ length: 51 }, () => ({ productId: crypto.randomUUID(), quantity: 1 }));
    const funcionIds = Array.from({ length: 26 }, () => crypto.randomUUID());

    const cart = await request('/ecommerce-orders', {
      method: 'POST', token: session.body.accessToken, body: JSON.stringify({ items }),
    });
    const bot = await request('/bot-quotes', {
      method: 'POST', token: session.body.accessToken, body: JSON.stringify({ funcionIds }),
    });

    expect(cart.status).toBe(400);
    expect(bot.status).toBe(400);
  });

  it('returns controlled status codes for invalid and nonexistent UUIDs', async () => {
    const session = await register('ids@example.test');
    const invalidPath = await request('/payments/not-a-uuid/receipt', {
      method: 'POST', token: session.body.accessToken,
      body: JSON.stringify({ transferReference: 'ABC123', senderName: 'QA', receiptUrl: 'https://example.test/r.png' }),
    });
    const missingLevel = await request('/subscriptions', {
      method: 'POST', token: session.body.accessToken, body: JSON.stringify({ levelId: crypto.randomUUID() }),
    });

    expect(invalidPath.status).toBe(400);
    expect(missingLevel.status).toBe(404);
    expect(JSON.stringify(invalidPath.body)).not.toMatch(/stack|Prisma/i);
    expect(JSON.stringify(missingLevel.body)).not.toMatch(/stack|Prisma/i);
  });

  it('rejects malformed JSON without exposing parser internals', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"nombre":',
    });
    const text = await response.text();

    expect(response.status).toBe(400);
    expect(text).not.toMatch(/stack|node_modules|SyntaxError/i);
  });

  it('rejects object-shaped credentials and SQL-injection strings safely', async () => {
    const objectInput = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ email: { $ne: null }, password: { $ne: null } }),
    });
    const injection = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ email: "qa' OR '1'='1@example.test", password: "' OR 1=1 --xxxx" }),
    });

    expect(objectInput.status).toBe(400);
    expect([400, 401]).toContain(injection.status);
    expect(JSON.stringify(injection.body)).not.toMatch(/syntax|query|Prisma|database/i);
  });

  it('does not allow another customer to submit a receipt', async () => {
    const [owner, attacker] = await Promise.all([
      register('receipt-owner@example.test'),
      register('receipt-attacker@example.test'),
    ]);
    const level = await prisma.nivelMembresia.create({ data: { nombre: 'Receipt API', precioMensual: 149 } });
    const subscription = await prisma.suscripcion.create({
      data: { usuarioId: owner.body.user.id, nivelId: level.id, precioMensualAplicado: 149, fechaCorte: new Date(Date.now() + 30 * 86_400_000) },
    });
    const payment = await prisma.pago.create({
      data: { referencia: 'API-IDOR-RECEIPT', usuarioId: owner.body.user.id, origen: 'SUSCRIPCION', suscripcionId: subscription.id, monto: 149 },
    });

    const result = await request(`/payments/${payment.id}/receipt`, {
      method: 'POST', token: attacker.body.accessToken,
      body: JSON.stringify({ transferReference: 'ATTACKER-123', senderName: 'Attacker', receiptUrl: 'https://example.test/attacker.png' }),
    });

    expect(result.status).toBe(404);
    expect((await prisma.pago.findUniqueOrThrow({ where: { id: payment.id } })).estado).toBe('PENDIENTE');
  });

  it('emits CORS headers only for the configured frontend origin', async () => {
    const allowed = await fetch(`${baseUrl}/api/health`, { headers: { origin: 'http://audit-frontend' } });
    const denied = await fetch(`${baseUrl}/api/health`, { headers: { origin: 'https://evil.example.test' } });

    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://audit-frontend');
    expect(allowed.headers.get('access-control-allow-credentials')).toBe('true');
    expect(denied.headers.get('access-control-allow-origin')).not.toBe('https://evil.example.test');
  });
});
