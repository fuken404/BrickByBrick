const { prisma, createNotification } = require('@brickbybrick/shared');

const PUB_INCLUDE = {
  autor:      { select: { id: true, email: true, rol: true } },
  fotos:      { orderBy: { orden: 'asc' } },
  _count:     { select: { comentarios: true, likes: true } },
};

class PublicacionService {
  async findAll({ page = 1, limit = 20, tipo, q } = {}) {
    const where = { estado: 'publicada', visibilidad: 'publica' };
    if (tipo) where.tipo = tipo;
    if (q)    where.OR = [
      { titulo:    { contains: q, mode: 'insensitive' } },
      { contenido: { contains: q, mode: 'insensitive' } },
    ];

    const [total, items] = await Promise.all([
      prisma.publicacion.count({ where }),
      prisma.publicacion.findMany({
        where,
        include: PUB_INCLUDE,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { total, page: Number(page), limit: Number(limit), items };
  }

  async findById(id) {
    const p = await prisma.publicacion.findUnique({
      where: { id },
      include: { ...PUB_INCLUDE, comentarios: { where: { parentId: null }, include: { autor: { select: { id: true, email: true } }, respuestas: { include: { autor: { select: { id: true, email: true } } } } }, orderBy: { createdAt: 'asc' }, take: 50 } },
    });
    if (!p) throw { status: 404, message: 'Publicación no encontrada' };
    return p;
  }

  async create(callerId, data) {
    return prisma.publicacion.create({
      data: { autorId: callerId, ...data, estado: 'publicada' },
      include: PUB_INCLUDE,
    });
  }

  async update(id, callerId, callerRol, data) {
    const p = await this._ownOrAdmin(id, callerId, callerRol);
    return prisma.publicacion.update({ where: { id }, data, include: PUB_INCLUDE });
  }

  async remove(id, callerId, callerRol) {
    await this._ownOrAdmin(id, callerId, callerRol);
    await prisma.publicacion.delete({ where: { id } });
  }

  // Comentarios
  async addComentario(publicacionId, callerId, { contenido, parentId }) {
    const p = await prisma.publicacion.findUnique({ where: { id: publicacionId } });
    if (!p) throw { status: 404, message: 'Publicación no encontrada' };

    const comentario = await prisma.comentario.create({
      data: { publicacionId, autorId: callerId, contenido, parentId: parentId || null },
      include: { autor: { select: { id: true, email: true } } },
    });

    // Notificar al autor si el comentario es de otro usuario
    if (p.autorId !== callerId) {
      await createNotification({
        usuarioId:  p.autorId,
        tipo:       'comentario',
        titulo:     'Nuevo comentario en tu publicación',
        mensaje:    `Alguien comentó en "${p.titulo}".`,
        urlDestino: `/publicaciones/${publicacionId}`,
      }).catch(() => {});
    }

    return comentario;
  }

  async removeComentario(comentarioId, callerId, callerRol) {
    const c = await prisma.comentario.findUnique({ where: { id: comentarioId } });
    if (!c) throw { status: 404, message: 'Comentario no encontrado' };
    if (callerRol !== 'ADMINISTRADOR' && c.autorId !== callerId) {
      throw { status: 403, message: 'Sin permiso' };
    }
    await prisma.comentario.delete({ where: { id: comentarioId } });
  }

  // Likes
  async addLike(publicacionId, callerId) {
    const existing = await prisma.like.findUnique({
      where: { usuarioId_publicacionId: { usuarioId: callerId, publicacionId } },
    });
    if (existing) throw { status: 409, message: 'Ya diste like a esta publicación' };

    const like = await prisma.like.create({ data: { usuarioId: callerId, publicacionId } });

    // Notificar al autor
    const p = await prisma.publicacion.findUnique({ where: { id: publicacionId }, select: { autorId: true, titulo: true } });
    if (p && p.autorId !== callerId) {
      await createNotification({
        usuarioId:  p.autorId,
        tipo:       'like',
        titulo:     'Nuevo like en tu publicación',
        mensaje:    `A alguien le gustó "${p.titulo}".`,
        urlDestino: `/publicaciones/${publicacionId}`,
      }).catch(() => {});
    }

    return like;
  }

  async removeLike(publicacionId, callerId) {
    const existing = await prisma.like.findUnique({
      where: { usuarioId_publicacionId: { usuarioId: callerId, publicacionId } },
    });
    if (!existing) throw { status: 404, message: 'No has dado like a esta publicación' };
    await prisma.like.delete({ where: { usuarioId_publicacionId: { usuarioId: callerId, publicacionId } } });
  }

  // Reportes
  async createReporte(callerId, data) {
    return prisma.reporte.create({
      data: { ...data, reportadoPor: callerId, estado: 'pendiente' },
    });
  }

  // ------------------------------------------------------------------
  async _ownOrAdmin(pubId, callerId, callerRol) {
    const p = await prisma.publicacion.findUnique({ where: { id: pubId } });
    if (!p) throw { status: 404, message: 'Publicación no encontrada' };
    if (callerRol !== 'ADMINISTRADOR' && p.autorId !== callerId) {
      throw { status: 403, message: 'Sin permiso' };
    }
    return p;
  }
}

module.exports = new PublicacionService();
