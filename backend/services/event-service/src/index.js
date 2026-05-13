const app  = require('./app');
const { logger } = require('@brickbybrick/shared');
const PORT = process.env.PORT_EVENTS || process.env.PORT || 3004;
const server = app.listen(PORT, () => logger.info(`event-service en puerto ${PORT}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT',  () => server.close(() => process.exit(0)));
module.exports = server;
