const { verifyAccessToken } = require('../utils/jwt.utils');
const { sendError } = require('../utils/response.utils');

/**
 * Middleware que verifica el JWT de acceso y adjunta req.user.
 * req.user = { userId, email, rol }
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Token de acceso requerido', 401);
  }

  const token = authHeader.slice(7);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token expirado', 401);
    }
    return sendError(res, 'Token inválido', 401);
  }
}

module.exports = authMiddleware;
