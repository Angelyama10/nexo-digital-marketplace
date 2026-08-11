# Despliegue de Nexo en VPS

Este proyecto se despliega con Docker Compose. Caddy expone los puertos `80` y `443`, obtiene y renueva HTTPS automáticamente, y envía tráfico al frontend. PostgreSQL, Redis y NestJS permanecen en la red interna de Docker; Nginx enruta `/api` hacia el backend, por lo que no se expone el puerto 3000 al público.

## Preparación

1. Instala Docker Engine con el plugin Docker Compose en el VPS.
2. Clona el repositorio y entra en la carpeta del proyecto.
3. Crea el archivo de secretos fuera de Git:

```bash
cp deploy/production.env.example .env
nano .env
```

Completa `DOMAIN`, `WWW_DOMAIN`, contraseñas, secretos JWT y los cinco valores `TRANSFER_*`. La aplicación bloquea una solicitud de pago si faltan banco, beneficiario y cuenta o CLABE. Ambos dominios deben resolver al VPS antes de iniciar Caddy.

No uses la IP como URL de producción: Caddy requiere los dominios públicos para emitir el certificado. Mantén `COOKIE_SECURE=true`.

## Inicio y verificación

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend frontend
```

El servicio `migrate` aplica las migraciones Prisma y `seed` carga o actualiza el catálogo (incluye licencias Office) antes de iniciar la API. Comprueba `https://TU_DOMINIO/api/health` y abre la web en `https://TU_DOMINIO`.

## Operación de transferencias

1. El cliente crea una solicitud y recibe banco, beneficiario, cuenta/CLABE y una referencia única.
2. El cliente registra la referencia bancaria, nombre del ordenante y URL HTTPS de su comprobante.
3. Un administrador consulta `GET /api/payments/review-queue` en Swagger o mediante la API.
4. El administrador revisa con `POST /api/payments/{paymentId}/review` y `{ "approved": true }` o `{ "approved": false, "note": "Motivo" }`.

Solo una cuenta con rol `ADMIN` puede aprobar. Para conceder ese rol a la primera cuenta registrada:

```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "UPDATE usuarios SET rol = 'ADMIN' WHERE email = 'correo@ejemplo.com';"
```

## Actualización y reversión

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Para volver al commit anterior, sustituye `COMMIT_ANTERIOR` por el hash que quieres recuperar y vuelve a construir:

```bash
git checkout COMMIT_ANTERIOR
docker compose -f docker-compose.prod.yml up -d --build
```

Nunca ejecutes `docker compose down -v` en el VPS: elimina los volúmenes de la base de datos.
