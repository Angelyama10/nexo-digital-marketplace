import { Module } from '@nestjs/common';
import { BotQuotesController } from './bot-quotes.controller';
import { BotQuotesService } from './bot-quotes.service';

@Module({
  controllers: [BotQuotesController],
  providers: [BotQuotesService],
})
export class BotQuotesModule {}
