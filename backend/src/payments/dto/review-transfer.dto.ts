import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewTransferDto {
  @ApiProperty({ description: 'true aprueba el pago; false lo rechaza.' })
  @IsBoolean()
  approved!: boolean;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
