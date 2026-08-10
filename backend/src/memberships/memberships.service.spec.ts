import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipsService } from './memberships.service';

describe('MembershipsService', () => {
  it('queries only active membership levels', async () => {
    const prismaMock = { nivelMembresia: { findMany: jest.fn().mockResolvedValue([]) } };
    const module: TestingModule = await Test.createTestingModule({
      providers: [MembershipsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    const service = module.get<MembershipsService>(MembershipsService);
    await expect(service.findAll()).resolves.toEqual([]);
    expect(prismaMock.nivelMembresia.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { activo: true } }));
  });
});
