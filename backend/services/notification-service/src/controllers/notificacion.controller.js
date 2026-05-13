const svc = require('../services/notificacion.service');
const { sendSuccess } = require('@brickbybrick/shared');

const notifController = {
  async list(req, res, next) {
    try { sendSuccess(res, await svc.findByUsuario(req.user.userId, req.query)); } catch (err) { next(err); }
  },
  async marcarLeida(req, res, next) {
    try { sendSuccess(res, await svc.marcarLeida(req.params.id, req.user.userId)); } catch (err) { next(err); }
  },
  async marcarTodasLeidas(req, res, next) {
    try { sendSuccess(res, await svc.marcarTodasLeidas(req.user.userId), 'Todas marcadas como leídas'); } catch (err) { next(err); }
  },
  async remove(req, res, next) {
    try { await svc.remove(req.params.id, req.user.userId); sendSuccess(res, null, 'Notificación eliminada'); } catch (err) { next(err); }
  },
};

module.exports = notifController;
