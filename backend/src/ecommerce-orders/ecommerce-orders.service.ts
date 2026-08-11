import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { assertSameIdempotentRequest, idempotencyFingerprint } from '../common/idempotency';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEcommerceOrderDto } from './dto/create-ecommerce-order.dto';
import { EcommerceOrderDto } from './dto/ecommerce-order.dto';

@Injectable()
export class EcommerceOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(usuarioId: string, dto: CreateEcommerceOrderDto, idempotencyKey?: string): Promise<EcommerceOrderDto> {
    const fingerprint = idempotencyKey ? idempotencyFingerprint({
      items: [...dto.items].sort((left, right) => left.productId.localeCompare(right.productId)),
    }) : undefined;
    if (idempotencyKey && fingerprint) {
      const existing = await this.prisma.ordenEcommerce.findUnique({
        where: { usuarioId_idempotencyKey: { usuarioId, idempotencyKey } },
      });
      if (existing) {
        assertSameIdempotentRequest(existing.idempotencyFingerprint, fingerprint);
        return this.toDto(existing);
      }
    }

    const products = await this.prisma.producto.findMany({ where: { id: { in: dto.items.map((item) => item.productId) }, activo: true } });
    if (products.length !== dto.items.length) throw new NotFoundException('Uno o más productos no están disponibles.');
    const productById = new Map(products.map((product) => [product.id, product]));
    const lines = dto.items.map((item) => ({ product: productById.get(item.productId)!, quantity: item.quantity }));
    const subtotal = lines.reduce((total, line) => total.plus(line.product.precio.mul(line.quantity)), new Prisma.Decimal(0));

    try {
      const order = await this.prisma.$transaction(async (tx) => {
        for (const line of lines) {
          if (line.product.stock !== null) {
            const updated = await tx.producto.updateMany({ where: { id: line.product.id, stock: { gte: line.quantity } }, data: { stock: { decrement: line.quantity } } });
            if (updated.count !== 1) throw new NotFoundException(`No hay disponibilidad para ${line.product.nombre}.`);
          }
        }
        return tx.ordenEcommerce.create({
          data: {
            referencia: `EC-${randomUUID()}`, usuarioId, subtotal, total: subtotal, moneda: lines[0].product.moneda,
            idempotencyKey, idempotencyFingerprint: fingerprint,
            items: { create: lines.map((line) => ({ productoId: line.product.id, nombreProducto: line.product.nombre, cantidad: line.quantity, precioUnit: line.product.precio })) },
          },
        });
      });
      return this.toDto(order);
    } catch (error: unknown) {
      if (idempotencyKey && fingerprint && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.ordenEcommerce.findUnique({
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

  private toDto(order: { id: string; referencia: string; total: Prisma.Decimal; moneda: string; estado: string }): EcommerceOrderDto {
    return { id: order.id, reference: order.referencia, total: order.total.toNumber(), currency: order.moneda, status: order.estado };
  }
}
