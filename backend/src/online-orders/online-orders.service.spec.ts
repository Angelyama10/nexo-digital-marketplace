import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OnlineOrdersService } from './online-orders.service';

describe('OnlineOrdersService', () => {
  it('calculates the commission and total from the product amount', async () => {
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnlineOrdersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    const service = module.get<OnlineOrdersService>(OnlineOrdersService);

    const result = await service.create('3d694da9-43b3-4dff-9d3c-b0d873e74400', {
      urlProducto: 'https://ejemplo.com/producto',
      montoProducto: 1000,
    });

    expect(result.commissionAmount).toBe(150);
    expect(result.totalAmount).toBe(1150);
    expect(prismaMock.pedidoOnline.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ montoComision: new Prisma.Decimal(150), montoTotal: new Prisma.Decimal(1150) }),
    }));
  });
});
