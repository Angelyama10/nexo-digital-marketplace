import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { assertSameIdempotentRequest, idempotencyFingerprint } from '../common/idempotency';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(usuarioId: string, dto: CreateSubscriptionDto, idempotencyKey?: string): Promise<SubscriptionDto> {
    const fingerprint = idempotencyKey ? idempotencyFingerprint({ levelId: dto.levelId }) : undefined;
    if (idempotencyKey && fingerprint) {
      const existing = await this.prisma.suscripcion.findUnique({
        where: { usuarioId_idempotencyKey: { usuarioId, idempotencyKey } },
      });
      if (existing) {
        assertSameIdempotentRequest(existing.idempotencyFingerprint, fingerprint);
        return this.toDto(existing);
      }
    }

    const level = await this.prisma.nivelMembresia.findFirst({ where: { id: dto.levelId, activo: true } });
    if (!level) throw new NotFoundException('El nivel de membresía ya no está disponible.');

    const current = await this.prisma.suscripcion.findFirst({
      where: { usuarioId, estado: { in: ['ACTIVA', 'PENDIENTE_PAGO'] } },
    });
    if (current) throw new ConflictException('Ya tienes una membresía activa o pendiente de pago.');

    const billingDate = new Date();
    billingDate.setDate(billingDate.getDate() + 30);
    let subscription;
    try {
      subscription = await this.prisma.suscripcion.create({
        data: {
          usuarioId, nivelId: level.id, precioMensualAplicado: level.precioMensual, moneda: level.moneda, fechaCorte: billingDate,
          idempotencyKey, idempotencyFingerprint: fingerprint,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        if (idempotencyKey && fingerprint) {
          const existing = await this.prisma.suscripcion.findUnique({
            where: { usuarioId_idempotencyKey: { usuarioId, idempotencyKey } },
          });
          if (existing) {
            assertSameIdempotentRequest(existing.idempotencyFingerprint, fingerprint);
            return this.toDto(existing);
          }
        }
        throw new ConflictException('Ya tienes una membresía activa o pendiente de pago.');
      }
      throw error;
    }
    return this.toDto(subscription);
  }

  private toDto(subscription: { id: string; estado: string; precioMensualAplicado: Prisma.Decimal; moneda: string; fechaCorte: Date }): SubscriptionDto {
    return { id: subscription.id, status: subscription.estado, monthlyPrice: subscription.precioMensualAplicado.toNumber(), currency: subscription.moneda, billingDate: subscription.fechaCorte };
  }
}
