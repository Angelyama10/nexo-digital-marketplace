import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { configureApplication } from '../../src/app.setup';
import { resetAuditDatabase } from '../helpers/audit-db';

type Result<T = Record<string, unknown>> = { status: number; body: T; headers: Headers };

const prisma = new PrismaClient();
const jwt = new JwtService();
let app: INestApplication;
let baseUrl: string;

async function request<T = Record<string, unknown>>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<Result<T>> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  if (init.token) headers.set('authorization', `Bearer ${init.token}`);
  const response = await fetch(`${baseUrl}/api${path}`, { ...init, headers });
  const text = await response.text();
  return { status: response.status, body: (text ? JSON.parse(text) : {}) as T, headers: response.headers };
}

async function register(email: string) {
  return request<{ accessToken: string; user: { id: string; role: string } }>('/auth/register', {
    method: 'POST', body: JSON.stringify({ nombre: 'Security QA', email, password: 'Segura123!x' }),
  });
}

describe('authentication and HTTP security controls', () => {
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

  it('rejects tampered, unsigned and expired access tokens', async () => {
    const session = await register('jwt@example.test');
    const storedSession = await prisma.sesion.findFirstOrThrow({ where: { usuarioId: session.body.user.id } });
    const parts = session.body.accessToken.split('.');
    const tampered = `${parts[0]}.${parts[1]}.${parts[2].slice(0, -1)}x`;
    const unsigned = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${parts[1]}.`;
    const expired = await jwt.signAsync(
      { sub: session.body.user.id, email: 'jwt@example.test', role: 'CLIENTE', sid: storedSession.id },
      { secret: 'audit-access-secret-change-only-inside-tests', expiresIn: -1 },
    );

    expect((await request('/auth/me', { token: tampered })).status).toBe(401);
    expect((await request('/auth/me', { token: unsigned })).status).toBe(401);
    expect((await request('/auth/me', { token: expired })).status).toBe(401);
  });

  it('uses the database role instead of trusting a forged role claim', async () => {
    const session = await register('role-claim@example.test');
    const storedSession = await prisma.sesion.findFirstOrThrow({ where: { usuarioId: session.body.user.id } });
    const forgedRole = await jwt.signAsync(
      { sub: session.body.user.id, email: 'role-claim@example.test', role: 'ADMIN', sid: storedSession.id },
      { secret: 'audit-access-secret-change-only-inside-tests', expiresIn: '15m' },
    );

    expect((await request('/payments/review-queue', { token: forgedRole })).status).toBe(403);
  });

  it('rejects a valid token immediately after the user is disabled', async () => {
    const session = await register('disabled@example.test');
    await prisma.usuario.update({ where: { id: session.body.user.id }, data: { activo: false } });

    expect((await request('/auth/me', { token: session.body.accessToken })).status).toBe(401);
  });

  it('rate-limits repeated failed login attempts', async () => {
    await register('bruteforce@example.test');
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const result = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'bruteforce@example.test', password: 'Incorrecta123!' }),
      });
      statuses.push(result.status);
    }

    expect(statuses.slice(0, 5).every((status) => status === 401)).toBe(true);
    expect(statuses.slice(5).some((status) => status === 429)).toBe(true);
  });

  it('sets baseline API security headers and hides the Express signature', async () => {
    const result = await request('/health');

    expect(result.status).toBe(200);
    expect(result.headers.get('x-powered-by')).toBeNull();
    expect(result.headers.get('x-content-type-options')).toBe('nosniff');
    expect(result.headers.get('x-frame-options')).toBe('DENY');
    expect(result.headers.get('referrer-policy')).toBe('no-referrer');
    expect(result.headers.get('permissions-policy')).toContain('camera=()');
  });

  it('never exposes password or refresh-token hashes in auth responses', async () => {
    const session = await register('exposure@example.test');
    const profile = await request('/auth/me', { token: session.body.accessToken });
    const serialized = JSON.stringify({ registration: session.body, profile: profile.body });

    expect(serialized).not.toMatch(/passwordHash|refreshTokenHash|Segura123!x|nexo_refresh/i);
  });
});
