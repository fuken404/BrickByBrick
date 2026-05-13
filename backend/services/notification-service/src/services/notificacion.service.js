const { prisma } = require('@brickbybrick/shared');

class NotificacionService {
  async findByUsuario(usuarioId, { page = 1, limit = 30, soloNoLeidas } = {}) {
    const where = { usuarioId };
    if (soloNoLeidas === 'true') where.leida = false;

    const [total, noLeidas, items] = await Promise.all([
      prisma.notificacion.count({ where }),
      prisma.notificacion.count({ where: { usuarioId, leida: false } }),
      prisma.notificacion.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, noLeidas, page: Number(page), limit: Number(limit), items };
  }

  async marcarLeida(notifId, usuarioId) {
    const notif = await prisma.notificacion.findUnique({ where: { id: notifId } });
    if (!notif)                     throw { status: 404, message: 'Notificación no encontrada' };
    if (notif.usuarioId !== usuarioId) throw { status: 403, message: 'Sin permiso' };
    return prisma.notificacion.update({ where: { id: notifId }, data: { leida: true } });
  }

  async marcarTodasLeidas(usuarioId) {
    const { count } = await prisma.notificacion.updateMany({
      where: { usuarioId, leida: false },
      data:  { leida: true },
    });
    return { actualizadas: count };
  }

  async remove(notifId, usuarioId) {
    const notif = await prisma.notificacion.findUnique({ where: { id: notifId } });
    if (!notif)                     throw { status: 404, message: 'Notificación no encontrada' };
    if (notif.usuarioId !== usuarioId) throw { status: 403, message: 'Sin permiso' };
    await prisma.notificacion.delete({ where: { id: notifId } });
  }
}

module.exports = new NotificacionService();
