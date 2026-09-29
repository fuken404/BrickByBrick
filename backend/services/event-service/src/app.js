const path = require('path');
const { createApp } = require('@brickbybrick/shared');

module.exports = createApp({
  name: 'event-service',
  title: 'Event Service',
  serviceDir: path.resolve(__dirname, '..'),
  routes: [['/api/v1/eventos', require('./routes/evento.routes')]],
});
