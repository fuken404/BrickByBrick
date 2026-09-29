const { config, startServer } = require('@brickbybrick/shared');
const app = require('./app');
const jobs = require('./jobs/material.jobs');

module.exports = startServer(app, config.PORT_MATERIALS, 'material-service', {
  onStart: jobs.start,
  onStop: jobs.stop,
});
