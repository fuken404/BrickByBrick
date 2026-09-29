const { verifyAccessToken } = require('../utils/jwt.utils');
const { sendError } = require('../utils/response.utils');

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Verifica el JWT de acceso y adjunta req.user = { userId, email, rol }.
 */
function authMiddleware(req, res, next) {
  const token = extractToken(req);
  if (!token) return sendError(res, 'Token de acceso requerido', 401);

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return sendError(res, 'Token expirado', 401);
    return sendError(res, 'Token inválido', 401);
  }
}

/**
 * Igual que authMiddleware pero no exige token: si viene y es válido
 * adjunta req.user; si no, continúa como visitante anónimo.
 */
function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try { req.user = verifyAccessToken(token); } catch { req.user = undefined; }
  }
  next();
}

authMiddleware.optionalAuth = optionalAuth;
module.exports = authMiddleware;
