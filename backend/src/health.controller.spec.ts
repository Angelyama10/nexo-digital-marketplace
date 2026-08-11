import { HealthController } from './health.controller';
import { PrismaService } from './prisma/prisma.service';

describe('HealthController', () => {
  const queryRaw = jest.fn();
  const controller = new HealthController({ $queryRaw: queryRaw } as unknown as PrismaService);

  beforeEach(() => queryRaw.mockReset());

  it('reports the database as available after a successful probe', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.check()).resolves.toMatchObject({
      status: 'ok',
      service: 'nexo-backend',
      dependencies: { database: 'ok' },
    });
  });

  it('returns a controlled 503 without leaking the database error', async () => {
    queryRaw.mockRejectedValue(new Error('postgresql://secret@database/internal'));

    await expect(controller.check()).rejects.toMatchObject({
      status: 503,
      response: {
        status: 'error',
        service: 'nexo-backend',
        dependencies: { database: 'unavailable' },
      },
    });
  });
});
