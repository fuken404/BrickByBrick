const { asyncHandler, sendSuccess } = require('@brickbybrick/shared');
const svc = require('../services/beneficiario.service');

module.exports = {
  listar: asyncHandler(async (req, res) => sendSuccess(res, await svc.listar(req.query))),
  obtener: asyncHandler(async (req, res) => sendSuccess(res, await svc.obtener(req.params.id, req.user))),
  actualizar: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.actualizar(req.params.id, req.user, req.validatedBody), 'Perfil actualizado')),
  portafolio: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.actualizarPortafolio(req.params.id, req.user, req.validatedBody), 'Portafolio actualizado')),
  toggleAlimentador: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.toggleAlimentador(req.params.id, req.user), 'Distintivo de Alimentador Web actualizado')),
};
