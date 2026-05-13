const app    = require('./app');
const { logger } = require('@brickbybrick/shared');
const PORT   = process.env.PORT_USERS || process.env.PORT || 3002;
const server = app.listen(PORT, () => logger.info(`user-service en puerto ${PORT}`));
const shutdown = (s) => { server.close(() => process.exit(0)); };
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
module.exports = server;
