import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('system')
@Public()
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
