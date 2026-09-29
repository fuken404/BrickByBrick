# Imagen única para todos los microservicios (monorepo con workspaces).
# El servicio a ejecutar se elige con SERVICE (p. ej. auth-service).
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY services/api-gateway/package.json services/api-gateway/
COPY services/auth-service/package.json services/auth-service/
COPY services/user-service/package.json services/user-service/
COPY services/material-service/package.json services/material-service/
COPY services/event-service/package.json services/event-service/
COPY services/publication-service/package.json services/publication-service/
COPY services/notification-service/package.json services/notification-service/
RUN npm ci --omit=dev --ignore-scripts

COPY prisma prisma
RUN npx prisma generate --schema=prisma/schema.prisma
COPY shared shared
COPY services services

ENV NODE_ENV=production
ARG SERVICE=api-gateway
ENV SERVICE=${SERVICE}
USER node
CMD ["sh", "-c", "node services/${SERVICE}/src/index.js"]
