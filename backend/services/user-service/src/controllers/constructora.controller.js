const { asyncHandler, sendSuccess, BadRequestError } = require('@brickbybrick/shared');
const svc = require('../services/constructora.service');

module.exports = {
  listar: asyncHandler(async (req, res) => sendSuccess(res, await svc.listar(req.query, req.user))),
  obtener: asyncHandler(async (req, res) => sendSuccess(res, await svc.obtener(req.params.id, req.user))),
  actualizar: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.actualizar(req.params.id, req.user, req.validatedBody), 'Perfil de empresa actualizado')),
  subirDocumento: asyncHandler(async (req, res) => {
    if (!req.file) throw new BadRequestError('Adjunta el documento');
    sendSuccess(res, await svc.subirDocumento(req.params.id, req.user, req.file, req.validatedBody), 'Documento enviado para revisión', 201);
  }),
  logo: asyncHandler(async (req, res) => {
    if (!req.file) throw new BadRequestError('Adjunta una imagen');
    sendSuccess(res, await svc.actualizarLogo(req.params.id, req.user, req.file), 'Logo actualizado');
  }),
};
