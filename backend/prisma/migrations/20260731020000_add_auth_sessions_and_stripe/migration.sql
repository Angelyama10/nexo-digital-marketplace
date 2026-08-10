-- Sesiones persistentes para renovar y revocar accesos de forma segura.
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "revocadoEn" TIMESTAMP(3),
    "userAgent" TEXT,
    "ip" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sesiones_usuarioId_revocadoEn_idx" ON "sesiones"("usuarioId", "revocadoEn");
CREATE INDEX "sesiones_expiraEn_idx" ON "sesiones"("expiraEn");

ALTER TABLE "sesiones"
ADD CONSTRAINT "sesiones_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Stripe es un método adicional; se mantienen los campos de Mercado Pago para compatibilidad.
ALTER TYPE "MetodoPago" ADD VALUE 'STRIPE';

ALTER TABLE "pagos"
ADD COLUMN "stripeCheckoutSessionId" TEXT,
ADD COLUMN "stripePaymentIntentId" TEXT,
ADD COLUMN "stripeStatus" TEXT;

CREATE UNIQUE INDEX "pagos_stripeCheckoutSessionId_key" ON "pagos"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "pagos_stripePaymentIntentId_key" ON "pagos"("stripePaymentIntentId");
