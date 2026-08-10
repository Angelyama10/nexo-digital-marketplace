import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BotQuotesService } from './bot-quotes.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { BotFunctionDto } from './dto/bot-function.dto';
import { BotQuoteDto } from './dto/bot-quote.dto';
import { CreateBotQuoteDto } from './dto/create-bot-quote.dto';

@ApiTags('bot-quotes')
@Controller()
export class BotQuotesController {
  constructor(private readonly botQuotesService: BotQuotesService) {}

  @Get('bot-functions')
  @Public()
  @ApiOperation({ summary: 'Lista las funciones disponibles para cotizar un bot de Telegram' })
  @ApiOkResponse({ type: [BotFunctionDto] })
  findFunctions(): Promise<BotFunctionDto[]> {
    return this.botQuotesService.findFunctions();
  }

  @Post('bot-quotes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea una cotización de bot con precios congelados' })
  @ApiCreatedResponse({ type: BotQuoteDto })
  createQuote(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBotQuoteDto): Promise<BotQuoteDto> {
    return this.botQuotesService.createQuote(user.userId, dto);
  }
}
