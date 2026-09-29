const { verifyAccessToken } = require('../utils/jwt.utils');
const { sendError } = require('../utils/response.utils');
const { obtenerParametro } = require('../utils/config-sistema');
const logger = require('../utils/logger');

const ESCRITURA = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
/** Sesión, notificaciones y tráfico interno siguen funcionando en mantenimiento. */
const EXENTAS = ['/api/v1/auth', '/api/v1/notificaciones', '/internal'];

/**
 * Con `modoMantenimiento` activo, rechaza las escrituras de usuarios que no
 * sean administradores (503). Las lecturas no se ven afectadas.
 */
async function modoMantenimiento(req, res, next) {
  if (!ESCRITURA.has(req.method) || EXENTAS.some((p) => req.originalUrl.startsWith(p))) return next();

  let activo = false;
  try {
    activo = Boolean(await obtenerParametro('modoMantenimiento'));
  } catch (err) {
    logger.warn(`No se pudo leer modoMantenimiento: ${err.message}`);
  }
  if (!activo) return next();

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      if (verifyAccessToken(header.slice(7)).rol === 'ADMINISTRADOR') return next();
    } catch {
      // Token inválido: se trata como usuario sin privilegios
    }
  }
  return sendError(res, 'La plataforma está en mantenimiento. Por ahora solo puedes consultar información; intenta más tarde.', 503);
}

module.exports = modoMantenimiento;
