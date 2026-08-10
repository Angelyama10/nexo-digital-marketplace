import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BotFunctionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: 650 })
  basePrice!: number;
}
