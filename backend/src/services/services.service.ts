import { Injectable } from '@nestjs/common';
import { CategoriaServicioDigital } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceItem } from './entities/service-item.entity';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ServiceItem[]> {
    const catalog = await this.prisma.servicioDigital.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });

    return catalog.map((service) => this.toPublicItem(service));
  }

  async findFeatured(): Promise<ServiceItem[]> {
    const catalog = await this.prisma.servicioDigital.findMany({
      where: { activo: true, destacado: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });

    return catalog.map((service) => this.toPublicItem(service));
  }

  private toPublicItem(service: {
    id: string; slug: string; nombre: string; categoria: CategoriaServicioDigital; descripcion: string | null;
    precioDesde: { toNumber(): number }; precioEtiqueta: string; acento: string; destacado: boolean;
  }): ServiceItem {
    return {
      id: service.slug,
      name: service.nombre,
      category: this.mapCategory(service.categoria),
      description: service.descripcion ?? '',
      priceFrom: service.precioDesde.toNumber(),
      priceLabel: service.precioEtiqueta,
      accent: service.acento,
      featured: service.destacado,
    };
  }

  private mapCategory(category: CategoriaServicioDigital): ServiceItem['category'] {
    const categories: Record<CategoriaServicioDigital, ServiceItem['category']> = {
      STREAMING: 'streaming',
      IA: 'ai',
      EDUCATIVO: 'education',
      OTRO: 'automation',
    };

    return categories[category];
  }
}
