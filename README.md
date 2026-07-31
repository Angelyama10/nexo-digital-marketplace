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
- PostgreSQL: puerto `5432`
- Redis: puerto `6379`

En este flujo:

- `npm install` se ejecuta dentro de las imágenes `nexo-backend:dev` y `nexo-frontend:dev` durante el build.
- `npm run dev:backend` se ejecuta automáticamente dentro del contenedor `nexo-backend-dev`.
- `npm run dev:frontend` se ejecuta automáticamente dentro del contenedor `nexo-frontend-dev`.
- Los directorios del proyecto se montan en los contenedores para conservar hot reload.

Si modificas un `package.json`, reconstruye las imágenes:

```bash
docker compose up --build
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

## 5. Estructura

```text
.
├── backend/       # NestJS + TypeScript + API REST
├── frontend/      # React + Vite + TypeScript
├── docker-compose.yml
└── README.md
```

Esta primera etapa usa un catálogo temporal en memoria para que la interfaz sea visible desde el primer día. La siguiente etapa puede conectar Prisma, migraciones PostgreSQL, usuarios, inventario de accesos, Mercado Pago y panel administrativo.

## 6. Comandos dentro de Docker

Si necesitas entrar manualmente a un contenedor, usa estos comandos desde la raíz:

```bash
docker compose exec backend sh
docker compose exec frontend sh
docker compose exec backend npm test
```
