import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { HealthController } from './health.controller';
import { BotQuotesModule } from './bot-quotes/bot-quotes.module';
import { EcommerceOrdersModule } from './ecommerce-orders/ecommerce-orders.module';
import { MembershipsModule } from './memberships/memberships.module';
import { OnlineOrdersModule } from './online-orders/online-orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { PaymentsModule } from './payments/payments.module';
import { ServicesModule } from './services/services.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../.env'] }),
    PrismaModule,
    AuthModule,
    ServicesModule,
    MembershipsModule,
    ProductsModule,
    BotQuotesModule,
    OnlineOrdersModule,
    SubscriptionsModule,
    EcommerceOrdersModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
