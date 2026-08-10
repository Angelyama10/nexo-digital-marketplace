import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(usuarioId: string, dto: CreateSubscriptionDto): Promise<SubscriptionDto> {
    const level = await this.prisma.nivelMembresia.findFirst({ where: { id: dto.levelId, activo: true } });
    if (!level) throw new NotFoundException('El nivel de membresía ya no está disponible.');

    const current = await this.prisma.suscripcion.findFirst({
      where: { usuarioId, estado: { in: ['ACTIVA', 'PENDIENTE_PAGO'] } },
    });
    if (current) throw new ConflictException('Ya tienes una membresía activa o pendiente de pago.');

    const billingDate = new Date();
    billingDate.setDate(billingDate.getDate() + 30);
    const subscription = await this.prisma.suscripcion.create({
      data: { usuarioId, nivelId: level.id, precioMensualAplicado: level.precioMensual, moneda: level.moneda, fechaCorte: billingDate },
    });
    return { id: subscription.id, status: subscription.estado, monthlyPrice: subscription.precioMensualAplicado.toNumber(), currency: subscription.moneda, billingDate: subscription.fechaCorte };
  }
}
