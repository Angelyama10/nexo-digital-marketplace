import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty()
  paymentId!: string;

  @ApiProperty()
  checkoutUrl!: string;
}
