const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { z } = require('zod');

/**
 * Configuración validada al arrancar cualquier servicio.
 * Si falta una variable obligatoria el proceso termina con un mensaje claro.
 */
const port = (def) => z.coerce.number().int().positive().default(def);

// Render publica la URL del servicio en RENDER_EXTERNAL_URL: se usa si no se definió FRONTEND_URL
if (!process.env.FRONTEND_URL && process.env.RENDER_EXTERNAL_URL) {
  process.env.FRONTEND_URL = process.env.RENDER_EXTERNAL_URL;
}

const schema = z.object({
  NODE_ENV:           z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL:       z.string().min(1, 'DATABASE_URL es obligatoria'),
  JWT_SECRET:         z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  INTERNAL_API_KEY:   z.string().min(16, 'INTERNAL_API_KEY debe tener al menos 16 caracteres'),
  FRONTEND_URL:       z.string().url().default('http://localhost:4200'),

  PORT_GATEWAY:   port(3000),
  PORT_AUTH:      port(3001),
  PORT_USERS:     port(3002),
  PORT_MATERIALS: port(3003),
  PORT_EVENTS:    port(3004),
  PORT_PUBS:      port(3005),
  PORT_NOTIF:     port(3006),

  // URLs internas (en Docker se sobrescriben con el nombre del servicio)
  AUTH_SERVICE_URL:      z.string().url().optional(),
  USER_SERVICE_URL:      z.string().url().optional(),
  MATERIAL_SERVICE_URL:  z.string().url().optional(),
  EVENT_SERVICE_URL:     z.string().url().optional(),
  PUB_SERVICE_URL:       z.string().url().optional(),
  NOTIF_SERVICE_URL:     z.string().url().optional(),

  UPLOADS_DIR:    z.string().default(path.resolve(__dirname, '../uploads')),
  MAX_UPLOAD_MB:  z.coerce.number().positive().default(10),

  SMTP_HOST:   z.string().optional(),
  SMTP_PORT:   z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER:   z.string().optional(),
  SMTP_PASS:   z.string().optional(),
  EMAIL_FROM:  z.string().default('BrickByBrick <noreply@brickbybrick.co>'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const detalle = parsed.error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`Configuración inválida:\n${detalle}`);
  process.exit(1);
}

const env = parsed.data;
const local = (p) => `http://localhost:${p}`;

const config = {
  ...env,
  isProduction: env.NODE_ENV === 'production',
  isTest:       env.NODE_ENV === 'test',
  services: {
    auth:      env.AUTH_SERVICE_URL     || local(env.PORT_AUTH),
    users:     env.USER_SERVICE_URL     || local(env.PORT_USERS),
    materials: env.MATERIAL_SERVICE_URL || local(env.PORT_MATERIALS),
    events:    env.EVENT_SERVICE_URL    || local(env.PORT_EVENTS),
    pubs:      env.PUB_SERVICE_URL      || local(env.PORT_PUBS),
    notif:     env.NOTIF_SERVICE_URL    || local(env.PORT_NOTIF),
  },
  smtpConfigurado: Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
};

module.exports = config;
