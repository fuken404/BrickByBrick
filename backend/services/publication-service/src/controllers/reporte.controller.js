const { asyncHandler, sendSuccess } = require('@brickbybrick/shared');
const svc = require('../services/reporte.service');

module.exports = {
  crear: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.crear(req.user.userId, req.validatedBody), 'Gracias. Revisaremos tu reporte.', 201)),
  listar: asyncHandler(async (req, res) => sendSuccess(res, await svc.listar(req.query))),
  resolver: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.resolver(req.params.id, req.user.userId, req.validatedBody), 'Reporte resuelto')),
};
