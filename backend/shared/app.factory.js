const path = require('path');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const prisma = require('./utils/prisma.client');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/error.handler');
const { generalLimiter } = require('./middleware/rate.limiter');
const modoMantenimiento = require('./middleware/mantenimiento.middleware');
const { sendError } = require('./utils/response.utils');

/**
 * Crea una app Express con la configuración común de todos los microservicios.
 *
 * @param {{
 *   name: string,
 *   title: string,
 *   routes: Array<[string, import('express').Router]>,
 *   serviceDir: string,
 *   configure?: (app: import('express').Express) => void,
 * }} options
 */
function createApp({ name, title, routes, serviceDir, configure }) {
  const app = express();

  // Detrás del gateway / proxies de Docker: usar la IP real del cliente
  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:4200', credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', service: name, uptime: Math.round(process.uptime()), db: 'ok' });
    } catch (err) {
      logger.error(`Health check DB falló: ${err.message}`);
      res.status(503).json({ status: 'degraded', service: name, db: 'error' });
    }
  });

  const spec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: { title: `BrickByBrick — ${title}`, version: '2.0.0' },
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
      security: [{ bearerAuth: [] }],
    },
    apis: [path.join(serviceDir, 'src/routes/*.js')],
  });
  app.get('/api-docs.json', (_req, res) => res.json(spec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

  if (configure) configure(app);

  app.use(generalLimiter);
  app.use(modoMantenimiento);
  for (const [base, router] of routes) app.use(base, router);

  app.use((req, res) => sendError(res, `Ruta no encontrada: ${req.method} ${req.path}`, 404));
  app.use(errorHandler);

  return app;
}

/**
 * Arranca el servidor HTTP con apagado ordenado.
 * @param {import('express').Express | import('http').Server} appOrServer
 * @param {number} port
 * @param {string} name
 * @param {{ onStart?: () => void, onStop?: () => void }} [hooks]
 */
function startServer(appOrServer, port, name, { onStart, onStop } = {}) {
  const server = appOrServer instanceof http.Server ? appOrServer : http.createServer(appOrServer);

  server.listen(port, () => {
    logger.info(`${name} escuchando en puerto ${port}`);
    onStart?.();
  });

  const shutdown = (signal) => {
    logger.info(`${signal} recibido — cerrando ${name}`);
    onStop?.();
    server.close(async () => {
      await prisma.$disconnect().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
  return server;
}

module.exports = { createApp, startServer };
