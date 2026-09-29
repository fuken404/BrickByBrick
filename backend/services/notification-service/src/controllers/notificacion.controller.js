const { asyncHandler, sendSuccess } = require('@brickbybrick/shared');
const svc = require('../services/notificacion.service');

module.exports = {
  listar: asyncHandler(async (req, res) => sendSuccess(res, await svc.listar(req.user.userId, req.query))),
  noLeidas: asyncHandler(async (req, res) => sendSuccess(res, await svc.noLeidas(req.user.userId))),
  leer: asyncHandler(async (req, res) => sendSuccess(res, await svc.marcarLeida(req.params.id, req.user.userId))),
  leerTodas: asyncHandler(async (req, res) => sendSuccess(res, await svc.marcarTodas(req.user.userId), 'Todas marcadas como leídas')),
  eliminar: asyncHandler(async (req, res) => {
    await svc.eliminar(req.params.id, req.user.userId);
    sendSuccess(res, null, 'Notificación eliminada');
  }),
  eliminarLeidas: asyncHandler(async (req, res) => sendSuccess(res, await svc.eliminarLeidas(req.user.userId), 'Notificaciones leídas eliminadas')),
};
