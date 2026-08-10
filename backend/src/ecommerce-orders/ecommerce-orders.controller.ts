import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateEcommerceOrderDto } from './dto/create-ecommerce-order.dto';
import { EcommerceOrderDto } from './dto/ecommerce-order.dto';
import { EcommerceOrdersService } from './ecommerce-orders.service';

@ApiTags('ecommerce-orders')
@ApiBearerAuth()
@Controller('ecommerce-orders')
export class EcommerceOrdersController {
  constructor(private readonly ecommerceOrdersService: EcommerceOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea una orden de productos digitales pendiente de pago' })
  @ApiCreatedResponse({ type: EcommerceOrderDto })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEcommerceOrderDto): Promise<EcommerceOrderDto> {
    return this.ecommerceOrdersService.create(user.userId, dto);
  }
}
