import { Prisma } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { OnlineOrdersService } from '../../src/online-orders/online-orders.service';

describe('OnlineOrdersService pricing controls', () => {
  it('always calculates the server-owned 15% commission', async () => {
    const prismaMock = {
      usuario: { findUnique: jest.fn().mockResolvedValue({ activo: true }) },
      pedidoOnline: {
        create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({
          ...data,
          id: 'order-id',
          estado: 'SOLICITADO',
        })),
      },
    };
    const service = new OnlineOrdersService(prismaMock as unknown as PrismaService);

    const result = await service.create('user-id', {
      urlProducto: 'https://shop.example.test/producto',
      montoProducto: 1000,
      porcentajeComision: 0.01,
    } as Parameters<OnlineOrdersService['create']>[1] & { porcentajeComision: number });

    expect(result.commissionPercentage).toBe(15);
    expect(result.commissionAmount).toBe(150);
    expect(result.totalAmount).toBe(1150);
    expect(prismaMock.pedidoOnline.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        porcentajeComision: new Prisma.Decimal(15),
        montoTotal: new Prisma.Decimal(1150),
      }),
    }));
  });
});
