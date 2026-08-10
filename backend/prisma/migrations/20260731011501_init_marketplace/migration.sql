-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('CLIENTE', 'ADMIN', 'SOPORTE');

-- CreateEnum
CREATE TYPE "EstadoSuscripcion" AS ENUM ('ACTIVA', 'VENCIDA', 'CANCELADA', 'PENDIENTE_PAGO');

-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('PENDIENTE', 'PAGADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA', 'REEMBOLSADA');

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('SERVIDOR', 'DOMINIO', 'VPN', 'OTRO');

-- CreateEnum
CREATE TYPE "CategoriaServicioDigital" AS ENUM ('STREAMING', 'EDUCATIVO', 'IA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoPedidoOnline" AS ENUM ('SOLICITADO', 'COTIZADO', 'PAGADO', 'COMPRADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoCotizacionBot" AS ENUM ('BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'EXPIRADA', 'CONVERTIDA_ORDEN');

-- CreateEnum
CREATE TYPE "EstadoOrdenTrabajo" AS ENUM ('PENDIENTE', 'EN_DESARROLLO', 'EN_REVISION', 'ENTREGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoAsignacionCredencial" AS ENUM ('ACTIVA', 'LIBERADA', 'REVOCADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('MERCADO_PAGO', 'TRANSFERENCIA', 'EFECTIVO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO', 'EN_MEDIACION');

-- CreateEnum
CREATE TYPE "OrigenPago" AS ENUM ('SUSCRIPCION', 'ORDEN_ECOMMERCE', 'PEDIDO_ONLINE', 'ORDEN_TRABAJO');

-- CreateEnum
CREATE TYPE "EstadoWebhook" AS ENUM ('RECIBIDO', 'PROCESADO', 'ERROR');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "email" TEXT NOT NULL,
    "emailNormalizado" TEXT NOT NULL,
    "telefono" TEXT,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'CLIENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "verificadoEn" TIMESTAMP(3),
    "ultimoAccesoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niveles_membresia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioMensual" DECIMAL(10,2) NOT NULL,
    "moneda" CHAR(3) NOT NULL DEFAULT 'MXN',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "niveles_membresia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nivelId" TEXT NOT NULL,
    "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "precioMensualAplicado" DECIMAL(10,2) NOT NULL,
    "moneda" CHAR(3) NOT NULL DEFAULT 'MXN',
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodoActualInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCorte" TIMESTAMP(3) NOT NULL,
    "fechaCancelacion" TIMESTAMP(3),
    "renovAutomatica" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios_digitales" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaServicioDigital" NOT NULL,
    "descripcion" TEXT,
    "precioDesde" DECIMAL(10,2) NOT NULL,
    "precioEtiqueta" TEXT NOT NULL,
    "acento" TEXT NOT NULL DEFAULT 'blue',
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicios_digitales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nivel_servicio_digital" (
    "id" TEXT NOT NULL,
    "nivelId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "cuposIncluidos" INTEGER NOT NULL DEFAULT 1,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "nivel_servicio_digital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credenciales" (
    "id" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "emailCuenta" TEXT NOT NULL,
    "passwordCifrado" TEXT NOT NULL,
    "perfilesMax" INTEGER NOT NULL DEFAULT 1,
    "notas" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credenciales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_credenciales" (
    "id" TEXT NOT NULL,
    "credencialId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "suscripcionId" TEXT,
    "perfilAsignado" INTEGER,
    "pinPerfilCifrado" TEXT,
    "estado" "EstadoAsignacionCredencial" NOT NULL DEFAULT 'ACTIVA',
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaLiberacion" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asignaciones_credenciales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoProducto" NOT NULL,
    "descripcion" TEXT,
    "imagenUrl" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "moneda" CHAR(3) NOT NULL DEFAULT 'MXN',
    "duracionDias" INTEGER,
    "stock" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_ecommerce" (
    "id" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "estado" "EstadoOrden" NOT NULL DEFAULT 'PENDIENTE',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "impuestos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "envio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "moneda" CHAR(3) NOT NULL DEFAULT 'MXN',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_ecommerce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_orden_ecommerce" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "nombreProducto" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precioUnit" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "items_orden_ecommerce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_online" (
    "id" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "urlProducto" TEXT NOT NULL,
    "tienda" TEXT,
    "descripcion" TEXT,
    "montoProducto" DECIMAL(10,2) NOT NULL,
    "porcentajeComision" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    "montoComision" DECIMAL(10,2) NOT NULL,
    "montoEnvio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "montoTotal" DECIMAL(10,2) NOT NULL,
    "moneda" CHAR(3) NOT NULL DEFAULT 'MXN',
    "vigenteHasta" TIMESTAMP(3),
    "estado" "EstadoPedidoOnline" NOT NULL DEFAULT 'SOLICITADO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_online_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funciones_bot" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioBase" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funciones_bot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizaciones_bot" (
    "id" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "descripcion" TEXT,
    "metadata" JSONB,
    "totalEstimado" DECIMAL(10,2) NOT NULL,
    "moneda" CHAR(3) NOT NULL DEFAULT 'MXN',
    "vigenteHasta" TIMESTAMP(3),
    "estado" "EstadoCotizacionBot" NOT NULL DEFAULT 'BORRADOR',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotizaciones_bot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizacion_bot_funciones" (
    "id" TEXT NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "funcionId" TEXT NOT NULL,
    "precioAplicado" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "cotizacion_bot_funciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_trabajo" (
    "id" TEXT NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "asignadoAId" TEXT,
    "estado" "EstadoOrdenTrabajo" NOT NULL DEFAULT 'PENDIENTE',
    "fechaEntrega" TIMESTAMP(3),
    "entregableUrl" TEXT,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "usuarioId" TEXT NOT NULL,
    "origen" "OrigenPago" NOT NULL,
    "suscripcionId" TEXT,
    "ordenEcommerceId" TEXT,
    "pedidoOnlineId" TEXT,
    "ordenTrabajoId" TEXT,
    "metodo" "MetodoPago" NOT NULL DEFAULT 'MERCADO_PAGO',
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "monto" DECIMAL(10,2) NOT NULL,
    "moneda" CHAR(3) NOT NULL DEFAULT 'MXN',
    "periodoInicio" TIMESTAMP(3),
    "periodoFin" TIMESTAMP(3),
    "mpPaymentId" TEXT,
    "mpPreferenceId" TEXT,
    "mpStatusDetail" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks_eventos" (
    "id" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL DEFAULT 'MERCADO_PAGO',
    "eventoExternoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "estado" "EstadoWebhook" NOT NULL DEFAULT 'RECIBIDO',
    "error" TEXT,
    "recibidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procesadoEn" TIMESTAMP(3),

    CONSTRAINT "webhooks_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_emailNormalizado_key" ON "usuarios"("emailNormalizado");

-- CreateIndex
CREATE INDEX "usuarios_rol_activo_idx" ON "usuarios"("rol", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "niveles_membresia_nombre_key" ON "niveles_membresia"("nombre");

-- CreateIndex
CREATE INDEX "suscripciones_usuarioId_estado_idx" ON "suscripciones"("usuarioId", "estado");

-- CreateIndex
CREATE INDEX "suscripciones_estado_fechaCorte_idx" ON "suscripciones"("estado", "fechaCorte");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_digitales_slug_key" ON "servicios_digitales"("slug");

-- CreateIndex
CREATE INDEX "servicios_digitales_activo_destacado_orden_idx" ON "servicios_digitales"("activo", "destacado", "orden");

-- CreateIndex
CREATE INDEX "nivel_servicio_digital_servicioId_idx" ON "nivel_servicio_digital"("servicioId");

-- CreateIndex
CREATE UNIQUE INDEX "nivel_servicio_digital_nivelId_servicioId_key" ON "nivel_servicio_digital"("nivelId", "servicioId");

-- CreateIndex
CREATE INDEX "credenciales_servicioId_activa_idx" ON "credenciales"("servicioId", "activa");

-- CreateIndex
CREATE UNIQUE INDEX "credenciales_servicioId_emailCuenta_key" ON "credenciales"("servicioId", "emailCuenta");

-- CreateIndex
CREATE INDEX "asignaciones_credenciales_credencialId_estado_idx" ON "asignaciones_credenciales"("credencialId", "estado");

-- CreateIndex
CREATE INDEX "asignaciones_credenciales_usuarioId_estado_idx" ON "asignaciones_credenciales"("usuarioId", "estado");

-- CreateIndex
CREATE INDEX "asignaciones_credenciales_suscripcionId_idx" ON "asignaciones_credenciales"("suscripcionId");

-- CreateIndex
CREATE UNIQUE INDEX "productos_slug_key" ON "productos"("slug");

-- CreateIndex
CREATE INDEX "productos_tipo_activo_idx" ON "productos"("tipo", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_ecommerce_referencia_key" ON "ordenes_ecommerce"("referencia");

-- CreateIndex
CREATE INDEX "ordenes_ecommerce_usuarioId_estado_idx" ON "ordenes_ecommerce"("usuarioId", "estado");

-- CreateIndex
CREATE INDEX "ordenes_ecommerce_estado_creadoEn_idx" ON "ordenes_ecommerce"("estado", "creadoEn");

-- CreateIndex
CREATE INDEX "items_orden_ecommerce_ordenId_idx" ON "items_orden_ecommerce"("ordenId");

-- CreateIndex
CREATE INDEX "items_orden_ecommerce_productoId_idx" ON "items_orden_ecommerce"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_online_referencia_key" ON "pedidos_online"("referencia");

-- CreateIndex
CREATE INDEX "pedidos_online_usuarioId_estado_idx" ON "pedidos_online"("usuarioId", "estado");

-- CreateIndex
CREATE INDEX "pedidos_online_estado_creadoEn_idx" ON "pedidos_online"("estado", "creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "funciones_bot_slug_key" ON "funciones_bot"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "funciones_bot_nombre_key" ON "funciones_bot"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cotizaciones_bot_referencia_key" ON "cotizaciones_bot"("referencia");

-- CreateIndex
CREATE INDEX "cotizaciones_bot_usuarioId_estado_idx" ON "cotizaciones_bot"("usuarioId", "estado");

-- CreateIndex
CREATE INDEX "cotizacion_bot_funciones_funcionId_idx" ON "cotizacion_bot_funciones"("funcionId");

-- CreateIndex
CREATE UNIQUE INDEX "cotizacion_bot_funciones_cotizacionId_funcionId_key" ON "cotizacion_bot_funciones"("cotizacionId", "funcionId");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_cotizacionId_key" ON "ordenes_trabajo"("cotizacionId");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_asignadoAId_estado_idx" ON "ordenes_trabajo"("asignadoAId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_referencia_key" ON "pagos"("referencia");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_idempotencyKey_key" ON "pagos"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_mpPaymentId_key" ON "pagos"("mpPaymentId");

-- CreateIndex
CREATE INDEX "pagos_usuarioId_estado_idx" ON "pagos"("usuarioId", "estado");

-- CreateIndex
CREATE INDEX "pagos_suscripcionId_idx" ON "pagos"("suscripcionId");

-- CreateIndex
CREATE INDEX "pagos_ordenEcommerceId_idx" ON "pagos"("ordenEcommerceId");

-- CreateIndex
CREATE INDEX "pagos_pedidoOnlineId_idx" ON "pagos"("pedidoOnlineId");

-- CreateIndex
CREATE INDEX "pagos_ordenTrabajoId_idx" ON "pagos"("ordenTrabajoId");

-- CreateIndex
CREATE UNIQUE INDEX "webhooks_eventos_eventoExternoId_key" ON "webhooks_eventos"("eventoExternoId");

-- CreateIndex
CREATE INDEX "webhooks_eventos_estado_recibidoEn_idx" ON "webhooks_eventos"("estado", "recibidoEn");

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "niveles_membresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nivel_servicio_digital" ADD CONSTRAINT "nivel_servicio_digital_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "niveles_membresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nivel_servicio_digital" ADD CONSTRAINT "nivel_servicio_digital_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios_digitales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credenciales" ADD CONSTRAINT "credenciales_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios_digitales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_credenciales" ADD CONSTRAINT "asignaciones_credenciales_credencialId_fkey" FOREIGN KEY ("credencialId") REFERENCES "credenciales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_credenciales" ADD CONSTRAINT "asignaciones_credenciales_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_credenciales" ADD CONSTRAINT "asignaciones_credenciales_suscripcionId_fkey" FOREIGN KEY ("suscripcionId") REFERENCES "suscripciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_ecommerce" ADD CONSTRAINT "ordenes_ecommerce_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_ecommerce" ADD CONSTRAINT "items_orden_ecommerce_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_ecommerce"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_ecommerce" ADD CONSTRAINT "items_orden_ecommerce_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_online" ADD CONSTRAINT "pedidos_online_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones_bot" ADD CONSTRAINT "cotizaciones_bot_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion_bot_funciones" ADD CONSTRAINT "cotizacion_bot_funciones_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "cotizaciones_bot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion_bot_funciones" ADD CONSTRAINT "cotizacion_bot_funciones_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES "funciones_bot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "cotizaciones_bot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_suscripcionId_fkey" FOREIGN KEY ("suscripcionId") REFERENCES "suscripciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_ordenEcommerceId_fkey" FOREIGN KEY ("ordenEcommerceId") REFERENCES "ordenes_ecommerce"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_pedidoOnlineId_fkey" FOREIGN KEY ("pedidoOnlineId") REFERENCES "pedidos_online"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "ordenes_trabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
