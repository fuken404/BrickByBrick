const {
  prisma, parsePaginacion, pagina, toUsuarioPublico, USUARIO_PUBLICO_SELECT, createNotification, registrarAuditoria,
  NotFoundError, ForbiddenError, ConflictError, BadRequestError,
} = require('@brickbybrick/shared');
const comentarioRepository = require('../repositories/comentario.repository');
const publicacionRepository = require('../repositories/publicacion.repository');

function toDto(c, likes) {
  return {
    id: c.id,
    publicacionId: c.publicacionId,
    parentId: c.parentId,
    contenido: c.oculto ? null : c.contenido,
    oculto: c.oculto,
    editado: c.editado,
    createdAt: c.createdAt,
    autor: toUsuarioPublico(c.autor),
    likes: c._count?.likes ?? 0,
    likedByMe: likes.has(c.id),
    respuestas: (c.respuestas ?? []).map((r) => toDto(r, likes)),
  };
}

const comentarioService = {
  async listar(publicacionId, query, caller) {
    const p = await publicacionRepository.findRaw(publicacionId);
    if (!p || (p.estado !== 'publicada' && caller?.rol !== 'ADMINISTRADOR' && caller?.userId !== p.autorId)) {
      throw new NotFoundError('Publicación no encontrada');
    }
    const pag = parsePaginacion(query, { defaultLimit: 20, maxLimit: 50 });
    const { total, items } = await comentarioRepository.listarRaiz(publicacionId, pag);
    const ids = items.flatMap((c) => [c.id, ...c.respuestas.map((r) => r.id)]);
    const likes = await comentarioRepository.likesDe(caller?.userId, ids);
    return pagina(items.map((c) => toDto(c, likes)), total, pag);
  },

  async crear(publicacionId, usuarioId, { contenido, parentId }) {
    const p = await publicacionRepository.findRaw(publicacionId);
    if (!p || p.estado !== 'publicada') throw new NotFoundError('Publicación no encontrada');

    let parent = null;
    if (parentId) {
      parent = await comentarioRepository.findById(parentId);
      if (!parent || parent.publicacionId !== publicacionId) throw new BadRequestError('El comentario al que respondes no existe');
    }
    // Hilos de dos niveles: una respuesta a otra respuesta cuelga del comentario raíz
    const raizId = parent ? (parent.parentId ?? parent.id) : null;

    const comentario = await comentarioRepository.create({ publicacionId, autorId: usuarioId, contenido, parentId: raizId });
    const autor = toUsuarioPublico(comentario.autor);

    if (p.autorId !== usuarioId) {
      createNotification({
        usuarioId: p.autorId,
        tipo: 'comentario',
        titulo: 'Nuevo comentario en tu publicación',
        mensaje: `${autor.nombre} comentó: "${contenido.slice(0, 80)}${contenido.length > 80 ? '…' : ''}"`,
        recurso: 'publicacion',
        recursoId: publicacionId,
      });
    }
    if (parent && parent.autorId !== usuarioId && parent.autorId !== p.autorId) {
      createNotification({
        usuarioId: parent.autorId,
        tipo: 'comentario_respuesta',
        titulo: 'Respondieron tu comentario',
        mensaje: `${autor.nombre} respondió: "${contenido.slice(0, 80)}${contenido.length > 80 ? '…' : ''}"`,
        recurso: 'publicacion',
        recursoId: publicacionId,
      });
    }
    return toDto(comentario, new Set());
  },

  async editar(id, usuarioId, { contenido }) {
    const c = await comentarioRepository.findById(id);
    if (!c) throw new NotFoundError('Comentario no encontrado');
    if (c.autorId !== usuarioId) throw new ForbiddenError('Solo puedes editar tus comentarios');
    if (c.oculto) throw new ForbiddenError('Este comentario fue ocultado por moderación');
    return toDto(await comentarioRepository.update(id, { contenido, editado: true }), new Set());
  },

  /** Puede borrar: su autor, el autor de la publicación o un administrador. */
  async eliminar(id, caller) {
    const c = await comentarioRepository.findById(id);
    if (!c) throw new NotFoundError('Comentario no encontrado');
    const permitido = caller.rol === 'ADMINISTRADOR' || c.autorId === caller.userId || c.publicacion.autorId === caller.userId;
    if (!permitido) throw new ForbiddenError('No tienes permiso para eliminar este comentario');
    await comentarioRepository.delete(id);
    if (caller.rol === 'ADMINISTRADOR' && c.autorId !== caller.userId) {
      registrarAuditoria({ usuarioId: caller.userId, accion: 'comentario_eliminado', entidad: 'comentario', entidadId: id });
    }
  },

  async like(id, usuarioId) {
    const c = await comentarioRepository.findById(id);
    if (!c || c.oculto) throw new NotFoundError('Comentario no encontrado');
    try {
      await comentarioRepository.like(usuarioId, id);
    } catch (err) {
      if (err.code === 'P2002') throw new ConflictError('Ya te gusta este comentario');
      throw err;
    }
    if (c.autorId !== usuarioId) {
      const quien = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: USUARIO_PUBLICO_SELECT });
      createNotification({
        usuarioId: c.autorId,
        tipo: 'like',
        titulo: 'A alguien le gustó tu comentario',
        mensaje: `A ${toUsuarioPublico(quien).nombre} le gustó tu comentario.`,
        recurso: 'publicacion',
        recursoId: c.publicacionId,
      });
    }
    return { likes: await comentarioRepository.contarLikes(id), likedByMe: true };
  },

  async unlike(id, usuarioId) {
    await comentarioRepository.unlike(usuarioId, id);
    return { likes: await comentarioRepository.contarLikes(id), likedByMe: false };
  },
};

module.exports = comentarioService;
