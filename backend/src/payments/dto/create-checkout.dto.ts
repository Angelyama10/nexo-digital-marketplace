import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CheckoutResourceType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  ECOMMERCE_ORDER = 'ECOMMERCE_ORDER',
  ONLINE_ORDER = 'ONLINE_ORDER',
  BOT_QUOTE = 'BOT_QUOTE',
}

export class CreateCheckoutDto {
  @ApiProperty({ enum: CheckoutResourceType })
  @IsEnum(CheckoutResourceType)
  resourceType!: CheckoutResourceType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  resourceId!: string;
}
