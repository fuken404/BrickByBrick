const path = require('path');
const { createApp } = require('@brickbybrick/shared');

module.exports = createApp({
  name: 'material-service',
  title: 'Material Service',
  serviceDir: path.resolve(__dirname, '..'),
  routes: [
    ['/api/v1/materiales', require('./routes/material.routes')],
    ['/api/v1/solicitudes', require('./routes/solicitud.routes')],
    ['/api/v1/categorias', require('./routes/categoria.routes')],
    ['/api/v1/tributario', require('./routes/tributario.routes')],
  ],
});
