import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentResourceType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  ECOMMERCE_ORDER = 'ECOMMERCE_ORDER',
  ONLINE_ORDER = 'ONLINE_ORDER',
  BOT_QUOTE = 'BOT_QUOTE',
}

export class CreateTransferPaymentDto {
  @ApiProperty({ enum: PaymentResourceType })
  @IsEnum(PaymentResourceType)
  resourceType!: PaymentResourceType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  resourceId!: string;
}
