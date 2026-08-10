import { ApiProperty } from '@nestjs/swagger';

export class IncludedServiceDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  slots!: number;
}

export class MembershipLevelDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: 299 })
  monthlyPrice!: number;

  @ApiProperty({ example: 'MXN' })
  currency!: string;

  @ApiProperty({ type: [IncludedServiceDto] })
  includedServices!: IncludedServiceDto[];
}
