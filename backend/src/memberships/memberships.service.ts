import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipLevelDto } from './dto/membership-level.dto';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<MembershipLevelDto[]> {
    const levels = await this.prisma.nivelMembresia.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { precioMensual: 'asc' }],
      include: {
        serviciosIncluidos: {
          orderBy: { orden: 'asc' },
          include: { servicio: true },
        },
      },
    });

    return levels.map((level) => ({
      id: level.id,
      name: level.nombre,
      description: level.descripcion,
      monthlyPrice: level.precioMensual.toNumber(),
      currency: level.moneda,
      includedServices: level.serviciosIncluidos.map((included) => ({
        id: included.servicio.id,
        name: included.servicio.nombre,
        category: included.servicio.categoria,
        slots: included.cuposIncluidos,
      })),
    }));
  }
}
