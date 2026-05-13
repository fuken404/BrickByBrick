/**
 * Rutas internas — solo para comunicación entre microservicios.
 * Protegidas por x-internal-key header.
 */
const router     = require('express').Router();
const { emitToUser } = require('../socket/socket.handler');
const { sendSuccess, sendError } = require('@brickbybrick/shared');

// Middleware de autenticación interna
function internalAuth(req, res, next) {
  const key = req.headers['x-internal-key'];
  if (!process.env.INTERNAL_API_KEY || key !== process.env.INTERNAL_API_KEY) {
    return sendError(res, 'No autorizado', 401);
  }
  next();
}

/**
 * POST /internal/emit
 * Body: { usuarioId: string, notification: object }
 * Emite la notificación por WebSocket al usuario destino.
 */
router.post('/emit', internalAuth, (req, res) => {
  const { usuarioId, notification } = req.body;
  if (!usuarioId || !notification) {
    return sendError(res, 'usuarioId y notification son requeridos', 400);
  }
  emitToUser(usuarioId, notification);
  sendSuccess(res, null, 'Emitido');
});

module.exports = router;
