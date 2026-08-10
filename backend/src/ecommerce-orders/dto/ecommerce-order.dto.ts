import { ApiProperty } from '@nestjs/swagger';

export class EcommerceOrderDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  reference!: string;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  status!: string;
}
