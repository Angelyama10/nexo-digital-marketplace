import { ServicesService } from './services.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';

describe('ServicesService', () => {
  let service: ServicesService;

  beforeEach(async () => {
    const prismaMock = {
      servicioDigital: {
        findMany: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  it('returns an empty catalog when there are no active services', async () => {
    const prisma = service['prisma'] as unknown as { servicioDigital: { findMany: jest.Mock } };
    prisma.servicioDigital.findMany.mockResolvedValue([]);
    const catalog = await service.findAll();

    expect(catalog).toEqual([]);
  });

  it('queries only active featured services', async () => {
    const prisma = service['prisma'] as unknown as { servicioDigital: { findMany: jest.Mock } };
    prisma.servicioDigital.findMany.mockResolvedValue([]);
    const featured = await service.findFeatured();

    expect(featured).toEqual([]);
    expect(prisma.servicioDigital.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { activo: true, destacado: true } }));
  });
});
