import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrigenPago, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CheckoutResourceType, CreateCheckoutDto } from './dto/create-checkout.dto';

interface CheckoutTarget {
  origin: OrigenPago;
  relation: Partial<Pick<Prisma.PagoUncheckedCreateInput, 'suscripcionId' | 'ordenEcommerceId' | 'pedidoOnlineId' | 'ordenTrabajoId'>>;
  amount: Prisma.Decimal;
  currency: string;
  description: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly configService: ConfigService) {}

  async createCheckout(usuarioId: string, dto: CreateCheckoutDto): Promise<CheckoutDto> {
    const stripe = this.getStripe();
    const user = await this.prisma.usuario.findFirst({ where: { id: usuarioId, activo: true } });
    if (!user) throw new NotFoundException('No se encontró la cuenta activa.');
    const target = await this.resolveTarget(usuarioId, dto);
    if (target.amount.lte(0)) throw new BadRequestException('El monto a cobrar debe ser mayor a cero.');

    const payment = await this.prisma.pago.create({
      data: { ...target.relation, referencia: `PAY-${randomUUID()}`, usuarioId, origen: target.origin, metodo: 'STRIPE', monto: target.amount, moneda: target.currency },
    });
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL').replace(/\/$/, '');
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      client_reference_id: payment.id,
      success_url: `${frontendUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/?checkout=cancelled`,
      metadata: { paymentId: payment.id, reference: payment.referencia },
      payment_intent_data: { metadata: { paymentId: payment.id, reference: payment.referencia } },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: target.currency.toLowerCase() as Stripe.Checkout.SessionCreateParams.LineItem.PriceData['currency'],
          unit_amount: target.amount.mul(100).toDecimalPlaces(0).toNumber(),
          product_data: { name: target.description },
        },
      }],
    });
    if (!session.url) throw new ServiceUnavailableException('Stripe no devolvió una URL de pago.');
    await this.prisma.pago.update({ where: { id: payment.id }, data: { stripeCheckoutSessionId: session.id, stripeStatus: session.status ?? undefined } });
    return { paymentId: payment.id, checkoutUrl: session.url };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string | undefined): Promise<{ received: true }> {
    if (!signature) throw new BadRequestException('Falta la firma de Stripe.');
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) throw new ServiceUnavailableException('Stripe webhook no está configurado.');
    let event: Stripe.Event;
    try {
      event = this.getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('La firma del webhook no es válida.');
    }
    const record = await this.prisma.webhookEvento.upsert({
      where: { eventoExternoId: event.id },
      update: {},
      create: { proveedor: 'STRIPE', eventoExternoId: event.id, tipo: event.type, payload: JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue },
    });
    if (record.procesadoEn) return { received: true };

    try {
      await this.processStripeEvent(event);
      await this.prisma.webhookEvento.update({ where: { id: record.id }, data: { estado: 'PROCESADO', procesadoEn: new Date(), error: null } });
    } catch (error) {
      await this.prisma.webhookEvento.update({ where: { id: record.id }, data: { estado: 'ERROR', error: error instanceof Error ? error.message : 'Error desconocido' } });
      throw error;
    }
    return { received: true };
  }

  private async resolveTarget(usuarioId: string, dto: CreateCheckoutDto): Promise<CheckoutTarget> {
    switch (dto.resourceType) {
      case CheckoutResourceType.SUBSCRIPTION: {
        const subscription = await this.prisma.suscripcion.findFirst({ where: { id: dto.resourceId, usuarioId, estado: 'PENDIENTE_PAGO' }, include: { nivel: true } });
        if (!subscription) throw new NotFoundException('No se encontró una suscripción pendiente de pago.');
        return { origin: 'SUSCRIPCION', relation: { suscripcionId: subscription.id }, amount: subscription.precioMensualAplicado, currency: subscription.moneda, description: `Membresía Nexo ${subscription.nivel.nombre}` };
      }
      case CheckoutResourceType.ECOMMERCE_ORDER: {
        const order = await this.prisma.ordenEcommerce.findFirst({ where: { id: dto.resourceId, usuarioId, estado: 'PENDIENTE' } });
        if (!order) throw new NotFoundException('No se encontró una orden pendiente de pago.');
        return { origin: 'ORDEN_ECOMMERCE', relation: { ordenEcommerceId: order.id }, amount: order.total, currency: order.moneda, description: `Orden Nexo ${order.referencia}` };
      }
      case CheckoutResourceType.ONLINE_ORDER: {
        const order = await this.prisma.pedidoOnline.findFirst({ where: { id: dto.resourceId, usuarioId, estado: { in: ['SOLICITADO', 'COTIZADO'] } } });
        if (!order) throw new NotFoundException('No se encontró un pedido online pendiente de pago.');
        return { origin: 'PEDIDO_ONLINE', relation: { pedidoOnlineId: order.id }, amount: order.montoTotal, currency: order.moneda, description: `Pedido online ${order.referencia}` };
      }
      case CheckoutResourceType.BOT_QUOTE: {
        const quote = await this.prisma.cotizacionBot.findFirst({ where: { id: dto.resourceId, usuarioId, estado: { in: ['ENVIADA', 'APROBADA'] } }, include: { ordenTrabajo: true } });
        if (!quote) throw new NotFoundException('No se encontró una cotización disponible para pago.');
        const workOrder = quote.ordenTrabajo ?? await this.prisma.ordenTrabajo.create({ data: { cotizacionId: quote.id } });
        return { origin: 'ORDEN_TRABAJO', relation: { ordenTrabajoId: workOrder.id }, amount: quote.totalEstimado, currency: quote.moneda, description: `Bot de Telegram ${quote.referencia}` };
      }
    }
    throw new BadRequestException('El recurso seleccionado no se puede cobrar.');
  }

  private async processStripeEvent(event: Stripe.Event): Promise<void> {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid') await this.markPayment(session.metadata?.paymentId, 'APROBADO', session.id, this.stringId(session.payment_intent));
      return;
    }
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.markPayment(session.metadata?.paymentId, 'RECHAZADO', session.id);
      return;
    }
    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await this.markPayment(intent.metadata.paymentId, 'RECHAZADO', undefined, intent.id);
    }
  }

  private async markPayment(paymentId: string | undefined, status: 'APROBADO' | 'RECHAZADO', sessionId?: string, intentId?: string): Promise<void> {
    if (!paymentId) return;
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.pago.findUnique({ where: { id: paymentId } });
      if (!payment || payment.estado === 'APROBADO') return;
      await tx.pago.update({ where: { id: payment.id }, data: { estado: status, stripeCheckoutSessionId: sessionId, stripePaymentIntentId: intentId, stripeStatus: status } });
      if (status !== 'APROBADO') return;
      if (payment.origen === 'SUSCRIPCION' && payment.suscripcionId) await tx.suscripcion.update({ where: { id: payment.suscripcionId }, data: { estado: 'ACTIVA', fechaInicio: new Date(), periodoActualInicio: new Date() } });
      if (payment.origen === 'ORDEN_ECOMMERCE' && payment.ordenEcommerceId) await tx.ordenEcommerce.update({ where: { id: payment.ordenEcommerceId }, data: { estado: 'PAGADA' } });
      if (payment.origen === 'PEDIDO_ONLINE' && payment.pedidoOnlineId) await tx.pedidoOnline.update({ where: { id: payment.pedidoOnlineId }, data: { estado: 'PAGADO' } });
    });
  }

  private getStripe(): Stripe {
    const secret = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secret || !secret.startsWith('sk_')) throw new ServiceUnavailableException('Stripe aún no está configurado.');
    return new Stripe(secret);
  }

  private stringId(value: string | Stripe.PaymentIntent | null): string | undefined { return typeof value === 'string' ? value : value?.id; }
}
