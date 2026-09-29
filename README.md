# BrickByBrick

Plataforma digital para la donación de materiales de construcción excedentes en Bogotá. Conecta constructoras donantes con beneficiarios (familias, emprendimientos y comunidades), les da trazabilidad a las entregas y genera constancias que apoyan la planeación del beneficio tributario del **Art. 255 del Estatuto Tributario (Ley 1819 de 2016)**.

> **Aviso tributario.** El descuento del Art. 255 aplica a donaciones hechas a entidades sin ánimo de lucro (ESAL) del Régimen Tributario Especial y exige la certificación de la entidad donataria (Art. 257 E.T.). Las constancias y los valores que muestra la plataforma son **orientativos**: sirven para la planeación de la constructora, pero no reemplazan esa certificación ni la asesoría de un contador.

---

## Funcionalidades

| Módulo | Qué incluye |
|---|---|
| **Donaciones** | Catálogo con filtros (categoría, localidad, estado, texto), solicitud con propósito de uso, flujo `pendiente → aprobada → entregada` con cancelación y rechazo motivados, reserva atómica de stock, confirmación de recepción y calificación. |
| **Tributario** | Valor unitario declarado por material, constancia PDF por entrega (`BBB-<año>-<nnnnnn>`), resumen anual PDF, estimado del 25 % con tope sobre el impuesto y checklist de requisitos. |
| **Eventos** | Entregas masivas, talleres y ferias con cupos, materiales asociados, inscripción y cancelación, asistencia, exportación CSV y avisos a la localidad. |
| **Comunidad** | Publicaciones con fotos, likes, comentarios y respuestas, like a comentarios, reposts, seguidores, portafolios de emprendimientos, grupos (públicos o privados) con chat en tiempo real y mensajes directos. |
| **Cuenta** | Registro de beneficiarios y constructoras (RUT y Cámara de Comercio), verificación de correo, recuperación de contraseña, verificación en dos pasos por correo (obligatoria para administradores), preferencias de notificación y eliminación de cuenta. |
| **Administración** | Dashboard, métricas del proyecto (IPE, TPA, TEA, TRP), usuarios (suspender, reactivar, creador destacado), verificación de constructoras y documentos, moderación de reportes, configuración, estado de los servicios, auditoría y exportaciones CSV. |

### Roles

| Rol | Capacidades |
|---|---|
| `BENEFICIARIO` | Solicitar materiales, inscribirse a eventos, publicar en la comunidad y mantener un portafolio. El distintivo **Creador destacado** (antes "Alimentador Web") lo asigna el administrador. |
| `CONSTRUCTORA` | Publicar materiales y eventos (una vez verificada), gestionar solicitudes, registrar entregas y consultar el módulo tributario. |
| `ADMINISTRADOR` | Acceso total, con MFA obligatorio. |

### Métricas del proyecto

| Sigla | Indicador | Cálculo |
|---|---|---|
| IPE | Índice de participación en eventos | inscripciones vigentes / cupos ofrecidos |
| TPA | Tiempo promedio de atención | días entre la publicación del material y la entrega |
| TEA | Tasa de efectividad de acceso | inicios de sesión válidos / intentos |
| TRP | Tiempo de respuesta de la plataforma | latencia medida en el API Gateway (promedio, p95 y % bajo 3 s) |

---

## Arquitectura

```
                ┌──────────────┐
  Angular SPA ──►  API Gateway │ :3000  /api/v1/*  ·  /ws  ·  /uploads  ·  /health
                └──────┬───────┘
      ┌────────┬───────┼────────┬──────────┬──────────────┐
   auth :3001  user :3002  material :3003  event :3004  publication :3005  notification :3006
      └────────┴───────┴────────┴──────────┴──────────────┘
                         PostgreSQL (Prisma)
```

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21 (standalone, signals, `@ngrx/signals`), Angular Material, SCSS, ng2-charts, Socket.io client |
| Backend | Node.js 20 + Express, microservicios en un monorepo con npm workspaces |
| Datos | PostgreSQL 16 + Prisma (migraciones versionadas) |
| Validación | Zod en todas las entradas |
| Autenticación | JWT de acceso (15 min, en memoria) + refresh rotativo (7 días, cookie httpOnly) con detección de reutilización |
| Tiempo real | Socket.io a través del gateway (notificaciones, chat de grupos y mensajes directos) |
| Tareas programadas | node-cron (zona America/Bogota): vencimiento de materiales, estados de eventos y recordatorios |

```
BrickByBrick/
├── frontend/                     Angular (core, shared, features por rol, layout)
├── backend/
│   ├── services/
│   │   ├── api-gateway/          :3000 proxy, WebSocket, uploads, salud y métrica TRP
│   │   ├── auth-service/         :3001 registro, login, MFA, sesiones
│   │   ├── user-service/         :3002 perfiles, administración, métricas
│   │   ├── material-service/     :3003 materiales, solicitudes, categorías, tributario
│   │   ├── event-service/        :3004 eventos e inscripciones
│   │   ├── publication-service/  :3005 comunidad, grupos, mensajes, reportes
│   │   └── notification-service/ :3006 notificaciones y Socket.io
│   ├── shared/                   app factory, middleware, errores, utilidades, cliente Prisma
│   ├── prisma/                   schema, migraciones y seed
│   └── test/                     configuración y helpers de las pruebas
├── database/                     schema.sql y seed.sql de referencia
└── designs/                      diseños de referencia
```

Cada servicio sigue la misma estructura: `routes → controllers (finos) → services (lógica) → repositories (Prisma)`, con validadores Zod por ruta.

---

## Puesta en marcha (desarrollo)

**Requisitos:** Node.js 20+, npm 10+ y Docker (para PostgreSQL local).

### 1. Base de datos local

```bash
cd backend
docker compose up -d postgres
```

Levanta PostgreSQL 16 en el puerto **5434** (usuario `brickbybrick`, base `brickbybrick`, volumen `brickbybrick_pgdata`). Cambia el puerto con `DB_PORT` si está ocupado.

### 2. Variables de entorno

```bash
cp .env.example .env
```

Para Docker local usa `DATABASE_URL="postgresql://brickbybrick:brickbybrick_dev@localhost:5434/brickbybrick"` y genera secretos propios para `JWT_SECRET`, `JWT_REFRESH_SECRET` e `INTERNAL_API_KEY`. Con `MAIL_TRANSPORT=log` los correos (incluidos los códigos MFA) se imprimen en la consola del backend en lugar de enviarse.

### 3. Dependencias, migraciones y datos

```bash
npm install
npm run db:generate
npm run db:migrate                 # aplica prisma/migrations
SEED_DEMO=true npm run db:seed     # catálogos, administrador y datos de demostración
```

Sin `SEED_DEMO` solo se cargan los catálogos, la configuración y el administrador. Las credenciales de prueba están documentadas en la cabecera de `backend/prisma/seed.js` (solo para desarrollo).

### 4. Backend

```bash
npm run dev      # gateway + 6 servicios con recarga automática
```

Comprueba `http://localhost:3000/health`: debe responder `status: "ok"` con los seis servicios. La documentación Swagger de cada servicio está en `http://localhost:<puerto>/api-docs`.

### 5. Frontend

```bash
cd ../frontend
npm install
npm start
```

Abre **http://localhost:4200**. El servidor de desarrollo redirige `/api`, `/ws`, `/uploads` y `/health` al gateway (`proxy.conf.json`), así todo funciona desde el mismo origen.

---

## Docker Compose (stack completo)

```bash
cd backend
docker compose --profile app up --build
```

Construye una imagen para los servicios, ejecuta las migraciones y el seed (`migraciones`) y levanta el gateway en `:3000` junto con los seis servicios. Los archivos subidos se guardan en el volumen `uploads`.

---

## Pruebas

```bash
cd backend && npm test          # integración con PostgreSQL real
cd frontend && npm test -- --watch=false
```

- **Backend (Jest + Supertest):** usan una base aislada `brickbybrick_test`, derivada de `DATABASE_URL` o definida con `TEST_DATABASE_URL`. La configuración se niega a correr contra una base cuyo nombre no termine en `_test`. Antes de cada ejecución se aplican las migraciones, se vacían las tablas y se cargan los catálogos. Cubren autenticación y sesiones, la máquina de estados de solicitudes y su concurrencia, el módulo tributario, eventos y cupos, la capa social, la administración y el enrutamiento del gateway.
- **Frontend (Vitest):** interceptor de autenticación (refresh single-flight), guards, pipes, utilidades, validadores y el diálogo de confirmación.

---

## Scripts del backend

| Script | Descripción |
|---|---|
| `npm run dev` / `npm start` | Gateway y servicios (con o sin recarga automática) |
| `npm run db:generate` | Genera el cliente Prisma |
| `npm run db:migrate` | Aplica las migraciones pendientes (`prisma migrate deploy`) |
| `npm run db:migrate:dev` | Crea una migración nueva a partir de cambios en `schema.prisma` |
| `npm run db:seed` | Catálogos, configuración y administrador (`SEED_DEMO=true` agrega datos de demostración) |
| `npm run db:reset` | Recrea la base de desarrollo desde cero |
| `npm run db:sql` | Regenera `database/schema.sql` a partir del schema de Prisma |
| `npm test` | Pruebas de integración |

---

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Sí | Secretos distintos de al menos 32 caracteres |
| `INTERNAL_API_KEY` | Sí | Clave de la comunicación interna entre servicios (mín. 16) |
| `FRONTEND_URL` | Sí | Origen permitido por CORS y base de los enlaces de los correos |
| `PORT_GATEWAY`, `PORT_AUTH` … `PORT_NOTIF` | No | Puertos (3000–3006 por defecto) |
| `*_SERVICE_URL` | No | URLs internas de los servicios (Docker las define con el nombre del contenedor) |
| `MAIL_TRANSPORT` | No | `log` para imprimir los correos, `smtp` para enviarlos con `SMTP_*` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Solo con SMTP | Envío de correos (verificación, MFA, recuperación, avisos) |
| `UPLOADS_DIR`, `MAX_UPLOAD_MB` | No | Carpeta y tamaño máximo de los archivos subidos |
| `TEST_DATABASE_URL` | No | Base para las pruebas (debe terminar en `_test`) |
| `LOG_LEVEL` | No | Nivel del logger (`debug` en desarrollo, `error` en pruebas, `warn` en producción) |
