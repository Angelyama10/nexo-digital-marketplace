# Nexo Digital Marketplace

Base inicial para una plataforma de servicios digitales: streaming, IA, educación, VPN, servidores, dominios y bots de Telegram.

## 1. Requisitos

- Docker Desktop instalado y ejecutándose.
- No necesitas instalar Node.js ni npm en tu Mac para este flujo.

## 2. Desarrollo completo dentro de Docker

Abre una sola terminal en la carpeta raíz:

```bash
cd "/Users/angelyama/Documents/Proyecto Ecommer"
docker compose up --build
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`
- PostgreSQL y Redis permanecen en la red interna de Docker para no chocar con otros proyectos.

En este flujo:

- `npm install` se ejecuta dentro de las imágenes `nexo-backend:dev` y `nexo-frontend:dev` durante el build.
- `npm run dev:backend` se ejecuta automáticamente dentro del contenedor `nexo-backend-dev`.
- `npm run dev:frontend` se ejecuta automáticamente dentro del contenedor `nexo-frontend-dev`.
- Los directorios del proyecto se montan en los contenedores para conservar hot reload.

Si modificas un `package.json`, instala las dependencias dentro del contenedor correspondiente y reinícialo:

```bash
docker compose exec backend npm install
docker compose restart backend
```

Para ejecutarlo en segundo plano:

```bash
docker compose up -d --build
```

Para ver los logs:

```bash
docker compose logs -f backend frontend
```

Para detener los contenedores:

```bash
docker compose down
```

Para detenerlos y borrar también los datos locales de PostgreSQL/Redis:

```bash
docker compose down -v
```

## 3. Imágenes existentes y reutilización

Las imágenes de `mall-virtual-*` y `tienda-perfumes-*` no deben reutilizarse porque contienen código y dependencias de aplicaciones distintas.

Sí se pueden reutilizar las imágenes base que ya aparecen en Docker Desktop. El Compose utiliza:

- `node:22-alpine` para construir frontend y backend.
- `postgres:17-alpine` para la base de datos.
- `redis:7.4.9-alpine` para caché y sesiones.

Docker las reutilizará si ya están descargadas; si no, las descargará. Las imágenes propias nuevas serán:

- `nexo-backend:dev`
- `nexo-frontend:dev`

## 4. Ejecutar versión compilada tipo producción

También dejé un Compose separado que genera las imágenes finales sin hot reload:

```bash
docker compose -f docker-compose.prod.yml up --build
```

- Web: `http://localhost:4173`
- API: `http://localhost:3000/api`

## 5. Backend y base de datos

El esquema Prisma está en `backend/prisma/schema.prisma`. Al iniciar, PostgreSQL contiene el catálogo, productos, membresías y funciones de bot iniciales.

Endpoints disponibles:

| Método | Endpoint | Función |
| --- | --- | --- |
| GET | `/api/services` | Catálogo de servicios digitales. |
| GET | `/api/services/featured` | Servicios destacados. |
| GET | `/api/membership-levels` | Membresías con beneficios incluidos. |
| GET | `/api/products` | Servidores, dominios y VPN. |
| GET | `/api/bot-functions` | Funciones disponibles para bots. |
| POST | `/api/auth/register` | Crea una cuenta y abre sesión. |
| POST | `/api/auth/login` | Inicia sesión; devuelve token y cookie de renovación. |
| POST | `/api/auth/refresh` | Rota el token de renovación HttpOnly. |
| POST | `/api/auth/logout` | Revoca la sesión actual. |
| GET | `/api/auth/me` | Devuelve el perfil autenticado. |
| POST | `/api/subscriptions` | Crea una membresía pendiente de pago. |
| POST | `/api/ecommerce-orders` | Crea una orden de infraestructura/productos. |
| POST | `/api/bot-quotes` | Crea una cotización con precios congelados. |
| POST | `/api/online-orders` | Calcula y registra un pedido online con comisión. |
| POST | `/api/payments/checkout` | Crea la sesión Stripe Checkout de una orden pendiente. |
| POST | `/api/payments/stripe/webhook` | Recibe la confirmación firmada de Stripe. |

Los `POST` de órdenes, cotizaciones, suscripciones y pagos requieren `Authorization: Bearer <accessToken>`. El frontend lo gestiona automáticamente después de iniciar sesión.

Para crear una nueva migración durante desarrollo (desde una terminal real con TTY):

```bash
docker compose exec -it backend npx prisma migrate dev --name nombre_del_cambio
docker compose exec backend npm run prisma:seed
```

Para aplicar migraciones existentes en un VPS o un contenedor no interactivo:

```bash
docker compose exec backend npx prisma migrate deploy
```

## 6. Estructura

```text
.
├── backend/       # NestJS + TypeScript + API REST
├── frontend/      # React + Vite + TypeScript
├── docker-compose.yml
└── README.md
```

## 7. Configurar variables en el VPS y Stripe

No subas archivos `.env` al repositorio. En el VPS crea un `.env` a partir de [`.env.example`](/Users/angelyama/Documents/Proyecto%20Ecommer/.env.example) y define, como mínimo:

```env
FRONTEND_URL=https://tu-dominio.com
JWT_ACCESS_SECRET=un_valor_largo_y_aleatorio
JWT_REFRESH_SECRET=otro_valor_largo_y_aleatorio
COOKIE_SECURE=true
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

En Stripe crea el endpoint `https://api.tu-dominio.com/api/payments/stripe/webhook` y habilita estos eventos: `checkout.session.completed`, `checkout.session.expired` y `payment_intent.payment_failed`. El backend verifica la firma usando el cuerpo crudo de la solicitud; no actives el cobro real hasta configurar esas dos claves y probar con claves `sk_test_`.

La API crea el Checkout en el servidor y redirige al enlace que devuelve Stripe. Tras la confirmación firmada, cambia el pago a aprobado y activa la membresía o marca la orden como pagada. Esto sigue el flujo recomendado por [Stripe Checkout](https://docs.stripe.com/api/checkout/sessions/create?lang=nodejs) y su [verificación de webhooks](https://docs.stripe.com/webhooks/signature?lang=node).

## 8. Validación realizada

- `docker compose config --quiet`
- Compilación de frontend (`npm run build`)
- Compilación de backend (`npm run build`)
- 5 suites y 6 pruebas unitarias del backend aprobadas.

## 9. Comandos dentro de Docker

Si necesitas entrar manualmente a un contenedor, usa estos comandos desde la raíz:

```bash
docker compose exec backend sh
docker compose exec frontend sh
docker compose exec backend npm test
```
