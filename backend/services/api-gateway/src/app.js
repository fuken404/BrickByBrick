const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
const {
  config, logger, generalLimiter, authMiddleware, requireRoles, sendSuccess, sendError, uploadsRoot,
} = require('@brickbybrick/shared');
const { medir, resumen } = require('./metrics');

/** Prefijos de /api/v1 que atiende cada microservicio. */
const RUTAS = {
  auth:      ['/api/v1/auth'],
  users:     ['/api/v1/beneficiarios', '/api/v1/constructoras', '/api/v1/admin', '/api/v1/localidades',
              '/api/v1/perfiles', '/api/v1/public', '/api/v1/me'],
  materials: ['/api/v1/materiales', '/api/v1/solicitudes', '/api/v1/categorias', '/api/v1/tributario'],
  events:    ['/api/v1/eventos'],
  pubs:      ['/api/v1/publicaciones', '/api/v1/comentarios', '/api/v1/grupos', '/api/v1/seguidores',
              '/api/v1/conversaciones', '/api/v1/reportes'],
  notif:     ['/api/v1/notificaciones'],
};

const NOMBRES = {
  auth: 'auth-service', users: 'user-service', materials: 'material-service',
  events: 'event-service', pubs: 'publication-service', notif: 'notification-service',
};

function crearGateway() {
  const app = express();
  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
  app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
  if (!config.isTest) app.use(morgan('dev'));

  // Archivos subidos (fotos, logos, documentos)
  app.use('/uploads', express.static(uploadsRoot(), { maxAge: '7d', fallthrough: false }));

  // Salud agregada de todos los servicios
  app.get('/health', async (_req, res) => {
    const checks = await Promise.all(Object.entries(config.services).map(async ([clave, url]) => {
      const inicio = Date.now();
      try {
        const r = await axios.get(`${url}/health`, { timeout: 2500 });
        return { servicio: NOMBRES[clave], status: r.data?.status ?? 'ok', db: r.data?.db, latenciaMs: Date.now() - inicio };
      } catch {
        return { servicio: NOMBRES[clave], status: 'down', latenciaMs: Date.now() - inicio };
      }
    }));
    const ok = checks.every((c) => c.status === 'ok');
    res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', gateway: 'ok', servicios: checks });
  });

  // Métrica TRP (solo administradores)
  app.get('/api/v1/metricas/rendimiento', authMiddleware, requireRoles('ADMINISTRADOR'), (_req, res) =>
    sendSuccess(res, resumen()));

  app.use(generalLimiter);

  // Proxy REST por servicio
  for (const [clave, prefijos] of Object.entries(RUTAS)) {
    const proxy = createProxyMiddleware({
      target: config.services[clave],
      changeOrigin: true,
      xfwd: true,
      pathFilter: prefijos,
      on: {
        error: (err, _req, res) => {
          logger.error(`Proxy ${NOMBRES[clave]}: ${err.message}`);
          if (res.headersSent || typeof res.status !== 'function') return;
          sendError(res, `El servicio ${NOMBRES[clave]} no está disponible`, 502);
        },
      },
    });
    app.use(prefijos, medir(NOMBRES[clave]));
    app.use(proxy);
  }

  // WebSocket de notificaciones y chat
  const wsProxy = createProxyMiddleware({
    target: config.services.notif,
    changeOrigin: true,
    ws: true,
    pathFilter: '/ws',
  });
  app.use(wsProxy);

  app.use((req, res) => sendError(res, `Ruta no encontrada: ${req.method} ${req.path}`, 404));

  return { app, wsProxy };
}

module.exports = { crearGateway, RUTAS };
