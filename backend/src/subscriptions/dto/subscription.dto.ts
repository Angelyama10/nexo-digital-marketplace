import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  monthlyPrice!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  billingDate!: Date;
}
