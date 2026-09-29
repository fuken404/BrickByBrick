const { config, startServer } = require('@brickbybrick/shared');
const app = require('./app');

module.exports = startServer(app, config.PORT_PUBS, 'publication-service');
