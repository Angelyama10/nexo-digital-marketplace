FROM node:22-alpine AS development

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 3000
# El código y node_modules se montan como volúmenes durante desarrollo. Esta
# comprobación sincroniza dependencias y Prisma cuando cambia el repositorio.
CMD ["sh", "-c", "npm install --include=dev && npm run prisma:generate && npm run dev:backend"]

FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run prisma:generate && npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
