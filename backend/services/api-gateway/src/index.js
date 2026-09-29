const { config, startServer } = require('@brickbybrick/shared');
const { crearGateway } = require('./app');

const { app, wsProxy } = crearGateway();
// En plataformas como Railway el puerto público llega en PORT
const puerto = Number(process.env.PORT) || config.PORT_GATEWAY;
const server = startServer(app, puerto, 'api-gateway');
server.on('upgrade', wsProxy.upgrade);

module.exports = server;
