# BrickByBrick — Base de Datos

## Archivos

| Archivo | Descripción |
|---|---|
| `schema.sql` | Schema completo: tablas, ENUMs, índices, RLS y vistas |
| `seed.sql` | Datos iniciales: localidades, categorías y admin |
| `../backend/prisma/schema.prisma` | Schema equivalente para Prisma ORM |

---

## Neon

### Prerrequisitos
- Proyecto creado en [neon.tech](https://neon.tech)
- Acceso al **SQL Editor** del proyecto

### Pasos

1. **Abrir SQL Editor** en el dashboard de Neon.

2. **Deshabilitar las políticas RLS** (Neon no usa Supabase Auth):
   Antes de ejecutar `schema.sql`, comentar o eliminar el bloque RLS:
   ```sql
   -- Comentar estas líneas en schema.sql antes de ejecutar:
   -- ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
   -- ALTER TABLE documentos_empresa ENABLE ROW LEVEL SECURITY;
   -- CREATE POLICY ...
   ```
   El control de acceso se gestiona a nivel de aplicación con JWT.

3. **Ejecutar schema.sql** (sin el bloque RLS).

4. **Ejecutar seed.sql**.

5. **Obtener la cadena de conexión**
   - Ir a `Dashboard → Connection Details`.
   - Copiar la URI `postgresql://...`.

6. **Configurar variable de entorno**
   ```env
   DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/[DBNAME]?sslmode=require"
   ```

---

## Configurar Prisma

### Instalación

```bash
cd backend
npm install prisma @prisma/client
```

### Sincronizar con DB existente (introspección)

Si la DB ya tiene el schema aplicado:
```bash
npx prisma db pull
```

### Aplicar schema desde cero (entorno de desarrollo)

```bash
npx prisma db push
```

### Generar cliente Prisma

```bash
npx prisma generate
```

### Archivo `.env` requerido

Crear `backend/.env` con:
```env
DATABASE_URL="postgresql://..."
```

### Migraciones en producción

Para crear una migración formal:
```bash
npx prisma migrate dev --name init
```

---

## Credenciales del admin inicial

| Campo | Valor |
|---|---|
| Email | `admin@brickbybrick.co` |
| Password | `Admin@BrickByBrick2024` |

> **Cambiar la contraseña en el primer login.**

Para regenerar el hash manualmente en PostgreSQL:
```sql
UPDATE usuarios
SET password_hash = crypt('NuevaContraseña', gen_salt('bf', 12))
WHERE email = 'admin@brickbybrick.co';
```

---

## Notas de diseño

- **PK:** UUID en todas las tablas (`gen_random_uuid()`), excepto `localidades` y `categorias_material` que usan `SMALLINT GENERATED ALWAYS AS IDENTITY` por ser catálogos estáticos.
- **Timestamps:** `TIMESTAMPTZ` (con zona horaria). Bogotá = UTC-5.
- **Valores monetarios:** `NUMERIC(15,2)` en COP.
- **`reportes.contenido_id`:** UUID polimórfico sin FK. El tipo de contenido se discrimina con `tipo_contenido`.
- **`valor_estimado` en materiales:** No se almacena; se calcula en el service de certificados basándose en precios de referencia por categoría.
