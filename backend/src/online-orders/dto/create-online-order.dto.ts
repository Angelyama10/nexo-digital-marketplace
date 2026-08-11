import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOnlineOrderDto {
  @ApiProperty({ example: 'https://www.ejemplo.com/producto' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  urlProducto!: string;

  @ApiPropertyOptional({ example: 'Amazon' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tienda?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @ApiProperty({ example: 899.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(86_956_521.73)
  montoProducto!: number;
}
