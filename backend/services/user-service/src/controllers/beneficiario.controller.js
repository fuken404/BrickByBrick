const svc = require('../services/beneficiario.service');
const { sendSuccess } = require('@brickbybrick/shared');

const beneficiarioController = {
  async list(req, res, next) {
    try {
      const result = await svc.findAll(req.query);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async getOne(req, res, next) {
    try {
      const data = await svc.findById(req.params.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await svc.update(req.params.id, req.user.userId, req.user.rol, req.validatedBody);
      sendSuccess(res, data, 'Perfil actualizado');
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await svc.remove(req.params.id);
      sendSuccess(res, null, 'Beneficiario eliminado');
    } catch (err) { next(err); }
  },

  async toggleAlimentador(req, res, next) {
    try {
      const data = await svc.toggleAlimentadorWeb(req.params.id);
      sendSuccess(res, data, 'Rol de alimentador web actualizado');
    } catch (err) { next(err); }
  },
};

module.exports = beneficiarioController;
