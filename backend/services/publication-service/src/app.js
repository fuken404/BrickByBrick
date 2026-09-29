const path = require('path');
const { createApp } = require('@brickbybrick/shared');

module.exports = createApp({
  name: 'publication-service',
  title: 'Publication Service (comunidad)',
  serviceDir: path.resolve(__dirname, '..'),
  routes: [
    ['/api/v1/publicaciones', require('./routes/publicacion.routes')],
    ['/api/v1/comentarios', require('./routes/comentario.routes')],
    ['/api/v1/reportes', require('./routes/reporte.routes')],
    ['/api/v1/seguidores', require('./routes/seguidor.routes')],
    ['/api/v1/grupos', require('./routes/grupo.routes')],
    ['/api/v1/conversaciones', require('./routes/conversacion.routes')],
  ],
});
