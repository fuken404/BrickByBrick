# BrickByBrick — Base de datos

La fuente de verdad del modelo es **`backend/prisma/schema.prisma`** y los cambios se aplican con **migraciones de Prisma** (`backend/prisma/migrations`). Los archivos de esta carpeta son una referencia en SQL plano.

| Archivo | Contenido |
|---|---|
| `schema.sql` | Esquema completo (ENUMs, tablas, índices, llaves foráneas y la secuencia de constancias). Se **genera** con `npm run db:sql`; no se edita a mano. |
| `seed.sql` | Catálogos iniciales: 20 localidades, 12 categorías y la configuración del sistema. Idempotente. |

## Flujo recomendado (Prisma)

```bash
cd backend
npm run db:migrate                 # aplica las migraciones pendientes
npm run db:seed                    # catálogos, configuración y administrador
SEED_DEMO=true npm run db:seed     # además, datos de demostración
```

Para modificar el modelo:

1. Edita `prisma/schema.prisma`.
2. `npm run db:migrate:dev -- --name descripcion_del_cambio` crea y aplica la migración en desarrollo.
3. `npm run db:sql` regenera `database/schema.sql`.
4. Si el cambio afecta catálogos, actualiza `prisma/seed.js` y `database/seed.sql`.

> Una base creada antes de las migraciones (con `db push`) se marca como sincronizada con `npx prisma migrate resolve --applied 0_init` y luego se ejecuta `npm run db:migrate`. Haz un respaldo antes de migrar una base con datos reales.

## Uso sin Prisma (SQL plano)

En una base PostgreSQL 14+ vacía (por ejemplo desde el SQL Editor de Neon):

1. Ejecuta `schema.sql`.
2. Ejecuta `seed.sql`.
3. Crea el administrador con `npm run db:seed` apuntando `DATABASE_URL` a esa base: las contraseñas deben quedar hasheadas con bcrypt, por eso no se incluyen usuarios en el SQL.

Las tablas no tienen RLS: el control de acceso se hace en la aplicación (JWT + roles + verificación de propiedad en cada servicio).

## Entidades principales

| Dominio | Tablas |
|---|---|
| Cuentas | `usuarios`, `beneficiarios`, `constructoras`, `documentos_empresa`, `tokens_usuario` (verificación, recuperación, refresh y códigos MFA, siempre hasheados), `intentos_login` |
| Catálogos | `localidades`, `categorias_material`, `configuracion_sistema` |
| Donaciones | `materiales`, `fotos_material`, `solicitudes_material` (estado, valor donado congelado y número de constancia), `certificados_donacion` |
| Eventos | `eventos`, `materiales_evento`, `inscripciones_evento` |
| Comunidad | `publicaciones` (con reposts), `fotos_publicacion`, `materiales_publicacion`, `comentarios` (respuestas), `likes`, `likes_comentario`, `seguidores`, `reportes` |
| Grupos y mensajes | `grupos`, `temas_grupo`, `miembros_grupo`, `mensajes_grupo`, `conversaciones`, `mensajes_directos` |
| Operación | `notificaciones`, `auditoria` |

## Integridad y concurrencia

- **Stock:** aprobar una solicitud descuenta la cantidad con un `UPDATE … WHERE cantidad >= x` dentro de una transacción, así dos aprobaciones simultáneas nunca dejan stock negativo. Cancelar una solicitud aprobada repone la cantidad.
- **Solicitudes duplicadas:** la creación bloquea las filas del material y del beneficiario (`SELECT … FOR UPDATE`) antes de validar "una solicitud activa por material" y los límites configurados.
- **Cupos de eventos:** la inscripción bloquea la fila del evento antes de contar los inscritos vigentes.
- **Constancias:** el consecutivo sale de la secuencia `constancia_donacion_seq`, que Prisma no modela; la crea la migración y está incluida al final de `schema.sql`.
