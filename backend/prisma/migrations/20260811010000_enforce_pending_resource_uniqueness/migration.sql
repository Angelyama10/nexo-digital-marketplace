-- Interrumpe de forma segura el despliegue si ya existen duplicados que requieren revisión manual.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "suscripciones"
    WHERE "estado" IN ('ACTIVA', 'PENDIENTE_PAGO')
    GROUP BY "usuarioId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existen usuarios con más de una suscripción activa o pendiente; revíselos antes de migrar.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "pagos"
    WHERE "estado" IN ('PENDIENTE', 'COMPROBANTE_ENVIADO')
    GROUP BY COALESCE("suscripcionId", "ordenEcommerceId", "pedidoOnlineId", "ordenTrabajoId")
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existen pagos pendientes duplicados; revíselos antes de migrar.';
  END IF;
END $$;

CREATE UNIQUE INDEX "suscripciones_usuario_pendiente_activa_key"
ON "suscripciones" ("usuarioId")
WHERE "estado" IN ('ACTIVA', 'PENDIENTE_PAGO');

CREATE UNIQUE INDEX "pagos_suscripcion_pendiente_key"
ON "pagos" ("suscripcionId")
WHERE "suscripcionId" IS NOT NULL AND "estado" IN ('PENDIENTE', 'COMPROBANTE_ENVIADO');

CREATE UNIQUE INDEX "pagos_orden_ecommerce_pendiente_key"
ON "pagos" ("ordenEcommerceId")
WHERE "ordenEcommerceId" IS NOT NULL AND "estado" IN ('PENDIENTE', 'COMPROBANTE_ENVIADO');

CREATE UNIQUE INDEX "pagos_pedido_online_pendiente_key"
ON "pagos" ("pedidoOnlineId")
WHERE "pedidoOnlineId" IS NOT NULL AND "estado" IN ('PENDIENTE', 'COMPROBANTE_ENVIADO');

CREATE UNIQUE INDEX "pagos_orden_trabajo_pendiente_key"
ON "pagos" ("ordenTrabajoId")
WHERE "ordenTrabajoId" IS NOT NULL AND "estado" IN ('PENDIENTE', 'COMPROBANTE_ENVIADO');
