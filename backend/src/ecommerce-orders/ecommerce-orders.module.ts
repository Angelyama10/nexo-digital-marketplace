import { Module } from '@nestjs/common';
import { EcommerceOrdersController } from './ecommerce-orders.controller';
import { EcommerceOrdersService } from './ecommerce-orders.service';

@Module({ controllers: [EcommerceOrdersController], providers: [EcommerceOrdersService] })
export class EcommerceOrdersModule {}
