const http = require('http');
const { config, startServer } = require('@brickbybrick/shared');
const app = require('./app');
const { initSocket } = require('./socket/socket.handler');

const server = http.createServer(app);
initSocket(server);

module.exports = startServer(server, config.PORT_NOTIF, 'notification-service (HTTP + WebSocket)');
