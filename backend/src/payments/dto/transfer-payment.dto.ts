import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferInstructionsDto {
  @ApiProperty()
  bank!: string;

  @ApiProperty()
  accountHolder!: string;

  @ApiPropertyOptional()
  accountNumber?: string;

  @ApiPropertyOptional()
  clabe?: string;

  @ApiProperty()
  concept!: string;

  @ApiPropertyOptional()
  additionalInstructions?: string;
}

export class TransferPaymentDto {
  @ApiProperty()
  paymentId!: string;

  @ApiProperty()
  reference!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: TransferInstructionsDto })
  instructions!: TransferInstructionsDto;
}
