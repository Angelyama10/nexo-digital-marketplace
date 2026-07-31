import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory } from '../entities/service-item.entity';

export class ServiceItemDto {
  @ApiProperty({ example: 'telegram-bots' })
  id!: string;

  @ApiProperty({ enum: ['streaming', 'ai', 'education', 'infrastructure', 'automation', 'commerce'] })
  category!: ServiceCategory;

  @ApiProperty({ example: 'Bots de Telegram' })
  name!: string;

  @ApiProperty({ example: 'Automatizaciones a la medida para vender, avisar y operar.' })
  description!: string;

  @ApiProperty({ example: 799 })
  priceFrom!: number;

  @ApiProperty({ example: 'Cotización desde $799 MXN' })
  priceLabel!: string;

  @ApiProperty({ enum: ['coral', 'blue', 'yellow', 'mint'] })
  accent!: string;

  @ApiPropertyOptional({ example: true })
  featured?: boolean;
}
