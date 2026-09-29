const { prisma, USUARIO_PUBLICO_SELECT } = require('@brickbybrick/shared');

const INCLUDE = {
  autor: { select: USUARIO_PUBLICO_SELECT },
  _count: { select: { likes: true } },
};

module.exports = {
  INCLUDE,

  async listarRaiz(publicacionId, { skip, limit }) {
    const where = { publicacionId, parentId: null };
    const [total, items] = await prisma.$transaction([
      prisma.comentario.count({ where }),
      prisma.comentario.findMany({
        where,
        include: {
          ...INCLUDE,
          respuestas: { include: INCLUDE, orderBy: { createdAt: 'asc' }, take: 50 },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
    ]);
    return { total, items };
  },

  findById(id) {
    return prisma.comentario.findUnique({ where: { id }, include: { publicacion: { select: { id: true, autorId: true, estado: true, titulo: true } } } });
  },

  create(data) {
    return prisma.comentario.create({ data, include: INCLUDE });
  },

  update(id, data) {
    return prisma.comentario.update({ where: { id }, data, include: INCLUDE });
  },

  delete(id) {
    return prisma.comentario.delete({ where: { id } });
  },

  likesDe(usuarioId, ids) {
    if (!usuarioId || !ids.length) return Promise.resolve(new Set());
    return prisma.likeComentario.findMany({ where: { usuarioId, comentarioId: { in: ids } }, select: { comentarioId: true } })
      .then((f) => new Set(f.map((l) => l.comentarioId)));
  },

  like(usuarioId, comentarioId) {
    return prisma.likeComentario.create({ data: { usuarioId, comentarioId } });
  },

  unlike(usuarioId, comentarioId) {
    return prisma.likeComentario.deleteMany({ where: { usuarioId, comentarioId } });
  },

  contarLikes(comentarioId) {
    return prisma.likeComentario.count({ where: { comentarioId } });
  },
};
