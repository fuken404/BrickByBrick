const { asyncHandler, sendSuccess, BadRequestError } = require('@brickbybrick/shared');
const meService = require('../services/me.service');

module.exports = {
  obtener: asyncHandler(async (req, res) => sendSuccess(res, await meService.obtener(req.user.userId))),

  actualizar: asyncHandler(async (req, res) =>
    sendSuccess(res, await meService.actualizar(req.user.userId, req.validatedBody), 'Datos actualizados')),

  avatar: asyncHandler(async (req, res) => {
    if (!req.file) throw new BadRequestError('Adjunta una imagen');
    sendSuccess(res, await meService.actualizarAvatar(req.user.userId, req.file), 'Foto de perfil actualizada');
  }),

  eliminar: asyncHandler(async (req, res) => {
    await meService.eliminarCuenta(req.user.userId, req.validatedBody);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    sendSuccess(res, null, 'Tu cuenta y tus datos personales fueron eliminados');
  }),
};
