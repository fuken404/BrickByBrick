const http   = require('http');
const app    = require('./app');
const { initSocket } = require('./socket/socket.handler');
const { logger }     = require('@brickbybrick/shared');

const PORT   = process.env.PORT_NOTIF || process.env.PORT || 3006;
const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  logger.info(`notification-service en puerto ${PORT} (HTTP + WebSocket)`);
});

const shutdown = () => { server.close(() => process.exit(0)); };
process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);
module.exports = server;
