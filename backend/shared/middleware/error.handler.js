const logger = require('../utils/logger');
const { AppError } = require('../errors/app-error');

/**
 * Manejador de errores global de Express (4 parámetros).
 * Debe registrarse ÚLTIMO en la cadena de middleware.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { success: false, message: err.message };
    if (err.errors) body.errors = err.errors;
    return res.status(err.status).json(body);
  }

  // Errores de Prisma
  if (typeof err.code === 'string' && err.code.startsWith('P')) {
    switch (err.code) {
      case 'P2002': {
        const field = err.meta?.target?.[0] || 'campo';
        return res.status(409).json({ success: false, message: `Ya existe un registro con ese ${field}` });
      }
      case 'P2003':
        return res.status(409).json({ success: false, message: 'El registro está relacionado con otros datos y no se puede modificar' });
      case 'P2023':
        return res.status(400).json({ success: false, message: 'Identificador con formato inválido' });
      case 'P2025':
        return res.status(404).json({ success: false, message: 'Registro no encontrado' });
      default:
        break;
    }
  }

  // Errores de Multer
  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? `El archivo supera el tamaño máximo permitido (${process.env.MAX_UPLOAD_MB || 10} MB)`
      : err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'Se enviaron más archivos de los permitidos'
        : 'Error al procesar el archivo';
    return res.status(400).json({ success: false, message });
  }

  // JSON mal formado
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'El cuerpo de la petición no es un JSON válido' });
  }

  logger.error(err);
  const message = process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message;
  return res.status(500).json({ success: false, message });
}

module.exports = errorHandler;
