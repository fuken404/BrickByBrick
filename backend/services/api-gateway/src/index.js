const { config, startServer } = require('@brickbybrick/shared');
const { crearGateway } = require('./app');

const { app, wsProxy } = crearGateway();
const server = startServer(app, config.PORT_GATEWAY, 'api-gateway');
server.on('upgrade', wsProxy.upgrade);

module.exports = server;
