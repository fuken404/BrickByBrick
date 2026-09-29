const { asyncHandler, sendSuccess } = require('@brickbybrick/shared');
const svc = require('../services/solicitud.service');

const MENSAJES = {
  aprobada: 'Solicitud aprobada', rechazada: 'Solicitud rechazada',
  entregada: 'Entrega registrada. Se generó la constancia de donación.', cancelada: 'Solicitud cancelada',
};

module.exports = {
  listarAdmin: asyncHandler(async (req, res) => sendSuccess(res, await svc.listarAdmin(req.validatedQuery))),
  listarRecibidas: asyncHandler(async (req, res) => sendSuccess(res, await svc.listarRecibidas(req.user.userId, req.validatedQuery))),
  listarMias: asyncHandler(async (req, res) => sendSuccess(res, await svc.listarMias(req.user.userId, req.validatedQuery))),
  listarPorMaterial: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.listarPorMaterial(req.params.id, req.user, req.validatedQuery))),
  obtener: asyncHandler(async (req, res) => sendSuccess(res, await svc.obtener(req.params.id, req.user))),
  crear: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.crear(req.params.id, req.user.userId, req.validatedBody), 'Solicitud enviada', 201)),
  cambiarEstado: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.cambiarEstado(req.params.id, req.user, req.validatedBody), MENSAJES[req.validatedBody.estado])),
  cancelar: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.cancelarPropia(req.params.id, req.user.userId, req.validatedBody), 'Solicitud cancelada')),
  confirmarRecepcion: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.confirmarRecepcion(req.params.id, req.user.userId, req.validatedBody), '¡Gracias por confirmar la recepción!')),
  calificar: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.calificar(req.params.id, req.user.userId, req.validatedBody), 'Calificación registrada')),
};
