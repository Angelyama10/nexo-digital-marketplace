import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BotQuoteDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  reference!: string;

  @ApiProperty({ example: 1850 })
  estimatedTotal!: number;

  @ApiProperty({ example: 'MXN' })
  currency!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  expiresAt!: Date | null;
}
