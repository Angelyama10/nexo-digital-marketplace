import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateTransferPaymentDto } from './dto/create-transfer-payment.dto';
import { ReviewTransferDto } from './dto/review-transfer.dto';
import { SubmitTransferReceiptDto } from './dto/submit-transfer-receipt.dto';
import { TransferPaymentDto } from './dto/transfer-payment.dto';
import { TransferReviewDto } from './dto/transfer-review.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('transfer')
  @ApiOperation({ summary: 'Genera una referencia e instrucciones para pago por transferencia' })
  @ApiCreatedResponse({ type: TransferPaymentDto })
  createTransfer(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTransferPaymentDto): Promise<TransferPaymentDto> {
    return this.paymentsService.createTransferPayment(user.userId, dto);
  }

  @Get('review-queue')
  @ApiOperation({ summary: 'Lista comprobantes de transferencia pendientes; solo ADMIN' })
  @ApiOkResponse({ type: [TransferReviewDto] })
  reviewQueue(@CurrentUser() user: AuthenticatedUser): Promise<TransferReviewDto[]> {
    return this.paymentsService.getReviewQueue(user.role);
  }

  @Post(':paymentId/receipt')
  @ApiOperation({ summary: 'Registra el comprobante de una transferencia para revisión' })
  @ApiOkResponse({ type: TransferPaymentDto })
  submitReceipt(@CurrentUser() user: AuthenticatedUser, @Param('paymentId', new ParseUUIDPipe()) paymentId: string, @Body() dto: SubmitTransferReceiptDto): Promise<TransferPaymentDto> {
    return this.paymentsService.submitReceipt(user.userId, paymentId, dto);
  }

  @Post(':paymentId/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprueba o rechaza una transferencia; solo ADMIN' })
  @ApiOkResponse({ type: TransferPaymentDto })
  review(@CurrentUser() user: AuthenticatedUser, @Param('paymentId', new ParseUUIDPipe()) paymentId: string, @Body() dto: ReviewTransferDto): Promise<TransferPaymentDto> {
    return this.paymentsService.reviewTransfer(user.userId, user.role, paymentId, dto);
  }
}
