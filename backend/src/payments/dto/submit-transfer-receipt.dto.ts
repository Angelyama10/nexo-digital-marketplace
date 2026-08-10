import { IsNotEmpty, IsOptional, IsString, IsUrl, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitTransferReceiptDto {
  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  @Length(4, 80)
  transferReference!: string;

  @ApiProperty({ example: 'Nombre de quien realizó la transferencia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  senderName!: string;

  @ApiProperty({ example: 'https://drive.example.com/comprobante.png' })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  receiptUrl!: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
