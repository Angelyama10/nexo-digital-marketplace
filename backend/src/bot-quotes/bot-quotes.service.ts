import { NotFoundException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
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

  async createQuote(usuarioId: string, dto: CreateBotQuoteDto): Promise<BotQuoteDto> {
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

    const quote = await this.prisma.$transaction((tx) => tx.cotizacionBot.create({
      data: {
        referencia: `BOT-${randomUUID()}`,
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
