const { parsePaginacion, pagina, NotFoundError, ForbiddenError } = require('@brickbybrick/shared');
const repo = require('../repositories/notificacion.repository');

async function propia(id, usuarioId) {
  const n = await repo.findById(id);
  if (!n) throw new NotFoundError('Notificación no encontrada');
  if (n.usuarioId !== usuarioId) throw new ForbiddenError('No tienes permiso sobre esta notificación');
  return n;
}

module.exports = {
  async listar(usuarioId, query) {
    const pag = parsePaginacion(query, { defaultLimit: 30 });
    const { total, noLeidas, items } = await repo.listar(usuarioId, {
      soloNoLeidas: query.soloNoLeidas === 'true',
      tipo: query.tipo,
    }, pag);
    return { ...pagina(items, total, pag), noLeidas };
  },
  noLeidas: async (usuarioId) => ({ noLeidas: await repo.contarNoLeidas(usuarioId) }),
  async marcarLeida(id, usuarioId) {
    await propia(id, usuarioId);
    return repo.marcarLeida(id);
  },
  async marcarTodas(usuarioId) {
    const { count } = await repo.marcarTodas(usuarioId);
    return { actualizadas: count };
  },
  async eliminar(id, usuarioId) {
    await propia(id, usuarioId);
    await repo.eliminar(id);
  },
  async eliminarLeidas(usuarioId) {
    const { count } = await repo.eliminarLeidas(usuarioId);
    return { eliminadas: count };
  },
};
