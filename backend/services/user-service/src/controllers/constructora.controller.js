const svc = require('../services/constructora.service');
const { sendSuccess } = require('@brickbybrick/shared');

const constructoraController = {
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

  async verificar(req, res, next) {
    try {
      const data = await svc.verificar(req.params.id);
      sendSuccess(res, data, 'Constructora verificada correctamente');
    } catch (err) { next(err); }
  },

  async subirDocumento(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'Archivo requerido' });
      const tipo = req.body.tipo;
      const data = await svc.subirDocumento(req.params.id, req.user.userId, req.user.rol, req.file, tipo);
      sendSuccess(res, data, 'Documento subido correctamente', 201);
    } catch (err) { next(err); }
  },

  async actualizarLogo(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'Archivo requerido' });
      const data = await svc.actualizarLogo(req.params.id, req.user.userId, req.user.rol, req.file);
      sendSuccess(res, data, 'Logo actualizado');
    } catch (err) { next(err); }
  },
};

module.exports = constructoraController;
