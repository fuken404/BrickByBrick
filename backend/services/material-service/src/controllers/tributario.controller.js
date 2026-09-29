const { asyncHandler, sendSuccess } = require('@brickbybrick/shared');
const svc = require('../services/tributario.service');

const enviarPdf = (res, { nombre, buffer }) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
  res.send(buffer);
};

module.exports = {
  resumen: asyncHandler(async (req, res) => sendSuccess(res, await svc.resumen(req.user, req.validatedQuery))),
  constancias: asyncHandler(async (req, res) => sendSuccess(res, await svc.constancias(req.user, req.validatedQuery))),
  constanciaPdf: asyncHandler(async (req, res) => enviarPdf(res, await svc.constanciaPdf(req.user, req.params.solicitudId))),
  certificadoPdf: asyncHandler(async (req, res) =>
    enviarPdf(res, await svc.certificadoAnualPdf(req.user, { anio: Number(req.params.anio), constructoraId: req.query.constructoraId }))),
};
