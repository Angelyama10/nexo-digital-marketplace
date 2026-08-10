-- Cada pago pertenece a un solo origen y el origen debe coincidir con su referencia.
ALTER TABLE "pagos"
ADD CONSTRAINT "pagos_origen_unico_check"
CHECK (num_nonnulls("suscripcionId", "ordenEcommerceId", "pedidoOnlineId", "ordenTrabajoId") = 1);

ALTER TABLE "pagos"
ADD CONSTRAINT "pagos_origen_coherente_check"
CHECK (
  ("origen" = 'SUSCRIPCION' AND "suscripcionId" IS NOT NULL)
  OR ("origen" = 'ORDEN_ECOMMERCE' AND "ordenEcommerceId" IS NOT NULL)
  OR ("origen" = 'PEDIDO_ONLINE' AND "pedidoOnlineId" IS NOT NULL)
  OR ("origen" = 'ORDEN_TRABAJO' AND "ordenTrabajoId" IS NOT NULL)
);

-- Un perfil activo de una credencial no puede entregarse a dos clientes al mismo tiempo.
CREATE UNIQUE INDEX "asignaciones_credenciales_perfil_activo_key"
ON "asignaciones_credenciales" ("credencialId", "perfilAsignado")
WHERE "estado" = 'ACTIVA' AND "perfilAsignado" IS NOT NULL;
