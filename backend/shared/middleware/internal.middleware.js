const crypto = require('crypto');
const { sendError } = require('../utils/response.utils');

/** Protege rutas /internal/* con la clave compartida entre servicios. */
function requireInternalKey(req, res, next) {
  const expected = process.env.INTERNAL_API_KEY || '';
  const received = String(req.headers['x-internal-key'] || '');
  const ok = expected.length > 0
    && received.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  if (!ok) return sendError(res, 'No autorizado', 401);
  return next();
}

module.exports = requireInternalKey;
