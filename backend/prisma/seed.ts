import {
  CategoriaServicioDigital,
  PrismaClient,
  TipoProducto,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const servicios = await Promise.all([
    prisma.servicioDigital.upsert({
      where: { slug: 'streaming-packs' },
      update: {},
      create: {
        slug: 'streaming-packs', nombre: 'Packs de streaming', categoria: CategoriaServicioDigital.STREAMING,
        descripcion: 'Planes de entretenimiento con soporte humano.', precioDesde: 89, precioEtiqueta: 'Desde $89 MXN / mes', acento: 'coral', destacado: true, orden: 1,
      },
    }),
    prisma.servicioDigital.upsert({
      where: { slug: 'ia-workspace' },
      update: {},
      create: {
        slug: 'ia-workspace', nombre: 'IA para trabajar', categoria: CategoriaServicioDigital.IA,
        descripcion: 'Herramientas para crear y trabajar más rápido.', precioDesde: 149, precioEtiqueta: 'Desde $149 MXN / mes', acento: 'blue', destacado: true, orden: 2,
      },
    }),
    prisma.servicioDigital.upsert({
      where: { slug: 'learning-club' },
      update: {},
      create: {
        slug: 'learning-club', nombre: 'Suscripciones educativas', categoria: CategoriaServicioDigital.EDUCATIVO,
        descripcion: 'Cursos, bibliotecas y recursos para aprender.', precioDesde: 129, precioEtiqueta: 'Desde $129 MXN / mes', acento: 'yellow', orden: 3,
      },
    }),
  ]);

  const [basico, pro, premium] = await Promise.all([
    prisma.nivelMembresia.upsert({
      where: { nombre: 'Básico' },
      update: {},
      create: { nombre: 'Básico', descripcion: 'Para empezar con lo esencial.', precioMensual: 149, orden: 1 },
    }),
    prisma.nivelMembresia.upsert({
      where: { nombre: 'Pro' },
      update: {},
      create: { nombre: 'Pro', descripcion: 'Más servicios y precios preferentes.', precioMensual: 299, orden: 2 },
    }),
    prisma.nivelMembresia.upsert({
      where: { nombre: 'Premium' },
      update: {},
      create: { nombre: 'Premium', descripcion: 'Beneficios completos y soporte prioritario.', precioMensual: 499, orden: 3 },
    }),
  ]);

  await Promise.all([
    prisma.nivelServicioDigital.upsert({ where: { nivelId_servicioId: { nivelId: basico.id, servicioId: servicios[0].id } }, update: { cuposIncluidos: 1 }, create: { nivelId: basico.id, servicioId: servicios[0].id, cuposIncluidos: 1 } }),
    prisma.nivelServicioDigital.upsert({ where: { nivelId_servicioId: { nivelId: pro.id, servicioId: servicios[0].id } }, update: { cuposIncluidos: 1 }, create: { nivelId: pro.id, servicioId: servicios[0].id, cuposIncluidos: 1 } }),
    prisma.nivelServicioDigital.upsert({ where: { nivelId_servicioId: { nivelId: pro.id, servicioId: servicios[1].id } }, update: { cuposIncluidos: 1 }, create: { nivelId: pro.id, servicioId: servicios[1].id, cuposIncluidos: 1 } }),
    prisma.nivelServicioDigital.upsert({ where: { nivelId_servicioId: { nivelId: premium.id, servicioId: servicios[0].id } }, update: { cuposIncluidos: 1 }, create: { nivelId: premium.id, servicioId: servicios[0].id, cuposIncluidos: 1 } }),
    prisma.nivelServicioDigital.upsert({ where: { nivelId_servicioId: { nivelId: premium.id, servicioId: servicios[1].id } }, update: { cuposIncluidos: 1 }, create: { nivelId: premium.id, servicioId: servicios[1].id, cuposIncluidos: 1 } }),
    prisma.nivelServicioDigital.upsert({ where: { nivelId_servicioId: { nivelId: premium.id, servicioId: servicios[2].id } }, update: { cuposIncluidos: 1 }, create: { nivelId: premium.id, servicioId: servicios[2].id, cuposIncluidos: 1 } }),
  ]);

  await Promise.all([
    prisma.producto.upsert({
      where: { slug: 'vpn-shield' }, update: {},
      create: { slug: 'vpn-shield', nombre: 'VPN Shield', tipo: TipoProducto.VPN, descripcion: 'Conexión privada para tus dispositivos.', precio: 99, duracionDias: 30 },
    }),
    prisma.producto.upsert({
      where: { slug: 'dominio-anual' }, update: {},
      create: { slug: 'dominio-anual', nombre: 'Dominio anual', tipo: TipoProducto.DOMINIO, descripcion: 'Registra el nombre de tu proyecto durante un año.', precio: 249, duracionDias: 365 },
    }),
    prisma.producto.upsert({
      where: { slug: 'servidor-inicial' }, update: {},
      create: { slug: 'servidor-inicial', nombre: 'Servidor inicial', tipo: TipoProducto.SERVIDOR, descripcion: 'Infraestructura inicial para un proyecto digital.', precio: 399, duracionDias: 30, stock: null },
    }),
  ]);

  await Promise.all([
    prisma.funcionBot.upsert({ where: { slug: 'autorespuestas' }, update: {}, create: { slug: 'autorespuestas', nombre: 'Auto-respuestas', descripcion: 'Respuestas automáticas por comandos y palabras clave.', precioBase: 650 } }),
    prisma.funcionBot.upsert({ where: { slug: 'pagos' }, update: {}, create: { slug: 'pagos', nombre: 'Pagos', descripcion: 'Cobros e integración con una pasarela de pago.', precioBase: 1200 } }),
    prisma.funcionBot.upsert({ where: { slug: 'base-datos' }, update: {}, create: { slug: 'base-datos', nombre: 'Base de datos', descripcion: 'Almacenamiento de usuarios, pedidos o registros.', precioBase: 950 } }),
    prisma.funcionBot.upsert({ where: { slug: 'panel-admin' }, update: {}, create: { slug: 'panel-admin', nombre: 'Panel administrativo', descripcion: 'Panel web para operación y seguimiento.', precioBase: 1800 } }),
  ]);

  await prisma.usuario.upsert({
    where: { email: 'demo@nexo.local' },
    update: {},
    create: {
      nombre: 'Cliente', apellido: 'Demo', email: 'demo@nexo.local', emailNormalizado: 'demo@nexo.local',
      passwordHash: 'USUARIO_DEMO_SIN_ACCESO', verificadoEn: new Date(),
    },
  });
}

main()
  .then(() => console.log('Datos iniciales de Nexo creados.'))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
