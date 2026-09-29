const { asyncHandler, sendSuccess } = require('@brickbybrick/shared');
const svc = require('../services/conversacion.service');

module.exports = {
  listar: asyncHandler(async (req, res) => sendSuccess(res, await svc.listar(req.user.userId))),
  noLeidos: asyncHandler(async (req, res) => sendSuccess(res, await svc.noLeidos(req.user.userId))),
  abrir: asyncHandler(async (req, res) => sendSuccess(res, await svc.abrir(req.user.userId, req.validatedBody))),
  obtener: asyncHandler(async (req, res) => sendSuccess(res, await svc.obtener(req.params.id, req.user.userId))),
  mensajes: asyncHandler(async (req, res) => sendSuccess(res, await svc.mensajes(req.params.id, req.user.userId, req.validatedQuery))),
  enviar: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.enviar(req.params.id, req.user.userId, req.validatedBody), 'Mensaje enviado', 201)),
  leer: asyncHandler(async (req, res) => sendSuccess(res, await svc.marcarLeida(req.params.id, req.user.userId))),
};
