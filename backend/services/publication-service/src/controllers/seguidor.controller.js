const { asyncHandler, sendSuccess } = require('@brickbybrick/shared');
const svc = require('../services/seguidor.service');

module.exports = {
  seguir: asyncHandler(async (req, res) => sendSuccess(res, await svc.seguir(req.user.userId, req.params.usuarioId), 'Ahora sigues a este usuario')),
  dejar: asyncHandler(async (req, res) => sendSuccess(res, await svc.dejarDeSeguir(req.user.userId, req.params.usuarioId), 'Dejaste de seguir')),
  seguidores: asyncHandler(async (req, res) => sendSuccess(res, await svc.seguidores(req.params.usuarioId, req.query, req.user?.userId))),
  siguiendo: asyncHandler(async (req, res) => sendSuccess(res, await svc.siguiendo(req.params.usuarioId, req.query, req.user?.userId))),
};
