const path = require('path');
const { createApp } = require('@brickbybrick/shared');

module.exports = createApp({
  name: 'notification-service',
  title: 'Notification Service',
  serviceDir: path.resolve(__dirname, '..'),
  routes: [
    ['/api/v1/notificaciones', require('./routes/notificacion.routes')],
    ['/internal', require('./routes/internal.routes')],
  ],
});
