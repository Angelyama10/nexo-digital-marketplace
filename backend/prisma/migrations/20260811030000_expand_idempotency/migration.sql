ALTER TABLE "suscripciones"
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "idempotencyFingerprint" TEXT;

ALTER TABLE "pedidos_online"
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "idempotencyFingerprint" TEXT;

ALTER TABLE "cotizaciones_bot"
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "idempotencyFingerprint" TEXT;

DROP INDEX IF EXISTS "pagos_idempotencyKey_key";
ALTER TABLE "pagos"
ADD COLUMN "idempotencyFingerprint" TEXT;

CREATE UNIQUE INDEX "suscripciones_usuarioId_idempotencyKey_key"
ON "suscripciones" ("usuarioId", "idempotencyKey");

CREATE UNIQUE INDEX "pedidos_online_usuarioId_idempotencyKey_key"
ON "pedidos_online" ("usuarioId", "idempotencyKey");

CREATE UNIQUE INDEX "cotizaciones_bot_usuarioId_idempotencyKey_key"
ON "cotizaciones_bot" ("usuarioId", "idempotencyKey");

CREATE UNIQUE INDEX "pagos_usuarioId_idempotencyKey_key"
ON "pagos" ("usuarioId", "idempotencyKey");
