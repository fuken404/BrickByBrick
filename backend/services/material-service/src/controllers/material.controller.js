const { asyncHandler, sendSuccess, BadRequestError } = require('@brickbybrick/shared');
const svc = require('../services/material.service');

module.exports = {
  listar: asyncHandler(async (req, res) => sendSuccess(res, await svc.listarPublico(req.validatedQuery))),
  listarMios: asyncHandler(async (req, res) => sendSuccess(res, await svc.listarMios(req.user.userId, req.validatedQuery))),
  listarAdmin: asyncHandler(async (req, res) => sendSuccess(res, await svc.listarAdmin(req.validatedQuery))),
  obtener: asyncHandler(async (req, res) => sendSuccess(res, await svc.obtener(req.params.id, req.user))),
  crear: asyncHandler(async (req, res) => {
    const m = await svc.crear(req.user.userId, req.validatedBody);
    sendSuccess(res, m, m.estadoPublicacion === 'activo' ? 'Material publicado' : 'Borrador guardado', 201);
  }),
  actualizar: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.actualizar(req.params.id, req.user, req.validatedBody), 'Material actualizado')),
  cambiarEstado: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.cambiarEstado(req.params.id, req.user, req.validatedBody.estado), 'Estado actualizado')),
  eliminar: asyncHandler(async (req, res) => {
    await svc.eliminar(req.params.id, req.user);
    sendSuccess(res, null, 'Material eliminado');
  }),
  agregarFotos: asyncHandler(async (req, res) => {
    if (!req.files?.length) throw new BadRequestError('Adjunta al menos una foto');
    sendSuccess(res, await svc.agregarFotos(req.params.id, req.user, req.files), 'Fotos agregadas', 201);
  }),
  eliminarFoto: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.eliminarFoto(req.params.id, req.params.fotoId, req.user), 'Foto eliminada')),
};
