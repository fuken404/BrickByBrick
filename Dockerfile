# =============================================================
# BrickByBrick — imagen "todo en uno"
#   gateway + 6 microservicios + frontend Angular compilado
#
#   docker build -t brickbybrick .
#   docker run -p 8080:3000 --env-file backend/.env -e DATABASE_URL=... brickbybrick
#
# El puerto público es el del gateway (PORT, por defecto 3000). Los archivos
# subidos se guardan en /data/uploads: monte ahí un volumen persistente.
# =============================================================

# ---------- 1. Frontend: compilación de producción ----------
FROM node:20-alpine AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npx ng build --configuration production

# ---------- 2. Backend: dependencias de producción y cliente Prisma ----------
FROM node:20-alpine AS backend
WORKDIR /app
RUN apk add --no-cache openssl
COPY backend/package.json backend/package-lock.json ./
COPY backend/shared/package.json shared/
COPY backend/services/api-gateway/package.json services/api-gateway/
COPY backend/services/auth-service/package.json services/auth-service/
COPY backend/services/user-service/package.json services/user-service/
COPY backend/services/material-service/package.json services/material-service/
COPY backend/services/event-service/package.json services/event-service/
COPY backend/services/publication-service/package.json services/publication-service/
COPY backend/services/notification-service/package.json services/notification-service/
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY backend/prisma prisma
RUN node node_modules/prisma/build/index.js generate --schema=prisma/schema.prisma
COPY backend/shared shared
COPY backend/services services
COPY backend/scripts scripts

# ---------- 3. Imagen final ----------
FROM node:20-alpine
# openssl: requerido por Prisma · tini: reenvía señales y recoge procesos huérfanos
RUN apk add --no-cache openssl tini
WORKDIR /app
COPY --from=backend /app /app
COPY --from=frontend /build/dist/frontend/browser /app/public

ENV NODE_ENV=production \
    PORT=3000 \
    FRONTEND_DIST=/app/public \
    UPLOADS_DIR=/data/uploads \
    MAIL_TRANSPORT=log \
    LOG_LEVEL=info
RUN mkdir -p /data/uploads

EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "scripts/docker-entrypoint.sh"]
