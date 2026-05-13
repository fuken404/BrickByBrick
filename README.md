# BrickByBrick

Plataforma digital para la donación de materiales de construcción excedentes en Bogotá. Conecta constructoras donadoras con beneficiarios bajo el marco legal del **Art. 255, Ley 1819/2016** (beneficios tributarios).

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 17+, Angular Material, SCSS |
| Backend | Node.js + Express (microservicios) |
| Base de datos | PostgreSQL (Neon serverless) |
| ORM | Prisma |
| Autenticación | JWT (access token 15 min + refresh token 7 días) |
| Tiempo real | Socket.io (notificaciones) |

---

## Estructura del proyecto

```
BrickByBrick/
├── frontend/                    # Angular app
├── backend/
│   ├── services/
│   │   ├── auth-service/        # Puerto 3001 — login, registro, JWT
│   │   ├── user-service/        # Puerto 3002 — beneficiarios, constructoras, admin
│   │   ├── material-service/    # Puerto 3003 — materiales, solicitudes
│   │   ├── event-service/       # Puerto 3004 — eventos, inscripciones
│   │   ├── publication-service/ # Puerto 3005 — publicaciones, comentarios
│   │   └── notification-service/# Puerto 3006 — notificaciones, websockets
│   ├── shared/                  # Middleware, utils y cliente Prisma compartidos
│   ├── prisma/                  # Schema de base de datos
│   └── uploads/                 # Archivos subidos (generado automáticamente)
└── database/                    # Scripts SQL de referencia
```

---

## Requisitos previos

- **Node.js** v20 o superior
- **npm** v10 o superior
- Cuenta en [Neon](https://neon.tech) (PostgreSQL serverless) o una instancia PostgreSQL propia

---

## Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd BrickByBrick
```

### 2. Configurar variables de entorno

Crea el archivo `backend/.env` con el siguiente contenido y completa los valores:

```env
# Base de datos (Neon u otro PostgreSQL)
DATABASE_URL="postgresql://usuario:password@host/db?sslmode=require"

# JWT — usa strings aleatorios seguros (mínimo 32 caracteres)
JWT_SECRET="reemplaza_con_un_string_seguro_de_32_chars"
JWT_REFRESH_SECRET="reemplaza_con_otro_string_seguro_diferente"

# SMTP (opcional — para emails de recuperación de contraseña)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="tu_email@gmail.com"
SMTP_PASS="tu_app_password_de_gmail"
EMAIL_FROM="BrickByBrick <noreply@brickbybrick.co>"

# Puertos de los microservicios
PORT_AUTH=3001
PORT_USERS=3002
PORT_MATERIALS=3003
PORT_EVENTS=3004
PORT_PUBS=3005
PORT_NOTIF=3006

# URL del frontend (para CORS)
FRONTEND_URL="http://localhost:4200"

# Clave interna entre servicios
INTERNAL_API_KEY="clave_interna_segura_aleatoria"

NODE_ENV=development
```

> **Las variables de SMTP son opcionales.** Sin ellas la recuperación de contraseña no funcionará, pero el resto de la aplicación sí.

### 3. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 4. Inicializar la base de datos

```bash
# Genera el cliente Prisma
npm run db:generate

# Crea las tablas en la base de datos
npm run db:push
```

### 5. Ejecutar el backend

```bash
npm run dev
```

Esto levanta los 6 microservicios en paralelo. Verifica que estén corriendo:

```
http://localhost:3001/health  →  auth-service
http://localhost:3002/health  →  user-service
http://localhost:3003/health  →  material-service
http://localhost:3004/health  →  event-service
http://localhost:3005/health  →  publication-service
http://localhost:3006/health  →  notification-service
```

### 6. Instalar dependencias del frontend

En otra terminal:

```bash
cd frontend
npm install
```

### 7. Ejecutar el frontend

```bash
npm start
```

La aplicación estará disponible en **http://localhost:4200**

---

## Crear el primer usuario administrador

Con el backend corriendo, ejecuta desde la carpeta `backend/`:

```bash
node -e "
const { prisma } = require('./shared');
const bcrypt = require('bcryptjs');
async function main() {
  const hash = await bcrypt.hash('TuPasswordSeguro.', 10);
  const user = await prisma.usuario.create({
    data: { email: 'admin@tudominio.com', passwordHash: hash, rol: 'ADMINISTRADOR', estado: 'activo' }
  });
  console.log('Admin creado:', user.email);
  await prisma.\$disconnect();
}
main();
"
```

---

## Roles de usuario

| Rol | Capacidades |
|-----|-------------|
| `BENEFICIARIO` | Solicitar materiales, inscribirse a eventos, publicar en comunidad |
| `CONSTRUCTORA` | Publicar materiales, crear eventos, gestionar solicitudes recibidas |
| `ADMINISTRADOR` | Acceso total — usuarios, materiales, eventos, reportes y configuración |

---

## Variables de entorno — resumen

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | Sí | Secreto para firmar access tokens |
| `JWT_REFRESH_SECRET` | Sí | Secreto para firmar refresh tokens |
| `FRONTEND_URL` | Sí | URL del frontend (para CORS) |
| `INTERNAL_API_KEY` | Sí | Clave para comunicación interna entre servicios |
| `SMTP_*` | No | Configuración de email (recuperación de contraseña) |
