const svc = require('../services/grupo.service');
const { sendSuccess } = require('@brickbybrick/shared');

const grupoController = {
  async list(req, res, next) {
    try { sendSuccess(res, await svc.findAll(req.query)); } catch (err) { next(err); }
  },
  async getOne(req, res, next) {
    try { sendSuccess(res, await svc.findById(req.params.id)); } catch (err) { next(err); }
  },
  async create(req, res, next) {
    try { sendSuccess(res, await svc.create(req.user.userId, req.validatedBody), 'Grupo creado', 201); } catch (err) { next(err); }
  },
  async unirse(req, res, next) {
    try { sendSuccess(res, await svc.unirse(req.params.id, req.user.userId), 'Te uniste al grupo', 201); } catch (err) { next(err); }
  },
  async salir(req, res, next) {
    try { await svc.salir(req.params.id, req.user.userId); sendSuccess(res, null, 'Saliste del grupo'); } catch (err) { next(err); }
  },
  async getMensajes(req, res, next) {
    try { sendSuccess(res, await svc.getMensajes(req.params.id, req.user.userId, req.query)); } catch (err) { next(err); }
  },
  async addMensaje(req, res, next) {
    try { sendSuccess(res, await svc.addMensaje(req.params.id, req.user.userId, req.validatedBody), 'Mensaje enviado', 201); } catch (err) { next(err); }
  },
};

module.exports = grupoController;
