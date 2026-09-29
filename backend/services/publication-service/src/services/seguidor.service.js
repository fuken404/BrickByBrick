const {
  prisma, parsePaginacion, pagina, toUsuarioPublico, USUARIO_PUBLICO_SELECT, createNotification,
  NotFoundError, BadRequestError, ConflictError,
} = require('@brickbybrick/shared');

async function listar(where, relacion, query, visitanteId) {
  const pag = parsePaginacion(query, { defaultLimit: 30 });
  const [total, filas] = await prisma.$transaction([
    prisma.seguidor.count({ where }),
    prisma.seguidor.findMany({
      where, skip: pag.skip, take: pag.limit, orderBy: { createdAt: 'desc' },
      include: { [relacion]: { select: USUARIO_PUBLICO_SELECT } },
    }),
  ]);
  const usuarios = filas.map((f) => toUsuarioPublico(f[relacion]));
  const sigo = visitanteId
    ? new Set((await prisma.seguidor.findMany({
      where: { seguidorId: visitanteId, seguidoId: { in: usuarios.map((u) => u.id) } },
      select: { seguidoId: true },
    })).map((s) => s.seguidoId))
    : new Set();
  return pagina(usuarios.map((u) => ({ ...u, siguiendoPorMi: sigo.has(u.id) })), total, pag);
}

module.exports = {
  async seguir(seguidorId, seguidoId) {
    if (seguidorId === seguidoId) throw new BadRequestError('No puedes seguirte a ti mismo');
    const destino = await prisma.usuario.findUnique({ where: { id: seguidoId }, select: { estado: true } });
    if (!destino || destino.estado !== 'activo') throw new NotFoundError('Usuario no encontrado');
    try {
      await prisma.seguidor.create({ data: { seguidorId, seguidoId } });
    } catch (err) {
      if (err.code === 'P2002') throw new ConflictError('Ya sigues a este usuario');
      throw err;
    }
    const yo = await prisma.usuario.findUnique({ where: { id: seguidorId }, select: USUARIO_PUBLICO_SELECT });
    createNotification({
      usuarioId: seguidoId,
      tipo: 'seguidor_nuevo',
      titulo: 'Tienes un nuevo seguidor',
      mensaje: `${toUsuarioPublico(yo).nombre} comenzó a seguirte.`,
      recurso: 'usuario',
      recursoId: seguidorId,
    });
    return { seguidores: await prisma.seguidor.count({ where: { seguidoId } }), siguiendoPorMi: true };
  },

  async dejarDeSeguir(seguidorId, seguidoId) {
    await prisma.seguidor.deleteMany({ where: { seguidorId, seguidoId } });
    return { seguidores: await prisma.seguidor.count({ where: { seguidoId } }), siguiendoPorMi: false };
  },

  seguidores: (usuarioId, query, visitanteId) => listar({ seguidoId: usuarioId }, 'seguidor', query, visitanteId),
  siguiendo: (usuarioId, query, visitanteId) => listar({ seguidorId: usuarioId }, 'seguido', query, visitanteId),
};
