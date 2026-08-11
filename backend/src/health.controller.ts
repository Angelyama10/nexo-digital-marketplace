import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('system')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Comprueba que la API y su base de datos están disponibles' })
  @ApiResponse({ status: 200, description: 'API y base de datos disponibles.' })
  @ApiResponse({ status: 503, description: 'Una dependencia crítica no está disponible.' })
  async check() {
    const timestamp = new Date().toISOString();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(() => reject(new Error('database health probe timeout')), 2_000);
        }),
      ]);
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'nexo-backend',
        dependencies: { database: 'unavailable' },
        timestamp,
      });
    } finally {
      if (timeout) clearTimeout(timeout);
    }

    return {
      status: 'ok',
      service: 'nexo-backend',
      dependencies: { database: 'ok' },
      timestamp,
    };
  }
}
