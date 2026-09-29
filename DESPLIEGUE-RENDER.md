# Desplegar BrickByBrick en Render (plan gratis) — guía paso a paso

Esta guía está escrita para seguirla sin experiencia previa en despliegues. Si un botón de Render o Neon tiene un nombre un poco distinto al de aquí, busca el más parecido: las interfaces cambian, pero los pasos son los mismos.

**Tiempo estimado:** 30 a 45 minutos la primera vez (la primera construcción en Render tarda de 5 a 15 minutos).

> ¿Prefieres Railway? Mira [`DESPLIEGUE.md`](DESPLIEGUE.md). La aplicación es la misma; solo cambia la plataforma.

---

## Qué vas a tener al final

Una dirección pública con HTTPS (por ejemplo `https://brickbybrick.onrender.com`) donde funciona todo BrickByBrick: portada, registro, paneles de los tres roles, notificaciones en tiempo real, chat y subida de fotos y documentos.

Las piezas quedan así:

| Pieza | Dónde | Costo |
|---|---|---|
| **Aplicación** (frontend + API Gateway + 6 microservicios, en un contenedor Docker) | Render, plan *Free* | Gratis |
| **Base de datos PostgreSQL** (datos y también los archivos subidos) | Neon, plan *Free* | Gratis |

### Lo que debes saber del plan gratis de Render

| Limitación de Render | Cómo lo resolvimos |
|---|---|
| El servicio **se apaga tras 15 minutos sin visitas** y tarda cerca de un minuto en despertar. | La aplicación está optimizada para arrancar rápido (unos 30 segundos más). La **primera visita después de un rato sin uso tarda 1 a 2 minutos**; las siguientes son normales. Si quieres evitarlo, mira el [paso 8](#paso-8-opcional--mantener-la-aplicación-despierta). |
| **No hay disco persistente:** lo que se guarda en disco se borra al apagarse. | Las fotos y documentos se guardan **en la base de datos** (`STORAGE_DRIVER=db`), así no se pierden. |
| Muy poca CPU (una décima de procesador) y 512 MB de RAM. | Los 7 servicios corren en un solo proceso (`PROCESOS=uno`): usa unos 50 MB de RAM y arranca 5 veces más rápido. |
| **Bloquea el correo por SMTP** (Gmail, Outlook…). | Los correos y los **códigos de verificación en dos pasos** se leen en los *logs* de Render. Para enviar correos de verdad, mira el [Anexo B](#anexo-b--enviar-correos-de-verdad-resend). |
| Su PostgreSQL gratis **se borra a los 30 días**. | Usamos **Neon**, cuyo plan gratis no expira. |
| 750 horas gratis al mes por cuenta. | Un mes completo tiene como máximo 744 horas: alcanza para esta aplicación encendida todo el mes, siempre que no tengas otros servicios gratis en Render. |

Con estas condiciones, el plan gratis sirve para demostraciones y la sustentación. Para uso real con usuarios, conviene el plan *Starter* de Render (ver [Anexo C](#anexo-c--pasar-a-un-plan-pago)).

---

## Antes de empezar (checklist)

- [ ] Cuenta de **GitHub** con el repositorio `BrickByBrick` (`github.com/fuken404/BrickByBrick`).
- [ ] Cuenta de **Neon** (<https://neon.tech>) — ya la tienes.
- [ ] El código actualizado subido a GitHub (paso 1).

No necesitas generar claves secretas a mano: Render las crea solas.

---

## Paso 1 · Subir el código a GitHub

Render despliega lo que está en GitHub, no lo que tienes en tu computador.

1. Abre la Terminal y entra a la carpeta del proyecto:

   ```bash
   cd ~/Desktop/Proyectos/BrickByBrick
   ```

2. Revisa si hay cambios sin guardar:

   ```bash
   git status
   ```

   Si hay cambios que quieres desplegar, guárdalos:

   ```bash
   git add -A
   git commit -m "Describe aquí tus cambios"
   ```

3. Sube la rama `main`:

   ```bash
   git push origin main
   ```

4. En <https://github.com/fuken404/BrickByBrick> confirma que ves `Dockerfile`, `render.yaml` y `DESPLIEGUE-RENDER.md` en la raíz.

---

## Paso 2 · Crear la base de datos en Neon

1. Entra a <https://console.neon.tech>.
2. Crea una base **nueva y vacía**. Tienes dos opciones:
   - **Opción A (recomendada):** botón **New Project** → nombre `brickbybrick-prod` → región **AWS US West (Oregon)**, la misma región donde `render.yaml` crea la aplicación (así las consultas son más rápidas) → **Create**.
   - **Opción B:** dentro de tu proyecto actual → **Databases** → **New Database** → nombre `brickbybrick_prod`.

   > **No uses la base que ya tenías en Neon:** se creó con la versión anterior del proyecto y sin migraciones, y el arranque fallaría con el error `P3005`. Si necesitas conservar esos datos, primero hay que migrarlos (ver `database/README.md`).

3. Haz clic en **Connect** (o **Connection Details**) y:
   - En **Database** elige la base nueva.
   - **Desactiva** la opción **Connection pooling** (la conexión debe ser *directa*: el nombre del servidor **no** debe contener `-pooler`).
   - Copia la cadena de conexión. Se ve así:

     ```
     postgresql://usuario:contraseña@ep-algo-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

4. Guárdala en un lugar seguro (por ejemplo, una nota privada). La usarás en el paso 4. **No la compartas ni la subas a GitHub:** incluye la contraseña de tu base de datos.

---

## Paso 3 · Crear la cuenta de Render

1. Ve a <https://render.com> y haz clic en **Get Started** (o **Sign In**).
2. Elige **GitHub** para registrarte. Así Render puede leer tu repositorio.
3. Si te pide datos de facturación, puedes omitirlos: el plan *Free* no los exige para servicios gratis (si en tu caso los pide, es solo verificación).

---

## Paso 4 · Crear la aplicación con el Blueprint

El archivo `render.yaml` del repositorio (un *Blueprint*) le dice a Render cómo crear todo. Solo tienes que llenar tres datos.

1. En el panel de Render (*Dashboard*) haz clic en **New +** → **Blueprint**.
2. En **Connect a repository**, si no aparece tu repositorio, haz clic en **Configure account** / **Connect GitHub** y dale acceso a `BrickByBrick`.
3. Selecciona **fuken404/BrickByBrick** y haz clic en **Connect**.
4. Ponle un nombre al Blueprint (*Blueprint Name*), por ejemplo `BrickByBrick`. La rama debe ser `main`.
5. Render muestra el servicio **brickbybrick** (tipo *Web Service*, plan *Free*) y te pide tres variables:

   | Variable | Qué poner |
   |---|---|
   | `DATABASE_URL` | La cadena de conexión de Neon del paso 2 (completa, terminada en `?sslmode=require`). |
   | `ADMIN_EMAIL` | El correo con el que entrarás como administrador (puede ser el tuyo). |
   | `ADMIN_PASSWORD` | Una contraseña **nueva y fuerte**: mínimo 10 caracteres, con mayúscula, minúscula y número. **No uses la de desarrollo** (`Admin@BrickByBrick2024`): el repositorio es público. |

6. Haz clic en **Apply** (o **Deploy Blueprint**).

Render crea el servicio y empieza a construirlo. Las demás variables ya vienen configuradas desde `render.yaml`:

| Variable | Valor | Para qué |
|---|---|---|
| `JWT_SECRET`, `JWT_REFRESH_SECRET`, `INTERNAL_API_KEY` | Generadas por Render | Firmar sesiones y proteger la comunicación interna. |
| `STORAGE_DRIVER` | `db` | Guardar fotos y documentos en la base de datos. |
| `PROCESOS` | `uno` | Los 7 servicios en un solo proceso: arranque rápido con poca CPU. |
| `BCRYPT_ROUNDS` | `10` | Costo del cifrado de contraseñas; con 10 (mínimo recomendado por OWASP) el login tarda ~2 s en lugar de ~8 s. |
| `MAIL_TRANSPORT` | `log` | Correos y códigos de verificación en los logs. |
| `CLIENT_IP_HEADER` | `cf-connecting-ip,true-client-ip,x-forwarded-for` | Ver la IP real de cada visitante (para limitar intentos de login por persona). |

`FRONTEND_URL` no hace falta: la aplicación toma sola la dirección pública de Render (`RENDER_EXTERNAL_URL`).

> **¿No te aparece la opción Blueprint?** Mira el [Anexo A](#anexo-a--crear-el-servicio-sin-blueprint) para crear el servicio a mano.

---

## Paso 5 · Esperar y revisar el despliegue

1. En el Dashboard haz clic en el servicio **brickbybrick** → pestaña **Logs** (o **Events** → el despliegue en curso).
2. Primero verás la **construcción** (*build*) de la imagen Docker: compila Angular e instala el backend. Tarda de 5 a 15 minutos la primera vez. Es normal ver muchas líneas.
3. Luego el **arranque**. Deberías ver, en este orden:

   ```
   [arranque] Revisando migraciones…
   [migraciones] Pendientes: 0_init, 20260929000000_v2_revision_integral, 20260930000000_archivos_subidos
   All migrations have been successfully applied.
   [arranque] Cargando catálogos y datos iniciales…
   Seed completado.
   [arranque] Iniciando servicios…
   [iniciar-todo] Cargando auth-service
   ...
   [iniciar-todo] Microservicios listos; iniciando el gateway
   ... api-gateway escuchando en puerto 10000
   ```

4. Arriba debe aparecer **Live** (en verde) y el mensaje *Your service is live*. Render lo marca así cuando `/health` responde bien.

---

## Paso 6 · Probar la aplicación

1. Arriba a la izquierda del servicio verás la dirección, tipo `https://brickbybrick.onrender.com` (si el nombre estaba ocupado, tendrá letras extra). Ábrela: debe verse la portada.
2. Abre `https://…onrender.com/health`: debe decir `"status":"ok"` con los seis servicios.
3. Ve a **Iniciar sesión** y entra con tu `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
4. Te pedirá un **código de 6 dígitos**. Como los correos van a los logs:
   - En Render, pestaña **Logs** del servicio.
   - En el buscador escribe `código de acceso`.
   - Verás una línea como `[email:log] Para: tu@correo | Asunto: Tu código de acceso: 123456 — BrickByBrick`. Copia esos 6 dígitos en la app (vencen en 10 minutos).
5. ¡Listo! Estás en el panel de administración.

**Prueba completa recomendada:**

1. En una ventana de incógnito, **regístrate como constructora** (necesitas un PDF o imagen cualquiera para el RUT y la Cámara de Comercio).
2. Como administrador, en **Constructoras**, verifica esa empresa.
3. Como constructora, **publica un material con foto**.
4. Registra un **beneficiario**, solicita el material; como constructora apruébalo y márcalo entregado; descarga la **constancia PDF** en *Beneficio tributario*.
5. Espera 20 minutos sin usar la app (Render la apagará), vuelve a abrirla y confirma que la foto del material sigue ahí.

---

## Paso 7 (opcional) · Cargar las cuentas de demostración

Para presentaciones puedes cargar las cuentas de prueba (`beneficiario1..3@test.co`, `constructora1..2@test.co`, con la contraseña documentada en `backend/prisma/seed.js`) y datos de ejemplo:

1. Servicio → **Environment** → **Add Environment Variable**: `SEED_DEMO` = `true` → **Save Changes**.
2. Render reinicia la aplicación y crea las cuentas.

> **Atención:** esas contraseñas están publicadas en el repositorio. Úsalas solo mientras presentes; después **borra** `SEED_DEMO` y suspende esas cuentas desde *Administración → Usuarios*. Mientras `SEED_DEMO=true` esté activo, en cada arranque esas cuentas vuelven a su contraseña de demostración.

---

## Paso 8 (opcional) · Mantener la aplicación despierta

Para que no se apague a los 15 minutos (útil el día de la sustentación):

1. Crea una cuenta gratis en <https://uptimerobot.com>.
2. **Add New Monitor** → tipo **HTTP(s)** → URL `https://…onrender.com/health` → intervalo **5 minutes** → **Create Monitor**.

Así la visitan cada 5 minutos y Render no la apaga. Esto consume las 750 horas gratis del mes (un mes tiene como máximo 744), así que funciona siempre que no tengas otros servicios gratis en tu cuenta de Render. Si no lo necesitas, pausa el monitor.

---

## Cómo actualizar la aplicación después

Cada `git push origin main` hace que Render construya y despliegue la nueva versión automáticamente (`autoDeployTrigger: commit` en `render.yaml`). Las migraciones nuevas se aplican solas al arrancar.

---

## Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| La construcción falla en `ng build` | Hay código del frontend con errores en `main`. | En tu computador: `cd frontend && npx ng build`, corrige, haz commit y push. |
| En los logs: `Can't reach database server` | La cadena de Neon es incorrecta o la base no existe. | Revisa `DATABASE_URL` en **Environment**; debe terminar en `?sslmode=require`. |
| En los logs: `P3005` (*database schema is not empty*) | Apuntaste a una base que ya tenía tablas sin migraciones. | Usa una base **vacía** (paso 2). |
| Errores de migración mencionando `pgbouncer` o `prepared statement` | Usaste la conexión con *pooling* de Neon. | En Neon desactiva **Connection pooling** y copia de nuevo la cadena (sin `-pooler`). |
| En los logs: `ADMIN_PASSWORD debe tener al menos 10 caracteres…` | Contraseña débil. | Cámbiala en **Environment** por una más fuerte. |
| En los logs: `ADMIN_PASSWORD no está definida` | Falta la variable. | Agrégala en **Environment**. |
| La primera visita tarda 1 a 2 minutos | Render había apagado el servicio por inactividad. | Es normal en el plan gratis. Paso 8 para evitarlo. |
| El despliegue termina en *Deploy failed* / *Timed out* | Algún servicio no arrancó. | Busca en **Logs** líneas con `Error`; el nombre entre corchetes indica cuál falló. |
| "Demasiadas solicitudes" para todos al iniciar sesión | La IP real no se está leyendo. | Revisa que exista `CLIENT_IP_HEADER` en **Environment**. |
| Los enlaces de los correos apuntan a `localhost` | Definiste `FRONTEND_URL` a mano con otro valor. | Borra `FRONTEND_URL` (se toma sola) o ponle tu dirección `https://…onrender.com`. |

---

## Anexo A · Crear el servicio sin Blueprint

1. **New +** → **Web Service** → elige el repositorio `BrickByBrick`.
2. **Name:** `brickbybrick` · **Branch:** `main` · **Language / Runtime:** **Docker** · **Region:** Oregon · **Instance Type:** **Free**.
3. **Environment Variables** → agrega (usa **Generate** para los tres secretos si aparece el botón; si no, genéralos en la Terminal con `openssl rand -base64 32`):

   ```env
   DATABASE_URL=<cadena de Neon>
   ADMIN_EMAIL=<tu correo>
   ADMIN_PASSWORD=<contraseña fuerte>
   JWT_SECRET=<secreto>
   JWT_REFRESH_SECRET=<secreto>
   INTERNAL_API_KEY=<secreto>
   STORAGE_DRIVER=db
   PROCESOS=uno
   BCRYPT_ROUNDS=10
   MAIL_TRANSPORT=log
   CLIENT_IP_HEADER=cf-connecting-ip,true-client-ip,x-forwarded-for
   ```

4. **Advanced** → **Health Check Path:** `/health`.
5. **Create Web Service** y sigue desde el [paso 5](#paso-5--esperar-y-revisar-el-despliegue).

---

## Anexo B · Enviar correos de verdad (Resend)

Render bloquea el SMTP en el plan gratis, así que la aplicación usa la API de **Resend**:

1. Crea una cuenta en <https://resend.com> → **API Keys** → crea una clave (empieza por `re_`).
2. Para enviar a **cualquier** correo necesitas un **dominio propio verificado** en Resend (**Domains → Add Domain** y agregar los registros DNS que indique). Sin dominio, Resend solo envía al correo con el que creaste la cuenta, desde `onboarding@resend.dev`: sirve para probar, no para usuarios reales.
3. En Render → **Environment**:

   ```env
   MAIL_TRANSPORT=resend
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
   EMAIL_FROM=BrickByBrick <no-responder@tudominio.com>
   ```

> Mientras el correo real no funcione, deja `MAIL_TRANSPORT=log`: con Resend activo, un fallo de envío impide recibir el código de verificación del administrador.

---

## Anexo C · Pasar a un plan pago

Si la app va a tener usuarios reales:

- Cambia el servicio a **Starter** (Settings → Instance Type): no se apaga y tiene más CPU. Puedes quitar `PROCESOS=uno` y `BCRYPT_ROUNDS=10` para volver a los valores por defecto (un proceso por servicio y costo 12).
- Opcional: agrega un **Disk** (Settings → Disks) con *Mount Path* `/data/uploads` y cambia `STORAGE_DRIVER` a `local` para guardar los archivos en disco en vez de en la base de datos.
- Neon gratis ofrece 0,5 GB: con los archivos guardados en la base, eso alcanza para varios cientos de fotos. Si se queda corto, baja el tamaño máximo por archivo con `MAX_UPLOAD_MB=3` o pasa a un plan de Neon con más espacio.

---

## Anexo D · Referencia técnica

| Archivo | Función |
|---|---|
| `render.yaml` | Blueprint: servicio web Docker en plan *Free*, health check en `/health`, despliegue automático con cada commit y las variables descritas arriba. |
| `Dockerfile` | Imagen en tres etapas: compila Angular, instala el backend y el cliente Prisma y arma una imagen final `node:20-alpine`. |
| `backend/scripts/docker-entrypoint.sh` | Al arrancar: revisa y aplica migraciones, ejecuta el seed y lanza los servicios. |
| `backend/scripts/migrar.js` | Solo ejecuta `prisma migrate deploy` si hay migraciones pendientes (la CLI de Prisma es lenta con poca CPU). |
| `backend/scripts/iniciar-todo.js` | Lanza los 6 microservicios y, cuando responden en `/health`, el gateway. Con `PROCESOS=uno` los ejecuta en un solo proceso. |

Medido emulando la instancia gratis (0,1 CPU, 512 MB): primer arranque con base vacía ≈ 60 s; arranque tras inactividad ≈ 30 s (más el tiempo que tarda Render en despertar el servicio); memoria ≈ 50 MB; login ≈ 2 s.
