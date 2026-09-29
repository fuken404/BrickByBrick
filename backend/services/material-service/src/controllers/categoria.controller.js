const { asyncHandler, sendSuccess, BadRequestError } = require('@brickbybrick/shared');
const svc = require('../services/categoria.service');

const idNumerico = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Identificador inválido');
  return id;
};

module.exports = {
  listar: asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=300');
    sendSuccess(res, await svc.listar());
  }),
  crear: asyncHandler(async (req, res) => sendSuccess(res, await svc.crear(req.user.userId, req.validatedBody), 'Categoría creada', 201)),
  actualizar: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.actualizar(req.user.userId, idNumerico(req), req.validatedBody), 'Categoría actualizada')),
  eliminar: asyncHandler(async (req, res) => {
    await svc.eliminar(req.user.userId, idNumerico(req));
    sendSuccess(res, null, 'Categoría eliminada');
  }),
};
