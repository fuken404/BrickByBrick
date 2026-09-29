const { config, startServer } = require('@brickbybrick/shared');
const app = require('./app');
const jobs = require('./jobs/evento.jobs');

module.exports = startServer(app, config.PORT_EVENTS, 'event-service', { onStart: jobs.start, onStop: jobs.stop });
