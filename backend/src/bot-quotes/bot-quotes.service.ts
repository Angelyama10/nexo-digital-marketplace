import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { assertSameIdempotentRequest, idempotencyFingerprint } from '../common/idempotency';
import { PrismaService } from '../prisma/prisma.service';
import { BotFunctionDto } from './dto/bot-function.dto';
import { BotQuoteDto } from './dto/bot-quote.dto';
import { CreateBotQuoteDto } from './dto/create-bot-quote.dto';

@Injectable()
export class BotQuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findFunctions(): Promise<BotFunctionDto[]> {
    const functions = await this.prisma.funcionBot.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });

    return functions.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.nombre,
      description: item.descripcion,
      basePrice: item.precioBase.toNumber(),
    }));
  }

  async createQuote(usuarioId: string, dto: CreateBotQuoteDto, idempotencyKey?: string): Promise<BotQuoteDto> {
    const fingerprint = idempotencyKey ? idempotencyFingerprint({
      funcionIds: [...dto.funcionIds].sort(),
      descripcion: dto.descripcion?.trim() || null,
    }) : undefined;
    if (idempotencyKey && fingerprint) {
      const existing = await this.prisma.cotizacionBot.findUnique({
        where: { usuarioId_idempotencyKey: { usuarioId, idempotencyKey } },
      });
      if (existing) {
        assertSameIdempotentRequest(existing.idempotencyFingerprint, fingerprint);
        return this.toDto(existing);
      }
    }

    const user = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!user || !user.activo) {
      throw new NotFoundException('El usuario solicitado no existe o está inactivo.');
    }

    const functions = await this.prisma.funcionBot.findMany({
      where: { id: { in: dto.funcionIds }, activo: true },
    });
    if (functions.length !== dto.funcionIds.length) {
      throw new NotFoundException('Una o más funciones no existen o ya no están disponibles.');
    }

    const total = functions.reduce(
      (sum, item) => sum.plus(item.precioBase),
      new Prisma.Decimal(0),
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
      const quote = await this.prisma.$transaction((tx) => tx.cotizacionBot.create({
        data: {
          referencia: `BOT-${randomUUID()}`,
          idempotencyKey,
          idempotencyFingerprint: fingerprint,
          usuarioId,
          descripcion: dto.descripcion,
          totalEstimado: total,
          vigenteHasta: expiresAt,
          estado: 'ENVIADA',
          funciones: {
            create: functions.map((item) => ({
              funcionId: item.id,
              precioAplicado: item.precioBase,
            })),
          },
        },
      }));
      return this.toDto(quote);
    } catch (error: unknown) {
      if (idempotencyKey && fingerprint && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.cotizacionBot.findUnique({
          where: { usuarioId_idempotencyKey: { usuarioId, idempotencyKey } },
        });
        if (existing) {
          assertSameIdempotentRequest(existing.idempotencyFingerprint, fingerprint);
          return this.toDto(existing);
        }
      }
      throw error;
    }
  }

  private toDto(quote: {
    id: string; referencia: string; totalEstimado: Prisma.Decimal; moneda: string; estado: string; vigenteHasta: Date | null;
  }): BotQuoteDto {
    return {
      id: quote.id,
      reference: quote.referencia,
      estimatedTotal: quote.totalEstimado.toNumber(),
      currency: quote.moneda,
      status: quote.estado,
      expiresAt: quote.vigenteHasta,
    };
  }
}
