import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProductDto[]> {
    const products = await this.prisma.producto.findMany({
      where: { activo: true },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    });

    return products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.nombre,
      type: product.tipo,
      description: product.descripcion,
      price: product.precio.toNumber(),
      currency: product.moneda,
      durationDays: product.duracionDias,
    }));
  }
}
