const { asyncHandler, sendSuccess, BadRequestError } = require('@brickbybrick/shared');
const svc = require('../services/evento.service');

const MENSAJES = {
  publicado: 'Evento publicado', en_curso: 'Evento en curso', finalizado: 'Evento finalizado', cancelado: 'Evento cancelado',
};

module.exports = {
  listar: asyncHandler(async (req, res) => sendSuccess(res, await svc.listarPublico(req.validatedQuery, req.user))),
  listarMios: asyncHandler(async (req, res) => sendSuccess(res, await svc.listarMios(req.user.userId, req.validatedQuery))),
  listarAdmin: asyncHandler(async (req, res) => sendSuccess(res, await svc.listarAdmin(req.validatedQuery))),
  misInscripciones: asyncHandler(async (req, res) => sendSuccess(res, await svc.misInscripciones(req.user.userId, req.validatedQuery))),
  obtener: asyncHandler(async (req, res) => sendSuccess(res, await svc.obtener(req.params.id, req.user))),
  crear: asyncHandler(async (req, res) => {
    const e = await svc.crear(req.user.userId, req.validatedBody);
    sendSuccess(res, e, e.estado === 'publicado' ? 'Evento publicado' : 'Borrador guardado', 201);
  }),
  actualizar: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.actualizar(req.params.id, req.user, req.validatedBody), 'Evento actualizado')),
  cambiarEstado: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.cambiarEstado(req.params.id, req.user, req.validatedBody), MENSAJES[req.validatedBody.estado])),
  eliminar: asyncHandler(async (req, res) => {
    await svc.eliminar(req.params.id, req.user);
    sendSuccess(res, null, 'Borrador eliminado');
  }),
  imagen: asyncHandler(async (req, res) => {
    if (!req.file) throw new BadRequestError('Adjunta una imagen');
    sendSuccess(res, await svc.actualizarImagen(req.params.id, req.user, req.file), 'Imagen actualizada');
  }),
  inscribirse: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.inscribirse(req.params.id, req.user.userId), '¡Inscripción confirmada!', 201)),
  cancelarInscripcion: asyncHandler(async (req, res) => {
    await svc.cancelarInscripcion(req.params.id, req.user.userId);
    sendSuccess(res, null, 'Inscripción cancelada');
  }),
  inscritos: asyncHandler(async (req, res) => sendSuccess(res, await svc.inscritos(req.params.id, req.user, req.query.estado))),
  asistencia: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.marcarAsistencia(req.params.id, req.user, req.validatedBody.inscripciones), 'Asistencia registrada')),
  exportar: asyncHandler(async (req, res) => {
    const { nombre, csv } = await svc.exportarInscritos(req.params.id, req.user);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.send(csv);
  }),
};
