const { asyncHandler, sendSuccess } = require('@brickbybrick/shared');
const svc = require('../services/comentario.service');

module.exports = {
  editar: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.editar(req.params.id, req.user.userId, req.validatedBody), 'Comentario editado')),
  eliminar: asyncHandler(async (req, res) => {
    await svc.eliminar(req.params.id, req.user);
    sendSuccess(res, null, 'Comentario eliminado');
  }),
  like: asyncHandler(async (req, res) => sendSuccess(res, await svc.like(req.params.id, req.user.userId))),
  unlike: asyncHandler(async (req, res) => sendSuccess(res, await svc.unlike(req.params.id, req.user.userId))),
};
