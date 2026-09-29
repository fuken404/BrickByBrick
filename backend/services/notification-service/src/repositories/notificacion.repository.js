const { prisma } = require('@brickbybrick/shared');

module.exports = {
  async listar(usuarioId, { soloNoLeidas, tipo }, { skip, limit }) {
    const where = { usuarioId, ...(soloNoLeidas ? { leida: false } : {}), ...(tipo ? { tipo } : {}) };
    const [total, noLeidas, items] = await prisma.$transaction([
      prisma.notificacion.count({ where }),
      prisma.notificacion.count({ where: { usuarioId, leida: false } }),
      prisma.notificacion.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    ]);
    return { total, noLeidas, items };
  },
  contarNoLeidas: (usuarioId) => prisma.notificacion.count({ where: { usuarioId, leida: false } }),
  findById: (id) => prisma.notificacion.findUnique({ where: { id } }),
  marcarLeida: (id) => prisma.notificacion.update({ where: { id }, data: { leida: true } }),
  marcarTodas: (usuarioId) => prisma.notificacion.updateMany({ where: { usuarioId, leida: false }, data: { leida: true } }),
  eliminar: (id) => prisma.notificacion.delete({ where: { id } }),
  eliminarLeidas: (usuarioId) => prisma.notificacion.deleteMany({ where: { usuarioId, leida: true } }),
  esMiembroActivo: (grupoId, usuarioId) =>
    prisma.miembroGrupo.count({ where: { grupoId, usuarioId, estado: 'activo' } }).then(Boolean),
};
