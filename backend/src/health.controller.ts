import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('system')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Comprueba que la API está disponible' })
  @ApiResponse({ status: 200, description: 'API disponible.' })
  check() {
    return {
      status: 'ok',
      service: 'nexo-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
