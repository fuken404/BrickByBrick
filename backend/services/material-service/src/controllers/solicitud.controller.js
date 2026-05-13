const svc = require('../services/solicitud.service');
const { sendSuccess } = require('@brickbybrick/shared');

const solicitudController = {
  async listAll(req, res, next) {
    try {
      const data = await svc.findAll(req.query);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async listByConstructora(req, res, next) {
    try {
      const data = await svc.findByConstructora(req.user.userId, req.query);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async listByBeneficiario(req, res, next) {
    try {
      const data = await svc.findByBeneficiario(req.user.userId, req.query);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async listByMaterial(req, res, next) {
    try {
      const data = await svc.findByMaterial(req.params.id, req.user.userId, req.user.rol);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = await svc.create(req.params.id, req.user.userId, req.validatedBody);
      sendSuccess(res, data, 'Solicitud enviada', 201);
    } catch (err) { next(err); }
  },

  async cambiarEstado(req, res, next) {
    try {
      const data = await svc.cambiarEstado(req.params.id, req.user.userId, req.user.rol, req.validatedBody);
      sendSuccess(res, data, 'Estado de solicitud actualizado');
    } catch (err) { next(err); }
  },

  async calificar(req, res, next) {
    try {
      const data = await svc.calificar(req.params.id, req.user.userId, req.validatedBody);
      sendSuccess(res, data, 'Calificación registrada');
    } catch (err) { next(err); }
  },
};

module.exports = solicitudController;
