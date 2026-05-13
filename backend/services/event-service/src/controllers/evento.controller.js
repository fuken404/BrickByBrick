const svc = require('../services/evento.service');
const { sendSuccess } = require('@brickbybrick/shared');

const eventoController = {
  async listMios(req, res, next) {
    try { sendSuccess(res, await svc.findByConstructora(req.user.userId, req.query)); } catch (err) { next(err); }
  },
  async list(req, res, next) {
    try { sendSuccess(res, await svc.findAll(req.query)); } catch (err) { next(err); }
  },
  async getOne(req, res, next) {
    try { sendSuccess(res, await svc.findById(req.params.id)); } catch (err) { next(err); }
  },
  async create(req, res, next) {
    try { sendSuccess(res, await svc.create(req.user.userId, req.validatedBody), 'Evento creado', 201); } catch (err) { next(err); }
  },
  async update(req, res, next) {
    try { sendSuccess(res, await svc.update(req.params.id, req.user.userId, req.user.rol, req.validatedBody), 'Evento actualizado'); } catch (err) { next(err); }
  },
  async remove(req, res, next) {
    try { await svc.remove(req.params.id, req.user.userId, req.user.rol); sendSuccess(res, null, 'Evento eliminado'); } catch (err) { next(err); }
  },
  async getInscritos(req, res, next) {
    try { sendSuccess(res, await svc.getInscritos(req.params.id, req.user.userId, req.user.rol)); } catch (err) { next(err); }
  },
  async inscribirse(req, res, next) {
    try { sendSuccess(res, await svc.inscribirse(req.params.id, req.user.userId), 'Inscripción exitosa', 201); } catch (err) { next(err); }
  },
  async desinscribirse(req, res, next) {
    try { await svc.desinscribirse(req.params.id, req.user.userId); sendSuccess(res, null, 'Inscripción cancelada'); } catch (err) { next(err); }
  },
  async marcarAsistencia(req, res, next) {
    try { await svc.marcarAsistencia(req.params.id, req.user.userId, req.user.rol, req.body.inscritos); sendSuccess(res, null, 'Asistencia registrada'); } catch (err) { next(err); }
  },
  async exportInscritos(req, res, next) {
    try {
      const data = await svc.exportInscritos(req.params.id, req.user.userId, req.user.rol);
      const csv = ['nombre,cedula,email,fecha,asistio', ...data.map((r) => Object.values(r).join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inscritos-${req.params.id}.csv"`);
      res.send(csv);
    } catch (err) { next(err); }
  },
};

module.exports = eventoController;
