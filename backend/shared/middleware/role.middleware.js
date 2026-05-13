const { sendError } = require('../utils/response.utils');

/**
 * Factory que devuelve un middleware que verifica que req.user.rol
 * esté en el array de roles permitidos.
 *
 * Debe usarse DESPUÉS de authMiddleware.
 *
 * @param {...string} roles - Roles permitidos ('ADMINISTRADOR', 'CONSTRUCTORA', 'BENEFICIARIO')
 * @returns {import('express').RequestHandler}
 */
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'No autenticado', 401);
    }
    if (!roles.includes(req.user.rol)) {
      return sendError(res, 'Acceso denegado: permisos insuficientes', 403);
    }
    next();
  };
}

module.exports = requireRoles;
