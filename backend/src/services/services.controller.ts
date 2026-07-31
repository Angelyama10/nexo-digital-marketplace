import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ServiceItemDto } from './dto/service-item.dto';
import { ServiceItem } from './entities/service-item.entity';
import { ServicesService } from './services.service';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Devuelve el catálogo público de servicios' })
  @ApiResponse({ status: 200, description: 'Catálogo de servicios.', type: [ServiceItemDto] })
  findAll(): ServiceItem[] {
    return this.servicesService.findAll();
  }

  @Get('featured')
  @ApiOperation({ summary: 'Devuelve los servicios destacados' })
  @ApiResponse({ status: 200, description: 'Servicios destacados.', type: [ServiceItemDto] })
  findFeatured(): ServiceItem[] {
    return this.servicesService.findFeatured();
  }
}
