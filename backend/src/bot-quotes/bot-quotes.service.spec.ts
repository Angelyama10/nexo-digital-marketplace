import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BotQuotesService } from './bot-quotes.service';

describe('BotQuotesService', () => {
  it('creates a quote using a snapshot of each selected function price', async () => {
    const createQuote = jest.fn().mockResolvedValue({
      id: 'quote-id', referencia: 'BOT-reference', totalEstimado: new Prisma.Decimal(1600),
      moneda: 'MXN', estado: 'ENVIADA', vigenteHasta: new Date('2026-08-07T00:00:00.000Z'),
    });
    const prismaMock = {
      usuario: { findUnique: jest.fn().mockResolvedValue({ activo: true }) },
      funcionBot: { findMany: jest.fn().mockResolvedValue([
        { id: 'function-a', precioBase: new Prisma.Decimal(650) },
        { id: 'function-b', precioBase: new Prisma.Decimal(950) },
      ]) },
      $transaction: jest.fn().mockImplementation((callback: (transaction: { cotizacionBot: { create: typeof createQuote } }) => unknown) => (
        callback({ cotizacionBot: { create: createQuote } })
      )),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [BotQuotesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    const service = module.get<BotQuotesService>(BotQuotesService);

    const result = await service.createQuote('3d694da9-43b3-4dff-9d3c-b0d873e74400', {
      funcionIds: ['function-a', 'function-b'],
    });

    expect(result.estimatedTotal).toBe(1600);
    expect(createQuote).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ totalEstimado: new Prisma.Decimal(1600) }),
    }));
  });
});
