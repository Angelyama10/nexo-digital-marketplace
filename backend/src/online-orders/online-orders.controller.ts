import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateOnlineOrderDto } from './dto/create-online-order.dto';
import { OnlineOrderDto } from './dto/online-order.dto';
import { OnlineOrdersService } from './online-orders.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('online-orders')
@Controller('online-orders')
export class OnlineOrdersController {
  constructor(private readonly onlineOrdersService: OnlineOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicita un pedido online y calcula la comisión automáticamente' })
  @ApiCreatedResponse({ type: OnlineOrderDto })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOnlineOrderDto): Promise<OnlineOrderDto> {
    return this.onlineOrdersService.create(user.userId, dto);
  }
}
