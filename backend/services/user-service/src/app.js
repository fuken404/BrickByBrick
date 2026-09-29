const path = require('path');
const { createApp } = require('@brickbybrick/shared');

module.exports = createApp({
  name: 'user-service',
  title: 'User Service',
  serviceDir: path.resolve(__dirname, '..'),
  routes: [
    ['/api/v1/me', require('./routes/me.routes')],
    ['/api/v1/beneficiarios', require('./routes/beneficiario.routes')],
    ['/api/v1/constructoras', require('./routes/constructora.routes')],
    ['/api/v1/admin', require('./routes/admin.routes')],
    ['/api/v1', require('./routes/public.routes')],
  ],
});
