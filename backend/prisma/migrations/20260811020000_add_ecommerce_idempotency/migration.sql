ALTER TABLE "ordenes_ecommerce"
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "idempotencyFingerprint" TEXT;

CREATE UNIQUE INDEX "ordenes_ecommerce_usuarioId_idempotencyKey_key"
ON "ordenes_ecommerce" ("usuarioId", "idempotencyKey");
