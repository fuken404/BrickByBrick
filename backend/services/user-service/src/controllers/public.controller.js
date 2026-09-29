const { asyncHandler, sendSuccess } = require('@brickbybrick/shared');
const catalogoRepository = require('../repositories/catalogo.repository');
const adminService = require('../services/admin.service');
const perfilService = require('../services/perfil.service');

module.exports = {
  localidades: asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=3600');
    sendSuccess(res, await catalogoRepository.localidades());
  }),
  estadisticas: asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=300');
    sendSuccess(res, await adminService.estadisticasPublicas());
  }),
  perfil: asyncHandler(async (req, res) => sendSuccess(res, await perfilService.obtener(req.params.usuarioId, req.user))),
};
