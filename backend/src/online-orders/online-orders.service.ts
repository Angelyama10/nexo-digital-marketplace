import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOnlineOrderDto } from './dto/create-online-order.dto';
import { OnlineOrderDto } from './dto/online-order.dto';

@Injectable()
export class OnlineOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(usuarioId: string, dto: CreateOnlineOrderDto): Promise<OnlineOrderDto> {
    const user = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!user || !user.activo) {
      throw new NotFoundException('El usuario solicitado no existe o está inactivo.');
    }

    const productAmount = new Prisma.Decimal(dto.montoProducto);
    const commissionPercentage = new Prisma.Decimal(dto.porcentajeComision ?? 15);
    const commissionAmount = productAmount.mul(commissionPercentage).div(100).toDecimalPlaces(2);
    const totalAmount = productAmount.plus(commissionAmount);

    const order = await this.prisma.pedidoOnline.create({
      data: {
        referencia: `PO-${randomUUID()}`,
        usuarioId,
        urlProducto: dto.urlProducto,
        tienda: dto.tienda,
        descripcion: dto.descripcion,
        montoProducto: productAmount,
        porcentajeComision: commissionPercentage,
        montoComision: commissionAmount,
        montoTotal: totalAmount,
        vigenteHasta: this.quoteExpiry(),
      },
    });

    return {
      id: order.id,
      reference: order.referencia,
      productAmount: order.montoProducto.toNumber(),
      commissionPercentage: order.porcentajeComision.toNumber(),
      commissionAmount: order.montoComision.toNumber(),
      totalAmount: order.montoTotal.toNumber(),
      status: order.estado,
    };
  }

  private quoteExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2);
    return expiresAt;
  }
}
