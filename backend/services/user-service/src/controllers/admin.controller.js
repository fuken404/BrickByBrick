const { asyncHandler, sendSuccess } = require('@brickbybrick/shared');
const svc = require('../services/admin.service');

module.exports = {
  dashboard: asyncHandler(async (_req, res) => sendSuccess(res, await svc.dashboard())),
  metricas: asyncHandler(async (req, res) => sendSuccess(res, await svc.metricas(req.query))),
  usuarios: asyncHandler(async (req, res) => sendSuccess(res, await svc.listarUsuarios(req.validatedQuery))),
  estadoUsuario: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.cambiarEstadoUsuario(req.user.userId, req.params.id, req.validatedBody), 'Estado de la cuenta actualizado')),
  verificacion: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.verificarConstructora(req.user.userId, req.params.id, req.validatedBody),
      req.validatedBody.aprobar ? 'Constructora verificada' : 'Verificación rechazada')),
  documento: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.revisarDocumento(req.user.userId, req.params.id, req.validatedBody), 'Documento revisado')),
  configuracion: asyncHandler(async (_req, res) => sendSuccess(res, await svc.obtenerConfiguracion())),
  guardarConfiguracion: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.guardarConfiguracion(req.user.userId, req.validatedBody), 'Configuración guardada')),
  auditoria: asyncHandler(async (req, res) => sendSuccess(res, await svc.auditoria(req.query))),
  exportar: asyncHandler(async (req, res) => {
    const csv = await svc.exportar(req.params.tipo);
    const fecha = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="brickbybrick-${req.params.tipo}-${fecha}.csv"`);
    res.send(csv);
  }),
};
