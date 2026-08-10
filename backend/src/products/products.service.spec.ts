import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  it('queries only active products', async () => {
    const prismaMock = { producto: { findMany: jest.fn().mockResolvedValue([]) } };
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    const service = module.get<ProductsService>(ProductsService);
    await expect(service.findAll()).resolves.toEqual([]);
    expect(prismaMock.producto.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { activo: true } }));
  });
});
