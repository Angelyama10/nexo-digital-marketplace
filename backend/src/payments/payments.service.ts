import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EstadoPago, OrigenPago, Prisma, RolUsuario } from '@prisma/client';
import { randomUUID } from 'crypto';
import { assertSameIdempotentRequest, idempotencyFingerprint } from '../common/idempotency';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferPaymentDto, PaymentResourceType } from './dto/create-transfer-payment.dto';
import { ReviewTransferDto } from './dto/review-transfer.dto';
import { SubmitTransferReceiptDto } from './dto/submit-transfer-receipt.dto';
import { TransferInstructionsDto, TransferPaymentDto } from './dto/transfer-payment.dto';
import { TransferReviewDto } from './dto/transfer-review.dto';

interface PaymentTarget {
  origin: OrigenPago;
  relation: Partial<Pick<Prisma.PagoUncheckedCreateInput, 'suscripcionId' | 'ordenEcommerceId' | 'pedidoOnlineId' | 'ordenTrabajoId'>>;
  amount: Prisma.Decimal;
  currency: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly configService: ConfigService) {}

  async createTransferPayment(usuarioId: string, dto: CreateTransferPaymentDto, idempotencyKey?: string): Promise<TransferPaymentDto> {
    const instructions = this.getTransferInstructions();
    const user = await this.prisma.usuario.findFirst({ where: { id: usuarioId, activo: true } });
    if (!user) throw new NotFoundException('No se encontró la cuenta activa.');
    const fingerprint = idempotencyKey ? idempotencyFingerprint({
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
    }) : undefined;
    if (idempotencyKey && fingerprint) {
      const idempotentPayment = await this.prisma.pago.findUnique({
        where: { usuarioId_idempotencyKey: { usuarioId, idempotencyKey } },
      });
      if (idempotentPayment) {
        assertSameIdempotentRequest(idempotentPayment.idempotencyFingerprint, fingerprint);
        return this.toTransferDto(idempotentPayment, instructions);
      }
    }
    const target = await this.resolveTarget(usuarioId, dto);
    if (target.amount.lte(0)) throw new BadRequestException('El monto a transferir debe ser mayor a cero.');

    const existing = await this.prisma.pago.findFirst({
      where: { usuarioId, estado: { in: ['PENDIENTE', 'COMPROBANTE_ENVIADO'] }, ...target.relation },
    });
    if (existing) throw new ConflictException('Ya existe un pago pendiente para esta solicitud. Envía o espera la validación de su comprobante.');

    let payment;
    try {
      payment = await this.prisma.pago.create({
        data: {
          ...target.relation,
          referencia: `TRF-${randomUUID()}`,
          idempotencyKey,
          idempotencyFingerprint: fingerprint,
          usuarioId,
          origen: target.origin,
          metodo: 'TRANSFERENCIA',
          monto: target.amount,
          moneda: target.currency,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        if (idempotencyKey && fingerprint) {
          const idempotentPayment = await this.prisma.pago.findUnique({
            where: { usuarioId_idempotencyKey: { usuarioId, idempotencyKey } },
          });
          if (idempotentPayment) {
            assertSameIdempotentRequest(idempotentPayment.idempotencyFingerprint, fingerprint);
            return this.toTransferDto(idempotentPayment, instructions);
          }
        }
        throw new ConflictException('Ya existe un pago pendiente para esta solicitud. Envía o espera la validación de su comprobante.');
      }
      throw error;
    }
    return this.toTransferDto(payment, instructions);
  }

  async submitReceipt(usuarioId: string, paymentId: string, dto: SubmitTransferReceiptDto): Promise<TransferPaymentDto> {
    const claimed = await this.prisma.pago.updateMany({
      where: { id: paymentId, usuarioId, metodo: 'TRANSFERENCIA', estado: 'PENDIENTE' },
      data: {
        estado: 'COMPROBANTE_ENVIADO',
        referenciaTransferencia: dto.transferReference.trim(),
        nombreOrdenante: dto.senderName.trim(),
        comprobanteUrl: dto.receiptUrl,
        comprobanteEnviadoEn: new Date(),
        notaValidacion: dto.note?.trim(),
      },
    });
    if (claimed.count !== 1) throw new NotFoundException('No se encontró un pago pendiente para registrar el comprobante.');
    const updated = await this.prisma.pago.findUniqueOrThrow({ where: { id: paymentId } });
    return { paymentId: updated.id, reference: updated.referencia, amount: updated.monto.toNumber(), currency: updated.moneda, status: updated.estado, instructions: { ...this.getTransferInstructions(), concept: updated.referencia } };
  }

  async reviewTransfer(reviewerId: string, reviewerRole: RolUsuario, paymentId: string, dto: ReviewTransferDto): Promise<TransferPaymentDto> {
    if (reviewerRole !== 'ADMIN') throw new ForbiddenException('Solo una cuenta administradora puede validar transferencias.');
    const status: EstadoPago = dto.approved ? 'APROBADO' : 'RECHAZADO';
    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.pago.updateMany({
        where: { id: paymentId, metodo: 'TRANSFERENCIA', estado: 'COMPROBANTE_ENVIADO' },
        data: { estado: status, validadoPorId: reviewerId, validadoEn: new Date(), notaValidacion: dto.note?.trim() ?? null },
      });
      if (claimed.count !== 1) throw new NotFoundException('No se encontró un comprobante pendiente de validación.');
      const reviewed = await tx.pago.findUniqueOrThrow({ where: { id: paymentId } });
      if (dto.approved) await this.activatePaidResource(tx, reviewed);
      return reviewed;
    });
    return { paymentId: updated.id, reference: updated.referencia, amount: updated.monto.toNumber(), currency: updated.moneda, status: updated.estado, instructions: { ...this.getTransferInstructions(), concept: updated.referencia } };
  }

  async getReviewQueue(reviewerRole: RolUsuario): Promise<TransferReviewDto[]> {
    if (reviewerRole !== 'ADMIN') throw new ForbiddenException('Solo una cuenta administradora puede ver comprobantes.');
    const payments = await this.prisma.pago.findMany({
      where: { metodo: 'TRANSFERENCIA', estado: 'COMPROBANTE_ENVIADO' },
      include: { usuario: { select: { nombre: true, apellido: true, email: true } } },
      orderBy: { comprobanteEnviadoEn: 'asc' },
    });
    return payments.map((payment) => ({
      paymentId: payment.id,
      reference: payment.referencia,
      amount: payment.monto.toNumber(),
      currency: payment.moneda,
      customerName: [payment.usuario.nombre, payment.usuario.apellido].filter(Boolean).join(' '),
      customerEmail: payment.usuario.email,
      transferReference: payment.referenciaTransferencia ?? '',
      senderName: payment.nombreOrdenante ?? '',
      receiptUrl: payment.comprobanteUrl ?? '',
      submittedAt: payment.comprobanteEnviadoEn,
    }));
  }

  private async resolveTarget(usuarioId: string, dto: CreateTransferPaymentDto): Promise<PaymentTarget> {
    switch (dto.resourceType) {
      case PaymentResourceType.SUBSCRIPTION: {
        const subscription = await this.prisma.suscripcion.findFirst({ where: { id: dto.resourceId, usuarioId, estado: 'PENDIENTE_PAGO' } });
        if (!subscription) throw new NotFoundException('No se encontró una suscripción pendiente de pago.');
        return { origin: 'SUSCRIPCION', relation: { suscripcionId: subscription.id }, amount: subscription.precioMensualAplicado, currency: subscription.moneda };
      }
      case PaymentResourceType.ECOMMERCE_ORDER: {
        const order = await this.prisma.ordenEcommerce.findFirst({ where: { id: dto.resourceId, usuarioId, estado: 'PENDIENTE' } });
        if (!order) throw new NotFoundException('No se encontró una orden pendiente de pago.');
        return { origin: 'ORDEN_ECOMMERCE', relation: { ordenEcommerceId: order.id }, amount: order.total, currency: order.moneda };
      }
      case PaymentResourceType.ONLINE_ORDER: {
        const order = await this.prisma.pedidoOnline.findFirst({ where: { id: dto.resourceId, usuarioId, estado: { in: ['SOLICITADO', 'COTIZADO'] } } });
        if (!order) throw new NotFoundException('No se encontró un pedido online pendiente de pago.');
        return { origin: 'PEDIDO_ONLINE', relation: { pedidoOnlineId: order.id }, amount: order.montoTotal, currency: order.moneda };
      }
      case PaymentResourceType.BOT_QUOTE: {
        const quote = await this.prisma.cotizacionBot.findFirst({ where: { id: dto.resourceId, usuarioId, estado: { in: ['ENVIADA', 'APROBADA'] } }, include: { ordenTrabajo: true } });
        if (!quote) throw new NotFoundException('No se encontró una cotización disponible para pago.');
        const workOrder = quote.ordenTrabajo ?? await this.prisma.ordenTrabajo.create({ data: { cotizacionId: quote.id } });
        return { origin: 'ORDEN_TRABAJO', relation: { ordenTrabajoId: workOrder.id }, amount: quote.totalEstimado, currency: quote.moneda };
      }
    }
    throw new BadRequestException('El recurso seleccionado no se puede cobrar.');
  }

  private async activatePaidResource(tx: Prisma.TransactionClient, payment: { origen: OrigenPago; suscripcionId: string | null; ordenEcommerceId: string | null; pedidoOnlineId: string | null }): Promise<void> {
    if (payment.origen === 'SUSCRIPCION' && payment.suscripcionId) await tx.suscripcion.update({ where: { id: payment.suscripcionId }, data: { estado: 'ACTIVA', fechaInicio: new Date(), periodoActualInicio: new Date() } });
    if (payment.origen === 'ORDEN_ECOMMERCE' && payment.ordenEcommerceId) await tx.ordenEcommerce.update({ where: { id: payment.ordenEcommerceId }, data: { estado: 'PAGADA' } });
    if (payment.origen === 'PEDIDO_ONLINE' && payment.pedidoOnlineId) await tx.pedidoOnline.update({ where: { id: payment.pedidoOnlineId }, data: { estado: 'PAGADO' } });
  }

  private getTransferInstructions(): Omit<TransferInstructionsDto, 'concept'> {
    const bank = this.configService.get<string>('TRANSFER_BANK_NAME')?.trim();
    const accountHolder = this.configService.get<string>('TRANSFER_ACCOUNT_HOLDER')?.trim();
    const accountNumber = this.configService.get<string>('TRANSFER_ACCOUNT_NUMBER')?.trim();
    const clabe = this.configService.get<string>('TRANSFER_CLABE')?.trim();
    const additionalInstructions = this.configService.get<string>('TRANSFER_INSTRUCTIONS')?.trim();
    if (!bank || !accountHolder || (!accountNumber && !clabe)) {
      throw new ServiceUnavailableException('Los datos de transferencia aún no están configurados. Contacta al soporte de Nexo.');
    }
    return { bank, accountHolder, accountNumber: accountNumber || undefined, clabe: clabe || undefined, additionalInstructions: additionalInstructions || undefined };
  }

  private toTransferDto(
    payment: { id: string; referencia: string; monto: Prisma.Decimal; moneda: string; estado: EstadoPago },
    instructions: Omit<TransferInstructionsDto, 'concept'>,
  ): TransferPaymentDto {
    return {
      paymentId: payment.id,
      reference: payment.referencia,
      amount: payment.monto.toNumber(),
      currency: payment.moneda,
      status: payment.estado,
      instructions: { ...instructions, concept: payment.referencia },
    };
  }
}
