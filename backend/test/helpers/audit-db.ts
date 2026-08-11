import { PrismaClient } from '@prisma/client';

export async function assertAuditDatabase(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ database_name: string }>>`
    SELECT current_database() AS database_name
  `;
  if (rows[0]?.database_name !== 'nexo_audit') {
    throw new Error(`Unsafe test database: ${rows[0]?.database_name ?? 'unknown'}`);
  }
}

export async function resetAuditDatabase(prisma: PrismaClient): Promise<void> {
  await assertAuditDatabase(prisma);
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "webhooks_eventos",
      "pagos",
      "ordenes_trabajo",
      "cotizacion_bot_funciones",
      "cotizaciones_bot",
      "funciones_bot",
      "pedidos_online",
      "items_orden_ecommerce",
      "ordenes_ecommerce",
      "productos",
      "asignaciones_credenciales",
      "credenciales",
      "nivel_servicio_digital",
      "servicios_digitales",
      "suscripciones",
      "niveles_membresia",
      "sesiones",
      "usuarios"
    RESTART IDENTITY CASCADE
  `);
}
