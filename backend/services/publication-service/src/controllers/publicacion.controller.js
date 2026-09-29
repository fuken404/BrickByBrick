const { asyncHandler, sendSuccess } = require('@brickbybrick/shared');
const pubs = require('../services/publicacion.service');
const comentarios = require('../services/comentario.service');

module.exports = {
  listar: asyncHandler(async (req, res) => sendSuccess(res, await pubs.listar(req.validatedQuery, req.user))),
  obtener: asyncHandler(async (req, res) => sendSuccess(res, await pubs.obtener(req.params.id, req.user))),
  crear: asyncHandler(async (req, res) =>
    sendSuccess(res, await pubs.crear(req.user.userId, req.validatedBody, req.files), 'Publicación creada', 201)),
  actualizar: asyncHandler(async (req, res) =>
    sendSuccess(res, await pubs.actualizar(req.params.id, req.user, req.validatedBody), 'Publicación actualizada')),
  eliminar: asyncHandler(async (req, res) => {
    await pubs.eliminar(req.params.id, req.user);
    sendSuccess(res, null, 'Publicación eliminada');
  }),
  moderar: asyncHandler(async (req, res) =>
    sendSuccess(res, await pubs.moderar(req.params.id, req.user.userId, req.validatedBody), 'Moderación aplicada')),
  like: asyncHandler(async (req, res) => sendSuccess(res, await pubs.like(req.params.id, req.user.userId))),
  unlike: asyncHandler(async (req, res) => sendSuccess(res, await pubs.unlike(req.params.id, req.user.userId))),
  repost: asyncHandler(async (req, res) =>
    sendSuccess(res, await pubs.repostear(req.params.id, req.user.userId, req.validatedBody), 'Publicación compartida', 201)),
  quitarRepost: asyncHandler(async (req, res) => {
    await pubs.quitarRepost(req.params.id, req.user.userId);
    sendSuccess(res, null, 'Dejaste de compartir la publicación');
  }),
  comentarios: asyncHandler(async (req, res) => sendSuccess(res, await comentarios.listar(req.params.id, req.query, req.user))),
  comentar: asyncHandler(async (req, res) =>
    sendSuccess(res, await comentarios.crear(req.params.id, req.user.userId, req.validatedBody), 'Comentario publicado', 201)),
};
