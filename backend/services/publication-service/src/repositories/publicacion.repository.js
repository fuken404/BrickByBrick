const { prisma, USUARIO_PUBLICO_SELECT } = require('@brickbybrick/shared');

const CUENTAS = { select: { likes: true, comentarios: true, reposts: true } };

const INCLUDE = {
  autor: { select: USUARIO_PUBLICO_SELECT },
  fotos: { orderBy: { orden: 'asc' } },
  materiales: { include: { material: { select: { id: true, nombre: true, categoria: { select: { nombre: true } } } } } },
  _count: CUENTAS,
  repostDe: {
    include: {
      autor: { select: USUARIO_PUBLICO_SELECT },
      fotos: { orderBy: { orden: 'asc' } },
      _count: CUENTAS,
    },
  },
};

const publicacionRepository = {
  INCLUDE,

  async listar(where, { skip, limit }) {
    const [total, items] = await prisma.$transaction([
      prisma.publicacion.count({ where }),
      prisma.publicacion.findMany({ where, include: INCLUDE, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    ]);
    return { total, items };
  },

  findById(id) {
    return prisma.publicacion.findUnique({ where: { id }, include: INCLUDE });
  },

  findRaw(id) {
    return prisma.publicacion.findUnique({ where: { id } });
  },

  seguidos(usuarioId) {
    return prisma.seguidor.findMany({ where: { seguidorId: usuarioId }, select: { seguidoId: true } })
      .then((f) => f.map((s) => s.seguidoId));
  },

  /** Marca likedByMe / repostedByMe para el visitante. */
  async interaccionesDe(usuarioId, publicacionIds) {
    if (!usuarioId || !publicacionIds.length) return { likes: new Set(), reposts: new Set() };
    const [likes, reposts] = await prisma.$transaction([
      prisma.like.findMany({ where: { usuarioId, publicacionId: { in: publicacionIds } }, select: { publicacionId: true } }),
      prisma.publicacion.findMany({
        where: { autorId: usuarioId, repostDeId: { in: publicacionIds } },
        select: { repostDeId: true },
      }),
    ]);
    return { likes: new Set(likes.map((l) => l.publicacionId)), reposts: new Set(reposts.map((r) => r.repostDeId)) };
  },

  create(data) {
    return prisma.publicacion.create({ data, include: INCLUDE });
  },

  update(id, data) {
    return prisma.publicacion.update({ where: { id }, data, include: INCLUDE });
  },

  delete(id) {
    return prisma.publicacion.delete({ where: { id } });
  },

  repostDe(usuarioId, originalId) {
    return prisma.publicacion.findFirst({ where: { autorId: usuarioId, repostDeId: originalId } });
  },

  materialesExisten(ids) {
    return prisma.material.count({ where: { id: { in: ids }, eliminadoEn: null } });
  },
};

module.exports = publicacionRepository;
