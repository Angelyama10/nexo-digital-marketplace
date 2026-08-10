import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('products')
@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista productos activos del catálogo' })
  @ApiOkResponse({ type: [ProductDto] })
  findAll(): Promise<ProductDto[]> {
    return this.productsService.findAll();
  }
}
