import { Injectable } from '@nestjs/common';
import { ServiceItem } from './entities/service-item.entity';

@Injectable()
export class ServicesService {
  private readonly catalog: ServiceItem[] = [
    {
      id: 'streaming-packs',
      name: 'Packs de streaming',
      category: 'streaming',
      description: 'Accesos y planes organizados con soporte humano.',
      priceFrom: 89,
      priceLabel: 'Desde $89 MXN / mes',
      accent: 'coral',
      featured: true,
    },
    {
      id: 'ai-workspace',
      name: 'IA para trabajar',
      category: 'ai',
      description: 'Herramientas y configuraciones para crear más rápido.',
      priceFrom: 149,
      priceLabel: 'Desde $149 MXN / mes',
      accent: 'blue',
      featured: true,
    },
    {
      id: 'learning-club',
      name: 'Suscripciones educativas',
      category: 'education',
      description: 'Bibliotecas, cursos y recursos para seguir aprendiendo.',
      priceFrom: 129,
      priceLabel: 'Desde $129 MXN / mes',
      accent: 'yellow',
    },
    {
      id: 'vpn-shield',
      name: 'VPN Shield',
      category: 'infrastructure',
      description: 'Conexión privada para tus dispositivos y equipos.',
      priceFrom: 99,
      priceLabel: 'Desde $99 MXN / mes',
      accent: 'mint',
    },
    {
      id: 'servers-domains',
      name: 'Servidores y dominios',
      category: 'infrastructure',
      description: 'Infraestructura lista para proyectos personales o negocios.',
      priceFrom: 249,
      priceLabel: 'Desde $249 MXN',
      accent: 'blue',
    },
    {
      id: 'telegram-bots',
      name: 'Bots de Telegram',
      category: 'automation',
      description: 'Automatizaciones a la medida para vender, avisar y operar.',
      priceFrom: 799,
      priceLabel: 'Cotización desde $799 MXN',
      accent: 'coral',
    },
  ];

  findAll(): ServiceItem[] {
    return this.catalog;
  }

  findFeatured(): ServiceItem[] {
    return this.catalog.filter((service) => service.featured);
  }
}
