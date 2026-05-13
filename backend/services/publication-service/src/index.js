const app  = require('./app');
const { logger } = require('@brickbybrick/shared');
const PORT = process.env.PORT_PUBS || process.env.PORT || 3005;
const server = app.listen(PORT, () => logger.info(`publication-service en puerto ${PORT}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT',  () => server.close(() => process.exit(0)));
module.exports = server;
