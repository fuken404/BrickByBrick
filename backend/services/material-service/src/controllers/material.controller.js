const svc = require('../services/material.service');
const { sendSuccess } = require('@brickbybrick/shared');

const materialController = {
  async listMios(req, res, next) {
    try {
      const { prisma } = require('@brickbybrick/shared');
      const constructora = await prisma.constructora.findUnique({ where: { usuarioId: req.user.userId } });
      if (!constructora) return res.status(403).json({ success: false, message: 'No tienes una empresa registrada' });
      const result = await svc.findByConstructora(constructora.id, req.query);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

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

  async create(req, res, next) {
    try {
      // Obtener constructora del usuario autenticado
      const { prisma } = require('@brickbybrick/shared');
      const constructora = await prisma.constructora.findUnique({
        where: { usuarioId: req.user.userId },
      });
      if (!constructora) return res.status(403).json({ success: false, message: 'No tienes una empresa registrada' });
      const data = await svc.create(constructora.id, req.validatedBody);
      sendSuccess(res, data, 'Material creado', 201);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const data = await svc.update(req.params.id, req.user.userId, req.user.rol, req.validatedBody);
      sendSuccess(res, data, 'Material actualizado');
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await svc.remove(req.params.id, req.user.userId, req.user.rol);
      sendSuccess(res, null, 'Material eliminado');
    } catch (err) { next(err); }
  },

  async cambiarEstado(req, res, next) {
    try {
      const data = await svc.cambiarEstado(req.params.id, req.user.userId, req.user.rol, req.validatedBody.estado);
      sendSuccess(res, data, 'Estado actualizado');
    } catch (err) { next(err); }
  },

  async agregarFotos(req, res, next) {
    try {
      if (!req.files?.length) return res.status(400).json({ success: false, message: 'Se requiere al menos una foto' });
      const data = await svc.agregarFotos(req.params.id, req.user.userId, req.user.rol, req.files);
      sendSuccess(res, data, 'Fotos agregadas', 201);
    } catch (err) { next(err); }
  },
};

module.exports = materialController;
