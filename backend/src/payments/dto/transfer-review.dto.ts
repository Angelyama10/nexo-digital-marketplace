import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferReviewDto {
  @ApiProperty()
  paymentId!: string;

  @ApiProperty()
  reference!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  customerName!: string;

  @ApiProperty()
  customerEmail!: string;

  @ApiProperty()
  transferReference!: string;

  @ApiProperty()
  senderName!: string;

  @ApiProperty()
  receiptUrl!: string;

  @ApiPropertyOptional()
  submittedAt!: Date | null;
}
