import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  type!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: 249 })
  price!: number;

  @ApiProperty({ example: 'MXN' })
  currency!: string;

  @ApiPropertyOptional({ nullable: true })
  durationDays!: number | null;
}
