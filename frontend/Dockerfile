FROM node:22-alpine AS development

WORKDIR /app
COPY package*.json ./
# Rollup distribuye binarios opcionales por arquitectura. Ignoramos el lock
# generado en otra plataforma para resolver el binario correcto en cada imagen.
RUN npm install --include=optional --package-lock=false
COPY . .

EXPOSE 5173
# El volumen de desarrollo puede sobrevivir a cambios del package.json. npm
# vuelve a sincronizarlo y resuelve el binario opcional correcto de Rollup.
CMD ["sh", "-c", "npm install --include=optional --package-lock=false && npm run dev:frontend"]

FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
# El VPS usa Linux x64, mientras que el entorno local puede ser ARM.
# Así npm instala el binario nativo de Rollup correspondiente al contenedor.
RUN npm install --include=optional --package-lock=false
COPY . .
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
