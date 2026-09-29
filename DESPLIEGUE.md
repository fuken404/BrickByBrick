# Desplegar BrickByBrick en Railway — guía paso a paso

Esta guía está escrita para seguirla sin experiencia previa en despliegues. Si un botón de Railway tiene un nombre un poco distinto al de aquí, busca el más parecido: la interfaz cambia de vez en cuando, pero los pasos son los mismos.

**Tiempo estimado:** 30 a 45 minutos la primera vez.

> ¿Prefieres Render (tiene plan gratis)? Mira [`DESPLIEGUE-RENDER.md`](DESPLIEGUE-RENDER.md).

---

## Qué vas a tener al final

Una dirección pública con HTTPS (por ejemplo `https://brickbybrick-production.up.railway.app`) donde funciona todo BrickByBrick: la portada, el registro, los paneles de los tres roles, las notificaciones en tiempo real, el chat y la subida de fotos y documentos.

En Railway quedarán **dos piezas**:

| Pieza | Qué es |
|---|---|
| **Postgres** | La base de datos. |
| **BrickByBrick** | Un solo contenedor Docker con el frontend Angular compilado, el API Gateway y los 6 microservicios, más un **volumen** (un disco que no se borra) para las fotos y documentos subidos. |

> **¿Por qué un solo contenedor y no uno por microservicio?** En Railway un volumen solo puede conectarse a un servicio, y en BrickByBrick varios microservicios guardan y leen archivos subidos. Al correr juntos en un contenedor comparten el mismo disco, se hablan por `localhost` y el costo es menor. El código sigue siendo de microservicios (cada uno es un proceso independiente con su propia responsabilidad); solo cambia cómo se empaquetan para desplegar.

---

## Antes de empezar (checklist)

- [ ] Una cuenta de **GitHub** con el repositorio `BrickByBrick` (ya la tienes: `github.com/fuken404/BrickByBrick`).
- [ ] El código actualizado **subido a GitHub** (paso 1).
- [ ] Una tarjeta débito o crédito para activar el plan de Railway. Railway cobra por uso; al momento de escribir esto el plan *Hobby* cuesta 5 USD al mes e incluye 5 USD de consumo, suficiente para este proyecto. Consulta los valores vigentes en <https://railway.com/pricing>.
- [ ] La **Terminal** de tu Mac (para generar las claves secretas en el paso 6).

---

## Paso 1 · Subir el código a GitHub

Railway despliega lo que está en GitHub, no lo que tienes en tu computador.

1. Abre la Terminal y entra a la carpeta del proyecto:

   ```bash
   cd ~/Desktop/Proyectos/BrickByBrick
   ```

2. Revisa si tienes cambios sin guardar en git:

   ```bash
   git status
   ```

   Si aparecen archivos modificados que **quieres** desplegar, guárdalos con un commit (cambia el mensaje por uno que describa tus cambios):

   ```bash
   git add -A
   git commit -m "Describe aquí tus cambios"
   ```

   Si son cambios a medias que **no** quieres desplegar todavía, déjalos así: no se suben.

3. Sube la rama `main`:

   ```bash
   git push origin main
   ```

4. Entra a <https://github.com/fuken404/BrickByBrick> y confirma que ves los archivos `Dockerfile`, `railway.json` y `DESPLIEGUE.md` en la raíz.

---

## Paso 2 · Crear la cuenta de Railway

1. Ve a <https://railway.com> y haz clic en **Login**.
2. Elige **Login with GitHub** y autoriza a Railway. Usar GitHub aquí facilita el paso 4.
3. Si te pide elegir o activar un plan, elige **Hobby** y agrega tu tarjeta. Con el plan de prueba (*Trial*) también funciona, pero tiene límites más bajos.

---

## Paso 3 · Crear el proyecto y la base de datos

1. En el panel de Railway (*Dashboard*) haz clic en **New Project** (o **+ New**).
2. Elige **Deploy PostgreSQL** (o **Database → Add PostgreSQL**).
3. Espera unos segundos: aparece un recuadro llamado **Postgres** en el lienzo del proyecto. Esa es tu base de datos, vacía.
4. (Opcional) Arriba a la izquierda, haz clic en el nombre del proyecto y cámbialo a `BrickByBrick`.

> No tienes que copiar la contraseña ni la dirección de la base de datos: en el paso 6 la conectamos con una **referencia** que Railway rellena sola.

¿Prefieres seguir usando **Neon**? Mira el [Anexo A](#anexo-a--usar-neon-en-lugar-de-postgres-de-railway) y salta este paso.

---

## Paso 4 · Agregar la aplicación desde GitHub

1. Dentro del proyecto, haz clic en **+ New** (arriba a la derecha) o haz clic derecho en el lienzo.
2. Elige **GitHub Repo**.
3. Si es la primera vez, Railway te pedirá **instalar la GitHub App**: elige tu cuenta y dale acceso al repositorio `BrickByBrick` (puedes marcar *Only select repositories* y escoger solo ese).
4. Selecciona el repositorio **fuken404/BrickByBrick**.
5. Aparece un segundo recuadro (servicio) con el nombre del repositorio. Railway detecta solo el `railway.json` y el `Dockerfile` y empieza a construir.

**El primer intento va a fallar, y es normal:** todavía no tiene variables (base de datos, claves). Lo arreglamos en los pasos 5 a 7.

6. Haz clic en ese servicio → pestaña **Settings** y revisa:
   - **Source → Branch:** `main`.
   - **Build → Builder:** *Dockerfile* (lo toma de `railway.json`).
   - (Opcional) En **Service Name** cámbiale el nombre a `app`.

---

## Paso 5 · Crear el volumen para los archivos subidos

Sin este paso, las fotos y documentos se borrarían en cada despliegue.

1. En el lienzo del proyecto, haz **clic derecho** en un espacio vacío (o presiona `⌘ K` / `Ctrl K`) y elige **Volume** / **Create Volume**.
2. Railway te pregunta a qué servicio conectarlo: elige el servicio de la aplicación (el del paso 4, **no** Postgres).
3. En **Mount path** escribe exactamente:

   ```
   /data/uploads
   ```

4. Guarda. El volumen aparece "pegado" al servicio de la aplicación.

---

## Paso 6 · Configurar las variables de entorno

### 6.1 Generar las claves secretas

En la Terminal de tu Mac, copia y pega este comando y presiona Enter:

```bash
echo "JWT_SECRET=$(openssl rand -hex 32)"; echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"; echo "INTERNAL_API_KEY=$(openssl rand -hex 24)"
```

Verás tres líneas con valores largos y aleatorios. Déjalas a mano: las pegas en el siguiente paso. **No compartas estos valores con nadie ni los subas a GitHub.**

### 6.2 Elegir la cuenta de administrador

Decide:

- **ADMIN_EMAIL:** el correo con el que entrarás como administrador (puede ser el tuyo).
- **ADMIN_PASSWORD:** una contraseña **nueva y fuerte**: mínimo 10 caracteres, con mayúscula, minúscula y número. **No uses la de desarrollo** (`Admin@BrickByBrick2024`): el repositorio es público y cualquiera la conoce. Si la contraseña es débil, la aplicación no arranca y lo dice en los logs.

### 6.3 Pegar las variables en Railway

1. Haz clic en el servicio de la aplicación → pestaña **Variables**.
2. Haz clic en **Raw Editor** (editor de texto).
3. Pega este bloque y **reemplaza** lo que está entre `<...>`:

   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   PORT=3000
   FRONTEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
   CLIENT_IP_HEADER=x-real-ip
   MAIL_TRANSPORT=log

   JWT_SECRET=<pega aquí el valor generado>
   JWT_REFRESH_SECRET=<pega aquí el valor generado>
   INTERNAL_API_KEY=<pega aquí el valor generado>

   ADMIN_EMAIL=<tu correo de administrador>
   ADMIN_PASSWORD=<tu contraseña fuerte>
   ```

4. Haz clic en **Update Variables** (o **Save**). Railway ofrecerá volver a desplegar: acepta (**Deploy**).

Qué hace cada una:

| Variable | Para qué sirve |
|---|---|
| `DATABASE_URL` | Conecta con la base de datos del paso 3. `${{Postgres.DATABASE_URL}}` es una referencia: Railway la reemplaza por la dirección real. Si tu base de datos tiene otro nombre en el lienzo, cambia `Postgres` por ese nombre. |
| `PORT` | Puerto en el que escucha la aplicación dentro del contenedor. |
| `FRONTEND_URL` | La dirección pública de la app; se usa en los enlaces de los correos (verificar correo, restablecer contraseña). Se rellena sola cuando generes el dominio en el paso 7. |
| `CLIENT_IP_HEADER` | Permite ver la IP real de cada visitante detrás del proxy de Railway. Sin esto, el límite de intentos de login se aplicaría a todos los usuarios a la vez. |
| `MAIL_TRANSPORT=log` | Los correos (incluidos los **códigos de verificación en dos pasos**) se escriben en los logs de Railway en lugar de enviarse. Railway bloquea el SMTP en los planes Trial y Hobby; para enviar correos de verdad mira el [Anexo B](#anexo-b--enviar-correos-de-verdad-resend). |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Firman las sesiones. Si las cambias, todos los usuarios deberán iniciar sesión de nuevo. |
| `INTERNAL_API_KEY` | Protege la comunicación interna entre microservicios. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Crean el administrador la primera vez que arranca la app. Después puedes cambiar la contraseña desde *Mi cuenta*. |

> **Para gastar menos en Railway** (cobra por memoria y CPU usadas), puedes agregar `PROCESOS=uno`: los 7 servicios corren en un solo proceso Node y la memoria baja de unos 300 MB a unos 50–120 MB. Pierdes algo de aislamiento entre servicios; para una demostración no se nota.

---

## Paso 7 · Publicar la aplicación en internet (dominio)

1. En el servicio de la aplicación → pestaña **Settings** → sección **Networking** (o **Public Networking**).
2. Haz clic en **Generate Domain**.
3. Si te pregunta el puerto (*target port*), escribe **3000**.
4. Railway te muestra una dirección tipo `https://algo.up.railway.app`. Esa es la dirección de tu aplicación.

Como `FRONTEND_URL` usa `${{RAILWAY_PUBLIC_DOMAIN}}`, se actualiza sola. Si Railway no vuelve a desplegar automáticamente, ve a **Deployments** y haz clic en **Redeploy** en el despliegue más reciente.

---

## Paso 8 · Verificar el despliegue

### 8.1 Mirar los logs

1. Servicio de la aplicación → pestaña **Deployments** → haz clic en el despliegue más reciente → **View Logs** (*Deploy Logs*).
2. Deberías ver, en este orden:

   ```
   [arranque] Revisando migraciones…
   [migraciones] Pendientes: 0_init, 20260929000000_v2_revision_integral, 20260930000000_archivos_subidos
   All migrations have been successfully applied.
   [arranque] Cargando catálogos y datos iniciales…
   Seed completado.
   [arranque] Iniciando servicios…
   ... auth-service escuchando en puerto 3001
   ... user-service escuchando en puerto 3002
   ... material-service escuchando en puerto 3003
   ... event-service escuchando en puerto 3004
   ... publication-service escuchando en puerto 3005
   ... notification-service (HTTP + WebSocket) escuchando en puerto 3006
   [iniciar-todo] Microservicios listos; iniciando el gateway
   ... api-gateway escuchando en puerto 3000
   ```

   En los siguientes arranques verás `[migraciones] La base de datos está al día` en lugar de la lista de pendientes.

3. El despliegue debe quedar en estado **Active** / **Success** (en verde). Railway lo marca así cuando `https://tu-app/health` responde bien.

### 8.2 Probar en el navegador

1. Abre tu dirección `https://….up.railway.app`: debe verse la portada.
2. Abre `https://….up.railway.app/health`: debe decir `"status":"ok"` con los seis servicios.
3. Entra a **Iniciar sesión** con tu `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
4. Te pedirá un **código de 6 dígitos**. Como los correos van a los logs:
   - Vuelve a los **Deploy Logs** de Railway.
   - En el buscador de logs escribe `código de acceso`.
   - Verás una línea como `[email:log] Para: tu@correo | Asunto: Tu código de acceso: 123456 — BrickByBrick`. Copia esos 6 dígitos en la app (vencen en 10 minutos).
5. ¡Listo! Estás en el panel de administración.

### 8.3 Prueba completa recomendada

1. Abre otra ventana en modo incógnito y **regístrate como constructora** (necesitas un PDF o imagen cualquiera para el RUT y la Cámara de Comercio).
2. Como administrador, en **Constructoras**, verifica esa empresa.
3. Como constructora, **publica un material** con foto.
4. Registra un **beneficiario**, solicita el material; como constructora apruébalo y márcalo entregado; descarga la **constancia PDF** en *Beneficio tributario*.
5. Haz un redeploy (**Deployments → Redeploy**) y confirma que la foto del material sigue ahí: eso prueba que el volumen funciona.

---

## Paso 9 (opcional) · Cargar las cuentas de demostración

Para presentaciones o la sustentación puedes cargar las cuentas de prueba (`beneficiario1..3@test.co`, `constructora1..2@test.co` con la contraseña documentada en `backend/prisma/seed.js`) y datos de ejemplo.

1. Servicio de la aplicación → **Variables** → **New Variable**: `SEED_DEMO` = `true`.
2. Railway vuelve a desplegar y crea las cuentas y los datos.

> **Atención:** estas contraseñas están publicadas en el repositorio. Cualquiera que las lea podría entrar con esas cuentas. Úsalas solo mientras presentes y después **borra** la variable `SEED_DEMO` y suspende esas cuentas desde *Administración → Usuarios*. Con `SEED_DEMO=true` activo, en cada reinicio esas cuentas vuelven a su contraseña de demostración.

---

## Cómo actualizar la aplicación después

Cada vez que hagas `git push origin main`, Railway construye y despliega la nueva versión automáticamente. Las migraciones de base de datos nuevas se aplican solas al arrancar. Mientras se reinicia hay algunos segundos sin servicio, porque el volumen solo puede estar conectado a un despliegue a la vez.

Para desactivar el despliegue automático: servicio → **Settings** → desactiva *Autodeploy*; luego despliega manualmente con `⌘ K` → *Deploy Latest Commit*.

---

## Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El build falla en `ng build` | Hay código del frontend con errores en `main`. | Ejecuta `cd frontend && npx ng build` en tu computador, corrige los errores, haz commit y push. |
| En los logs: `Environment variable not found: DATABASE_URL` o `Can't reach database server` | La variable falta o no apunta a la base de datos. | Revisa que `DATABASE_URL=${{Postgres.DATABASE_URL}}` use el nombre exacto del recuadro de la base de datos. |
| En los logs: `JWT_SECRET debe tener al menos 32 caracteres` | Falta una clave o es corta. | Genera las claves otra vez con el comando del paso 6.1. |
| En los logs: `ADMIN_PASSWORD debe tener al menos 10 caracteres…` | La contraseña del administrador es débil. | Cámbiala por una más fuerte en **Variables**. |
| En los logs: `ADMIN_PASSWORD no está definida` | Falta la variable. | Agrégala; en el siguiente arranque se crea el administrador. |
| El despliegue se queda en *Health check failed* | Algún servicio no arrancó. | Busca en los logs líneas con `Error` o `terminó (código …)`: el nombre entre corchetes indica cuál falló. |
| `Application failed to respond` al abrir la URL | El dominio apunta a otro puerto. | **Settings → Networking**: el puerto del dominio debe ser **3000**. |
| Los enlaces de los correos apuntan a `localhost` | `FRONTEND_URL` no se actualizó. | Revisa que sea `https://${{RAILWAY_PUBLIC_DOMAIN}}` y redespliega. |
| Las fotos desaparecen tras un despliegue | No hay volumen o está en otra ruta. | Paso 5: el *Mount path* debe ser `/data/uploads` en el servicio de la aplicación. |
| El login dice "Demasiadas solicitudes" a todos los usuarios | Falta `CLIENT_IP_HEADER`. | Agrega `CLIENT_IP_HEADER=x-real-ip`. |
| Error de migración `P3005` (*database schema is not empty*) | Apuntaste a una base de datos que ya tenía tablas creadas sin migraciones. | Usa una base de datos **vacía** (ver Anexo A). |

---

## Anexo A · Usar Neon en lugar de Postgres de Railway

La aplicación funciona con cualquier PostgreSQL 14 o superior. Para usar Neon:

1. En <https://console.neon.tech> abre tu proyecto → **Databases** → **New Database** y crea una **nueva base vacía**, por ejemplo `brickbybrick_prod`.

   > **No uses la base de Neon que ya tenías:** fue creada con la versión anterior del proyecto y sin migraciones, y el arranque fallaría con el error `P3005`. Si necesitas conservar esos datos, primero hay que migrarlos (ver `database/README.md`).

2. En **Connection Details** elige esa base y copia la cadena de conexión (empieza por `postgresql://` y termina en `?sslmode=require`).
3. En el paso 6, en vez de `DATABASE_URL=${{Postgres.DATABASE_URL}}`, pega:

   ```env
   DATABASE_URL=postgresql://usuario:contraseña@ep-xxxx.aws.neon.tech/brickbybrick_prod?sslmode=require
   ```

4. Omite el paso 3 (no crees Postgres en Railway).

---

## Anexo B · Enviar correos de verdad (Resend)

Railway bloquea el SMTP (Gmail, Outlook, etc.) en los planes Trial y Hobby, así que la aplicación usa la API de **Resend**:

1. Crea una cuenta en <https://resend.com>.
2. En **API Keys** crea una clave y cópiala (empieza por `re_`).
3. Para enviar a **cualquier** correo necesitas un **dominio propio verificado** en Resend (**Domains → Add Domain**, y agregar los registros DNS que te indique en tu proveedor de dominio). Sin dominio, Resend solo permite enviar al correo con el que creaste la cuenta, desde `onboarding@resend.dev`: sirve para probar, pero no para usuarios reales.
4. En Railway → **Variables**, cambia y agrega:

   ```env
   MAIL_TRANSPORT=resend
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
   EMAIL_FROM=BrickByBrick <no-responder@tudominio.com>
   ```

5. Redespliega y prueba "¿Olvidaste tu contraseña?" con tu propio correo.

> Si Resend rechaza un envío, el error aparece en los logs como `Resend respondió 403: …`. Mientras el correo real no funcione, deja `MAIL_TRANSPORT=log`: con Resend activo, un fallo de envío impide recibir el código de verificación del administrador.

---

## Anexo C · Probar la imagen Docker en tu computador

Antes de subir cambios grandes puedes levantar exactamente la misma imagen que usa Railway:

```bash
cd backend
docker compose --profile app up --build
```

Abre <http://localhost:8080>. Usa la base de datos local de Docker y las variables de `backend/.env`. Para detenerlo: `Ctrl + C` y luego `docker compose --profile app down`.

---

## Anexo D · Referencia técnica

| Archivo | Función |
|---|---|
| `Dockerfile` | Imagen en tres etapas: compila Angular, instala el backend (solo dependencias de producción) y genera el cliente Prisma, y arma una imagen final `node:20-alpine`. |
| `railway.json` | Indica a Railway que construya con el `Dockerfile`, que verifique `/health` (hasta 300 s) y que reinicie el servicio si falla. |
| `backend/scripts/docker-entrypoint.sh` | Al arrancar: migraciones pendientes (`scripts/migrar.js`), seed (catálogos, configuración y administrador) e inicio de los servicios. |
| `backend/scripts/iniciar-todo.js` | Lanza los 6 microservicios, espera a que respondan y luego el gateway; prefija sus logs y, si uno se detiene, detiene el contenedor para que Railway lo reinicie. Con `PROCESOS=uno` todo corre en un solo proceso. |
| `.dockerignore` | Evita copiar a la imagen `node_modules`, compilaciones locales, secretos (`.env`) y archivos subidos. |

Variables que define la imagen (no hace falta ponerlas en Railway): `NODE_ENV=production`, `FRONTEND_DIST=/app/public`, `UPLOADS_DIR=/data/uploads`, `MAIL_TRANSPORT=log`, `LOG_LEVEL=info`.
