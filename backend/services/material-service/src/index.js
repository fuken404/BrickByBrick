const app  = require('./app');
const cron = require('./jobs/material.jobs');
const { logger } = require('@brickbybrick/shared');

const PORT   = process.env.PORT_MATERIALS || process.env.PORT || 3003;
const server = app.listen(PORT, () => {
  logger.info(`material-service en puerto ${PORT}`);
  cron.start();
});

const shutdown = () => { cron.stop(); server.close(() => process.exit(0)); };
process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);
module.exports = server;
