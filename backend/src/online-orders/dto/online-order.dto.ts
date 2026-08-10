import { ApiProperty } from '@nestjs/swagger';

export class OnlineOrderDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  reference!: string;

  @ApiProperty({ example: 899.99 })
  productAmount!: number;

  @ApiProperty({ example: 15 })
  commissionPercentage!: number;

  @ApiProperty({ example: 135 })
  commissionAmount!: number;

  @ApiProperty({ example: 1034.99 })
  totalAmount!: number;

  @ApiProperty({ example: 'SOLICITADO' })
  status!: string;
}
