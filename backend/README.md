# BrickByBrick — Backend

Monorepo de microservicios Node.js + Express para la plataforma de donación de materiales.

## Servicios

| Servicio | Puerto | Responsabilidad |
|---|---|---|
| auth-service | 3001 | Login, registro, JWT, reset de contraseña |
| user-service | 3002 | Perfiles de beneficiarios y constructoras |
| material-service | 3003 | Materiales, solicitudes de donación, cron de vencimiento |
| event-service | 3004 | Eventos, inscripciones, asistencia |
| publication-service | 3005 | Publicaciones, comentarios, likes, grupos |
| notification-service | 3006 | Notificaciones HTTP + WebSocket (Socket.io) |

## Setup rápido

### 1. Variables de entorno

```bash
cp .env.example .env
# Editar .env con las credenciales de Neon y Supabase
```

### 2. Instalar dependencias

```bash
npm install          # instala en todos los workspaces
```

### 3. Generar Prisma client y sincronizar DB

```bash
npm run db:push      # empuja el schema a Neon (dev)
npm run db:generate  # genera @prisma/client
```

Ejecutar también los seeds en Neon/Supabase:
```bash
# En el SQL Editor de Neon:
# 1. Pegar y ejecutar database/schema.sql
# 2. Pegar y ejecutar database/seed.sql
```

### 4. Correr en desarrollo

```bash
npm run dev          # levanta los 6 servicios con concurrently
```

O individualmente:
```bash
npm run dev -w services/auth-service
npm run dev -w services/material-service
# ...
```

### 5. Docker Compose (alternativa)

```bash
docker-compose up --build
```

---

## Arquitectura

```
backend/
├── shared/                   # Middleware y utils compartidos
│   ├── middleware/
│   │   ├── auth.middleware.js      # Verifica JWT → req.user
│   │   ├── role.middleware.js      # requireRoles('ADMIN', ...)
│   │   ├── error.handler.js        # Manejador global de errores
│   │   ├── rate.limiter.js         # express-rate-limit
│   │   ├── validate.middleware.js  # validateBody(zodSchema)
│   │   └── upload.middleware.js    # Multer + Supabase Storage
│   └── utils/
│       ├── prisma.client.js        # Singleton de PrismaClient
│       ├── jwt.utils.js            # generateAccessToken/RefreshToken
│       ├── response.utils.js       # sendSuccess / sendError
│       ├── crypto.utils.js         # generateToken / hashToken
│       ├── email.utils.js          # sendEmail (nodemailer)
│       ├── logger.js               # Winston logger
│       └── notification.utils.js   # createNotification (DB + WS)
└── services/
    ├── auth-service/           puerto 3001
    ├── user-service/           puerto 3002
    ├── material-service/       puerto 3003 (+ cron job)
    ├── event-service/          puerto 3004
    ├── publication-service/    puerto 3005
    └── notification-service/   puerto 3006 (+ Socket.io)
```

---

## Autenticación

- **Access Token:** JWT, expira en 15 min. Enviado en `Authorization: Bearer <token>`.
- **Refresh Token:** JWT, expira en 7 días. Almacenado en cookie `httpOnly; Secure; SameSite=Strict`.
- Flujo de renovación: `POST /api/v1/auth/refresh-token` (lee la cookie automáticamente).

---

## WebSocket — Notificaciones en tiempo real

```javascript
// Cliente Angular (Socket.io)
import { io } from 'socket.io-client';

const socket = io('http://localhost:3006', {
  path: '/ws/notificaciones',
  auth: { token: accessToken },
});

socket.on('notification', (data) => {
  console.log('Nueva notificación:', data);
});
```

---

## Comunicación entre servicios

Los servicios comparten el mismo `PrismaClient` (misma DB). Para emitir eventos en tiempo real cuando se crea una notificación, `notification.utils.js` hace una petición HTTP interna a `notification-service`:

```
POST http://localhost:3006/internal/emit
Header: x-internal-key: <INTERNAL_API_KEY>
Body:   { usuarioId, notification }
```

---

## Cron Job — Vencimiento de materiales

`material-service` ejecuta un job diario a medianoche (hora de Bogotá) que:
1. Busca materiales `activo/pausado` con `fecha_limite < hoy`
2. Los cambia a estado `vencido`
3. Rechaza sus solicitudes `pendiente`
4. Notifica a cada constructora afectada

---

## Tests

```bash
npm test                    # todos los servicios
npm test -w services/auth-service   # solo auth
npm run test:coverage       # con reporte de cobertura
```

---

## Variables de entorno requeridas

Ver `.env.example` para la lista completa. Las críticas:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de Neon/Supabase PostgreSQL |
| `JWT_SECRET` | Secreto del access token (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secreto del refresh token (min 32 chars) |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_KEY` | Service Role Key de Supabase |
| `SUPABASE_BUCKET` | Nombre del bucket de Storage |
| `INTERNAL_API_KEY` | Clave para comunicación inter-servicios |
| `FRONTEND_URL` | URL del frontend Angular (CORS) |
