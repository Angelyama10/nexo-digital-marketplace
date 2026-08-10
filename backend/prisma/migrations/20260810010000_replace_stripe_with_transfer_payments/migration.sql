-- Se elimina la dependencia operativa de Stripe y se conserva el historial de pagos.
ALTER TABLE "pagos" ALTER COLUMN "metodo" DROP DEFAULT;

CREATE TYPE "MetodoPago_nuevo" AS ENUM ('MERCADO_PAGO', 'TRANSFERENCIA', 'EFECTIVO', 'OTRO');

ALTER TABLE "pagos"
ALTER COLUMN "metodo" TYPE "MetodoPago_nuevo"
USING (CASE WHEN "metodo"::text = 'STRIPE' THEN 'OTRO' ELSE "metodo"::text END)::"MetodoPago_nuevo";

DROP TYPE "MetodoPago";
ALTER TYPE "MetodoPago_nuevo" RENAME TO "MetodoPago";
ALTER TABLE "pagos" ALTER COLUMN "metodo" SET DEFAULT 'TRANSFERENCIA';

ALTER TYPE "EstadoPago" ADD VALUE 'COMPROBANTE_ENVIADO';
ALTER TYPE "TipoProducto" ADD VALUE 'LICENCIA_OFFICE';

DROP INDEX IF EXISTS "pagos_stripeCheckoutSessionId_key";
DROP INDEX IF EXISTS "pagos_stripePaymentIntentId_key";

ALTER TABLE "pagos"
DROP COLUMN IF EXISTS "stripeCheckoutSessionId",
DROP COLUMN IF EXISTS "stripePaymentIntentId",
DROP COLUMN IF EXISTS "stripeStatus",
ADD COLUMN "referenciaTransferencia" TEXT,
ADD COLUMN "nombreOrdenante" TEXT,
ADD COLUMN "comprobanteUrl" TEXT,
ADD COLUMN "comprobanteEnviadoEn" TIMESTAMP(3),
ADD COLUMN "validadoPorId" TEXT,
ADD COLUMN "validadoEn" TIMESTAMP(3),
ADD COLUMN "notaValidacion" TEXT;

CREATE INDEX "pagos_estado_comprobanteEnviadoEn_idx" ON "pagos"("estado", "comprobanteEnviadoEn");
