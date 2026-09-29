const {
  prisma, parsePaginacion, pagina, toUsuarioPublico, USUARIO_PUBLICO_SELECT, uploadToStorage, deleteFromStorage, createNotification,
  registrarAuditoria, configSistema,
  NotFoundError, ForbiddenError, BadRequestError, ConflictError,
} = require('@brickbybrick/shared');
const publicacionRepository = require('../repositories/publicacion.repository');

/** Aplana la publicación para el frontend (autor público, conteos, estado del visitante). */
function toDto(p, interacciones = { likes: new Set(), reposts: new Set() }) {
  if (!p) return null;
  const dto = {
    id: p.id,
    tipo: p.tipo,
    titulo: p.titulo,
    contenido: p.contenido,
    estado: p.estado,
    editada: p.editada,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    autor: toUsuarioPublico(p.autor),
    fotos: p.fotos?.map((f) => ({ id: f.id, url: f.url, orden: f.orden })) ?? [],
    materiales: p.materiales?.map((m) => m.material) ?? [],
    likes: p._count?.likes ?? 0,
    comentarios: p._count?.comentarios ?? 0,
    reposts: p._count?.reposts ?? 0,
    likedByMe: interacciones.likes.has(p.id),
    repostedByMe: interacciones.reposts.has(p.id),
    repostDe: null,
  };
  if (p.repostDe) {
    dto.repostDe = toDto({ ...p.repostDe, repostDe: null }, interacciones);
  }
  return dto;
}

async function mapear(items, usuarioId) {
  const ids = items.flatMap((p) => [p.id, p.repostDeId].filter(Boolean));
  const interacciones = await publicacionRepository.interaccionesDe(usuarioId, ids);
  return items.map((p) => toDto(p, interacciones));
}

async function propiaOAdmin(id, caller) {
  const p = await publicacionRepository.findRaw(id);
  if (!p) throw new NotFoundError('Publicación no encontrada');
  if (caller.rol !== 'ADMINISTRADOR' && p.autorId !== caller.userId) {
    throw new ForbiddenError('No tienes permiso sobre esta publicación');
  }
  return p;
}

const publicacionService = {
  toDto,

  async listar(filtros, caller) {
    const pag = parsePaginacion(filtros, { defaultLimit: 10, maxLimit: 50 });
    const esAdmin = caller?.rol === 'ADMINISTRADOR';
    const and = [{ estado: esAdmin && filtros.estado ? filtros.estado : 'publicada' }];
    // Los reposts de publicaciones suspendidas no se muestran
    and.push({ OR: [{ repostDeId: null }, { repostDe: { estado: 'publicada' } }] });
    if (filtros.tipo) and.push({ tipo: filtros.tipo });
    if (filtros.autorId) and.push({ autorId: filtros.autorId });
    if (filtros.q) {
      and.push({ OR: [
        { titulo: { contains: filtros.q, mode: 'insensitive' } },
        { contenido: { contains: filtros.q, mode: 'insensitive' } },
      ] });
    }
    if (filtros.feed === 'siguiendo' && caller) {
      const seguidos = await publicacionRepository.seguidos(caller.userId);
      and.push({ autorId: { in: [...seguidos, caller.userId] } });
    }
    const { total, items } = await publicacionRepository.listar({ AND: and }, pag);
    return pagina(await mapear(items, caller?.userId), total, pag);
  },

  async obtener(id, caller) {
    const p = await publicacionRepository.findById(id);
    const puedeVerSuspendida = caller && (caller.rol === 'ADMINISTRADOR' || caller.userId === p?.autorId);
    if (!p || (p.estado !== 'publicada' && !puedeVerSuspendida)) throw new NotFoundError('Publicación no encontrada');
    const [dto] = await mapear([p], caller?.userId);
    return dto;
  },

  async crear(usuarioId, data, files = []) {
    const max = Number(await configSistema.obtenerParametro('maxFotosMaterial'));
    if (files.length > max) throw new BadRequestError(`Máximo ${max} fotos por publicación`);
    if (data.materialIds?.length && (await publicacionRepository.materialesExisten(data.materialIds)) !== data.materialIds.length) {
      throw new BadRequestError('Algún material asociado no existe');
    }
    const fotos = await Promise.all(files.map(async (f, i) => ({
      url: await uploadToStorage(f.buffer, 'publicaciones', f.originalname, f.mimetype),
      orden: i,
    })));
    const p = await publicacionRepository.create({
      autorId: usuarioId,
      tipo: data.tipo,
      titulo: data.titulo ?? null,
      contenido: data.contenido,
      fotos: { create: fotos },
      materiales: { create: (data.materialIds ?? []).map((materialId) => ({ materialId })) },
    });
    return toDto(p);
  },

  async actualizar(id, caller, data) {
    const p = await propiaOAdmin(id, caller);
    if (p.repostDeId && (data.tipo || data.titulo)) throw new BadRequestError('En un repost solo puedes editar tu comentario');
    const actualizado = await publicacionRepository.update(id, { ...data, editada: true });
    const [dto] = await mapear([actualizado], caller.userId);
    return dto;
  },

  async eliminar(id, caller) {
    const p = await propiaOAdmin(id, caller);
    const completa = await publicacionRepository.findById(id);
    await publicacionRepository.delete(id);
    completa.fotos.forEach((f) => deleteFromStorage(f.url));
    if (caller.rol === 'ADMINISTRADOR' && p.autorId !== caller.userId) {
      registrarAuditoria({ usuarioId: caller.userId, accion: 'publicacion_eliminada', entidad: 'publicacion', entidadId: id });
    }
  },

  async moderar(id, adminId, { estado, motivo }) {
    const p = await publicacionRepository.findRaw(id);
    if (!p) throw new NotFoundError('Publicación no encontrada');
    const actualizado = await publicacionRepository.update(id, { estado });
    registrarAuditoria({ usuarioId: adminId, accion: `publicacion_${estado}`, entidad: 'publicacion', entidadId: id, detalle: { motivo } });
    createNotification({
      usuarioId: p.autorId,
      tipo: 'reporte_resuelto',
      titulo: estado === 'suspendida' ? 'Tu publicación fue ocultada' : 'Tu publicación fue restablecida',
      mensaje: estado === 'suspendida'
        ? `Un moderador ocultó tu publicación${p.titulo ? ` "${p.titulo}"` : ''}. Motivo: ${motivo}`
        : `Tu publicación${p.titulo ? ` "${p.titulo}"` : ''} vuelve a estar visible.`,
      recurso: 'publicacion',
      recursoId: id,
    });
    return toDto(actualizado);
  },

  async like(id, usuarioId) {
    const p = await publicacionRepository.findRaw(id);
    if (!p || p.estado !== 'publicada') throw new NotFoundError('Publicación no encontrada');
    try {
      await prisma.like.create({ data: { usuarioId, publicacionId: id } });
    } catch (err) {
      if (err.code === 'P2002') throw new ConflictError('Ya te gusta esta publicación');
      throw err;
    }
    if (p.autorId !== usuarioId) {
      const quien = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: USUARIO_PUBLICO_SELECT });
      createNotification({
        usuarioId: p.autorId,
        tipo: 'like',
        titulo: 'A alguien le gustó tu publicación',
        mensaje: `A ${toUsuarioPublico(quien).nombre} le gustó${p.titulo ? ` "${p.titulo}"` : ' tu publicación'}.`,
        recurso: 'publicacion',
        recursoId: id,
      });
    }
    return { likes: await prisma.like.count({ where: { publicacionId: id } }), likedByMe: true };
  },

  async unlike(id, usuarioId) {
    await prisma.like.deleteMany({ where: { usuarioId, publicacionId: id } });
    return { likes: await prisma.like.count({ where: { publicacionId: id } }), likedByMe: false };
  },

  async repostear(id, usuarioId, { comentario }) {
    const origen = await publicacionRepository.findRaw(id);
    if (!origen || origen.estado !== 'publicada') throw new NotFoundError('Publicación no encontrada');
    const originalId = origen.repostDeId ?? origen.id;
    const original = originalId === origen.id ? origen : await publicacionRepository.findRaw(originalId);
    if (original.autorId === usuarioId) throw new BadRequestError('No puedes compartir tu propia publicación');
    if (await publicacionRepository.repostDe(usuarioId, originalId)) throw new ConflictError('Ya compartiste esta publicación');

    const repost = await publicacionRepository.create({
      autorId: usuarioId,
      tipo: original.tipo,
      contenido: comentario ?? '',
      repostDeId: originalId,
    });
    createNotification({
      usuarioId: original.autorId,
      tipo: 'repost',
      titulo: 'Compartieron tu publicación',
      mensaje: `${toUsuarioPublico(repost.autor).nombre} compartió${original.titulo ? ` "${original.titulo}"` : ' tu publicación'}.`,
      recurso: 'publicacion',
      recursoId: repost.id,
    });
    const [dto] = await mapear([repost], usuarioId);
    return dto;
  },

  async quitarRepost(id, usuarioId) {
    const origen = await publicacionRepository.findRaw(id);
    if (!origen) throw new NotFoundError('Publicación no encontrada');
    const originalId = origen.repostDeId ?? origen.id;
    const mio = await publicacionRepository.repostDe(usuarioId, originalId);
    if (!mio) throw new NotFoundError('No has compartido esta publicación');
    await publicacionRepository.delete(mio.id);
  },
};

module.exports = publicacionService;
