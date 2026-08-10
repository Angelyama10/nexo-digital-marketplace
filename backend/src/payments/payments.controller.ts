import { BadRequestException, Body, Controller, Headers, HttpCode, HttpStatus, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CheckoutDto } from './dto/checkout.dto';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crea una sesión Stripe Checkout para un recurso pendiente de pago' })
  @ApiCreatedResponse({ type: CheckoutDto })
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCheckoutDto): Promise<CheckoutDto> {
    return this.paymentsService.createCheckout(user.userId, dto);
  }

  @Post('stripe/webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook firmado de Stripe' })
  stripeWebhook(@Req() request: RawBodyRequest<Request>, @Headers('stripe-signature') signature?: string): Promise<{ received: true }> {
    if (!request.rawBody) throw new BadRequestException('Stripe requiere el cuerpo crudo.');
    return this.paymentsService.handleStripeWebhook(request.rawBody, signature);
  }
}
