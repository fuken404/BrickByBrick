const { asyncHandler, sendSuccess, BadRequestError } = require('@brickbybrick/shared');
const svc = require('../services/grupo.service');

const MENSAJES_UNION = { activo: 'Te uniste al grupo', pendiente: 'Solicitud enviada a los administradores del grupo' };

module.exports = {
  listar: asyncHandler(async (req, res) => sendSuccess(res, await svc.listar(req.query, req.user))),
  obtener: asyncHandler(async (req, res) => sendSuccess(res, await svc.obtener(req.params.id, req.user))),
  crear: asyncHandler(async (req, res) => sendSuccess(res, await svc.crear(req.user, req.validatedBody), 'Grupo creado', 201)),
  actualizar: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.actualizar(req.params.id, req.user, req.validatedBody), 'Grupo actualizado')),
  imagen: asyncHandler(async (req, res) => {
    if (!req.file) throw new BadRequestError('Adjunta una imagen');
    sendSuccess(res, await svc.actualizarImagen(req.params.id, req.user, req.file), 'Imagen actualizada');
  }),
  eliminar: asyncHandler(async (req, res) => {
    await svc.eliminar(req.params.id, req.user);
    sendSuccess(res, null, 'Grupo eliminado');
  }),
  unirse: asyncHandler(async (req, res) => {
    const m = await svc.unirse(req.params.id, req.user);
    sendSuccess(res, m, MENSAJES_UNION[m.estado]);
  }),
  salir: asyncHandler(async (req, res) => {
    await svc.salir(req.params.id, req.user);
    sendSuccess(res, null, 'Saliste del grupo');
  }),
  miembros: asyncHandler(async (req, res) => sendSuccess(res, await svc.miembros(req.params.id, req.user, req.query))),
  gestionar: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.gestionarMiembro(req.params.id, req.params.usuarioId, req.user, req.validatedBody), 'Miembro actualizado')),
  invitar: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.invitar(req.params.id, req.user, req.validatedBody), 'Invitación enviada', 201)),
  mensajes: asyncHandler(async (req, res) => sendSuccess(res, await svc.mensajes(req.params.id, req.user, req.validatedQuery))),
  enviar: asyncHandler(async (req, res) =>
    sendSuccess(res, await svc.enviarMensaje(req.params.id, req.user, req.validatedBody), 'Mensaje enviado', 201)),
};
