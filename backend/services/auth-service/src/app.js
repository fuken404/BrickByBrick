const { createApp } = require('@brickbybrick/shared');
const authRoutes = require('./routes/auth.routes');

module.exports = createApp({
  name: 'auth-service',
  title: 'Auth Service',
  serviceDir: require('path').resolve(__dirname, '..'),
  routes: [['/api/v1/auth', authRoutes]],
});
