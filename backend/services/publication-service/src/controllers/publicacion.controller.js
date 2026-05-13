const svc = require('../services/publicacion.service');
const { sendSuccess } = require('@brickbybrick/shared');

const pubController = {
  async list(req, res, next) {
    try { sendSuccess(res, await svc.findAll(req.query)); } catch (err) { next(err); }
  },
  async getOne(req, res, next) {
    try { sendSuccess(res, await svc.findById(req.params.id)); } catch (err) { next(err); }
  },
  async create(req, res, next) {
    try { sendSuccess(res, await svc.create(req.user.userId, req.validatedBody), 'Publicación creada', 201); } catch (err) { next(err); }
  },
  async update(req, res, next) {
    try { sendSuccess(res, await svc.update(req.params.id, req.user.userId, req.user.rol, req.validatedBody)); } catch (err) { next(err); }
  },
  async remove(req, res, next) {
    try { await svc.remove(req.params.id, req.user.userId, req.user.rol); sendSuccess(res, null, 'Publicación eliminada'); } catch (err) { next(err); }
  },
  async addComentario(req, res, next) {
    try { sendSuccess(res, await svc.addComentario(req.params.id, req.user.userId, req.validatedBody), 'Comentario agregado', 201); } catch (err) { next(err); }
  },
  async removeComentario(req, res, next) {
    try { await svc.removeComentario(req.params.id, req.user.userId, req.user.rol); sendSuccess(res, null, 'Comentario eliminado'); } catch (err) { next(err); }
  },
  async addLike(req, res, next) {
    try { sendSuccess(res, await svc.addLike(req.params.id, req.user.userId), 'Like registrado', 201); } catch (err) { next(err); }
  },
  async removeLike(req, res, next) {
    try { await svc.removeLike(req.params.id, req.user.userId); sendSuccess(res, null, 'Like eliminado'); } catch (err) { next(err); }
  },
  async createReporte(req, res, next) {
    try { sendSuccess(res, await svc.createReporte(req.user.userId, req.validatedBody), 'Reporte enviado', 201); } catch (err) { next(err); }
  },
};

module.exports = pubController;
