const logger = require('../utils/logger');

/**
 * Manejador de errores global de Express (4 parámetros).
 * Debe registrarse ÚLTIMO en la cadena de middleware.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Errores de negocio lanzados con { status, message }
  if (err.status && err.message) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  // Errores de Prisma
  if (err.code) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'campo';
      return res.status(409).json({
        success: false,
        message: `Ya existe un registro con ese ${field}`,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
    }
  }

  // Errores de Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'El archivo supera el tamaño máximo permitido (5 MB)',
    });
  }

  // Error genérico (no exponer detalles en producción)
  logger.error(err);
  const message =
    process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message;

  return res.status(500).json({ success: false, message });
}

module.exports = errorHandler;
