const app = require('./app');
const { logger } = require('@brickbybrick/shared');

const PORT = process.env.PORT_AUTH || process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  logger.info(`auth-service corriendo en puerto ${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} recibido — cerrando auth-service`);
  server.close(() => {
    logger.info('auth-service detenido');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

module.exports = server;
