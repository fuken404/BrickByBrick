const {
  prisma, parsePaginacion, pagina, toUsuarioPublico, USUARIO_PUBLICO_SELECT, uploadToStorage, deleteFromStorage,
  notificar, createNotification, emitirTiempoReal, registrarAuditoria,
  NotFoundError, ForbiddenError, BadRequestError, ConflictError,
} = require('@brickbybrick/shared');

const INCLUDE = {
  temas: true,
  creador: { select: USUARIO_PUBLICO_SELECT },
  _count: { select: { miembros: { where: { estado: 'activo' } }, mensajes: true } },
};

async function membresia(grupoId, usuarioId) {
  if (!usuarioId) return null;
  return prisma.miembroGrupo.findUnique({ where: { grupoId_usuarioId: { grupoId, usuarioId } } });
}

function toDto(g, miembro) {
  return {
    id: g.id,
    nombre: g.nombre,
    descripcion: g.descripcion,
    imagenUrl: g.imagenUrl,
    privacidad: g.privacidad,
    createdAt: g.createdAt,
    temas: g.temas.map((t) => t.tema),
    creador: toUsuarioPublico(g.creador),
    miembros: g._count.miembros,
    mensajes: g._count.mensajes,
    miMembresia: miembro ? { estado: miembro.estado, rol: miembro.rol } : null,
  };
}

async function cargar(id) {
  const g = await prisma.grupo.findUnique({ where: { id }, include: INCLUDE });
  if (!g) throw new NotFoundError('Grupo no encontrado');
  return g;
}

async function exigirAdminGrupo(grupoId, caller) {
  if (caller.rol === 'ADMINISTRADOR') return;
  const m = await membresia(grupoId, caller.userId);
  if (!m || m.estado !== 'activo' || m.rol !== 'admin') throw new ForbiddenError('Solo los administradores del grupo pueden hacer esto');
}

async function exigirMiembroActivo(grupoId, usuarioId) {
  const m = await membresia(grupoId, usuarioId);
  if (!m || m.estado !== 'activo') throw new ForbiddenError('Debes ser miembro del grupo');
  return m;
}

async function adminsDelGrupo(grupoId) {
  const filas = await prisma.miembroGrupo.findMany({ where: { grupoId, rol: 'admin', estado: 'activo' }, select: { usuarioId: true } });
  return filas.map((f) => f.usuarioId);
}

const grupoService = {
  async listar(query, caller) {
    const pag = parsePaginacion(query, { defaultLimit: 12 });
    const and = [];
    if (query.q) {
      and.push({ OR: [
        { nombre: { contains: query.q, mode: 'insensitive' } },
        { descripcion: { contains: query.q, mode: 'insensitive' } },
        { temas: { some: { tema: { contains: query.q, mode: 'insensitive' } } } },
      ] });
    }
    if (query.mios === 'true' && caller) and.push({ miembros: { some: { usuarioId: caller.userId, estado: 'activo' } } });
    const where = { AND: and };
    const [total, items] = await prisma.$transaction([
      prisma.grupo.count({ where }),
      prisma.grupo.findMany({ where, include: INCLUDE, skip: pag.skip, take: pag.limit, orderBy: { createdAt: 'desc' } }),
    ]);
    const mias = caller
      ? await prisma.miembroGrupo.findMany({ where: { usuarioId: caller.userId, grupoId: { in: items.map((g) => g.id) } } })
      : [];
    const mapa = new Map(mias.map((m) => [m.grupoId, m]));
    return pagina(items.map((g) => toDto(g, mapa.get(g.id))), total, pag);
  },

  async obtener(id, caller) {
    const g = await cargar(id);
    return toDto(g, await membresia(id, caller?.userId));
  },

  async crear(caller, data) {
    const { temas, ...campos } = data;
    const g = await prisma.grupo.create({
      data: {
        ...campos,
        creadorId: caller.userId,
        temas: { create: [...new Set(temas.map((t) => t.toLowerCase()))].map((tema) => ({ tema })) },
        miembros: { create: [{ usuarioId: caller.userId, rol: 'admin', estado: 'activo' }] },
      },
      include: INCLUDE,
    });
    return toDto(g, { estado: 'activo', rol: 'admin' });
  },

  async actualizar(id, caller, data) {
    await cargar(id);
    await exigirAdminGrupo(id, caller);
    const { temas, ...campos } = data;
    await prisma.$transaction(async (tx) => {
      await tx.grupo.update({ where: { id }, data: campos });
      if (temas) {
        await tx.temaGrupo.deleteMany({ where: { grupoId: id } });
        await tx.temaGrupo.createMany({ data: [...new Set(temas.map((t) => t.toLowerCase()))].map((tema) => ({ grupoId: id, tema })) });
      }
    });
    return this.obtener(id, caller);
  },

  async actualizarImagen(id, caller, file) {
    const g = await cargar(id);
    await exigirAdminGrupo(id, caller);
    const imagenUrl = await uploadToStorage(file.buffer, 'grupos', file.originalname, file.mimetype);
    await prisma.grupo.update({ where: { id }, data: { imagenUrl } });
    if (g.imagenUrl) deleteFromStorage(g.imagenUrl);
    return this.obtener(id, caller);
  },

  async eliminar(id, caller) {
    const g = await cargar(id);
    if (caller.rol !== 'ADMINISTRADOR' && g.creadorId !== caller.userId) {
      throw new ForbiddenError('Solo quien creó el grupo puede eliminarlo');
    }
    const miembros = await prisma.miembroGrupo.findMany({ where: { grupoId: id, estado: 'activo' }, select: { usuarioId: true } });
    await prisma.grupo.delete({ where: { id } });
    if (g.imagenUrl) deleteFromStorage(g.imagenUrl);
    notificar({
      usuarioIds: miembros.map((m) => m.usuarioId).filter((u) => u !== caller.userId),
      tipo: 'grupo_invitacion',
      titulo: 'Un grupo fue eliminado',
      mensaje: `El grupo "${g.nombre}" ya no existe.`,
    });
    if (caller.rol === 'ADMINISTRADOR') {
      registrarAuditoria({ usuarioId: caller.userId, accion: 'grupo_eliminado', entidad: 'grupo', entidadId: id, detalle: { nombre: g.nombre } });
    }
  },

  /** Unirse: público → activo; privado → pendiente de aprobación; invitado → acepta. */
  async unirse(id, caller) {
    const g = await cargar(id);
    const actual = await membresia(id, caller.userId);
    if (actual?.estado === 'activo') throw new ConflictError('Ya eres miembro de este grupo');
    if (actual?.estado === 'pendiente') throw new ConflictError('Tu solicitud está pendiente de aprobación');

    const estado = actual?.estado === 'invitado' || g.privacidad === 'publico' ? 'activo' : 'pendiente';
    const m = actual
      ? await prisma.miembroGrupo.update({ where: { grupoId_usuarioId: { grupoId: id, usuarioId: caller.userId } }, data: { estado, fechaUnion: new Date() } })
      : await prisma.miembroGrupo.create({ data: { grupoId: id, usuarioId: caller.userId, estado } });

    if (estado === 'pendiente') {
      const yo = await prisma.usuario.findUnique({ where: { id: caller.userId }, select: USUARIO_PUBLICO_SELECT });
      notificar({
        usuarioIds: await adminsDelGrupo(id),
        tipo: 'grupo_solicitud',
        titulo: 'Solicitud para unirse a tu grupo',
        mensaje: `${toUsuarioPublico(yo).nombre} quiere unirse a "${g.nombre}".`,
        recurso: 'grupo',
        recursoId: id,
      });
    }
    return { estado: m.estado, rol: m.rol };
  },

  async salir(id, caller) {
    await cargar(id);
    const m = await membresia(id, caller.userId);
    if (!m) throw new NotFoundError('No perteneces a este grupo');
    await prisma.$transaction(async (tx) => {
      await tx.miembroGrupo.delete({ where: { grupoId_usuarioId: { grupoId: id, usuarioId: caller.userId } } });
      if (m.rol === 'admin') {
        const quedanAdmins = await tx.miembroGrupo.count({ where: { grupoId: id, rol: 'admin', estado: 'activo' } });
        if (!quedanAdmins) {
          const siguiente = await tx.miembroGrupo.findFirst({ where: { grupoId: id, estado: 'activo' }, orderBy: { fechaUnion: 'asc' } });
          if (siguiente) {
            await tx.miembroGrupo.update({ where: { grupoId_usuarioId: { grupoId: id, usuarioId: siguiente.usuarioId } }, data: { rol: 'admin' } });
          }
        }
      }
    });
  },

  async miembros(id, caller, query) {
    const g = await cargar(id);
    const m = await membresia(id, caller?.userId);
    const esAdminGrupo = caller?.rol === 'ADMINISTRADOR' || (m?.estado === 'activo' && m.rol === 'admin');
    if (g.privacidad === 'privado' && m?.estado !== 'activo' && caller?.rol !== 'ADMINISTRADOR') {
      throw new ForbiddenError('Los miembros de un grupo privado solo son visibles para sus integrantes');
    }
    const pag = parsePaginacion(query, { defaultLimit: 50 });
    const where = { grupoId: id, ...(esAdminGrupo && query.estado ? { estado: query.estado } : { estado: 'activo' }) };
    const [total, filas] = await prisma.$transaction([
      prisma.miembroGrupo.count({ where }),
      prisma.miembroGrupo.findMany({
        where, skip: pag.skip, take: pag.limit, orderBy: [{ rol: 'asc' }, { fechaUnion: 'asc' }],
        include: { usuario: { select: USUARIO_PUBLICO_SELECT } },
      }),
    ]);
    return pagina(filas.map((f) => ({ ...toUsuarioPublico(f.usuario), rolGrupo: f.rol, estado: f.estado, fechaUnion: f.fechaUnion })), total, pag);
  },

  async gestionarMiembro(id, usuarioId, caller, { accion }) {
    const g = await cargar(id);
    await exigirAdminGrupo(id, caller);
    const m = await membresia(id, usuarioId);
    if (!m) throw new NotFoundError('El usuario no pertenece al grupo');
    const where = { grupoId_usuarioId: { grupoId: id, usuarioId } };

    if (accion === 'aprobar') {
      if (m.estado !== 'pendiente') throw new BadRequestError('No hay una solicitud pendiente');
      await prisma.miembroGrupo.update({ where, data: { estado: 'activo', fechaUnion: new Date() } });
      createNotification({
        usuarioId, tipo: 'grupo_invitacion', titulo: 'Te aceptaron en un grupo',
        mensaje: `Ya eres miembro de "${g.nombre}".`, recurso: 'grupo', recursoId: id,
      });
    } else if (accion === 'rechazar' || accion === 'expulsar') {
      if (usuarioId === g.creadorId) throw new ForbiddenError('No se puede expulsar a quien creó el grupo');
      await prisma.miembroGrupo.delete({ where });
      emitirTiempoReal({ usuarioIds: [usuarioId], evento: 'grupo:expulsado', payload: { grupoId: id } });
    } else if (accion === 'hacer_admin' || accion === 'quitar_admin') {
      if (m.estado !== 'activo') throw new BadRequestError('El usuario no es miembro activo');
      if (accion === 'quitar_admin' && usuarioId === g.creadorId) throw new ForbiddenError('Quien creó el grupo siempre es administrador');
      await prisma.miembroGrupo.update({ where, data: { rol: accion === 'hacer_admin' ? 'admin' : 'miembro' } });
    }
    return { usuarioId, accion };
  },

  async invitar(id, caller, { usuarioId }) {
    const g = await cargar(id);
    await exigirMiembroActivo(id, caller.userId);
    if (g.privacidad === 'privado') await exigirAdminGrupo(id, caller);
    const destino = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { estado: true } });
    if (!destino || destino.estado !== 'activo') throw new NotFoundError('Usuario no encontrado');
    const actual = await membresia(id, usuarioId);
    if (actual?.estado === 'activo') throw new ConflictError('El usuario ya es miembro');

    if (actual) {
      await prisma.miembroGrupo.update({ where: { grupoId_usuarioId: { grupoId: id, usuarioId } }, data: { estado: 'invitado' } });
    } else {
      await prisma.miembroGrupo.create({ data: { grupoId: id, usuarioId, estado: 'invitado' } });
    }
    const yo = await prisma.usuario.findUnique({ where: { id: caller.userId }, select: USUARIO_PUBLICO_SELECT });
    createNotification({
      usuarioId, tipo: 'grupo_invitacion', titulo: 'Te invitaron a un grupo',
      mensaje: `${toUsuarioPublico(yo).nombre} te invitó a unirte a "${g.nombre}".`,
      recurso: 'grupo', recursoId: id,
    });
    return { usuarioId, estado: 'invitado' };
  },

  async mensajes(id, caller, { antes, limit }) {
    await cargar(id);
    if (caller.rol !== 'ADMINISTRADOR') await exigirMiembroActivo(id, caller.userId);
    const filas = await prisma.mensajeGrupo.findMany({
      where: { grupoId: id, ...(antes ? { createdAt: { lt: antes } } : {}) },
      include: { autor: { select: USUARIO_PUBLICO_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });
    const hayMas = filas.length > limit;
    const items = filas.slice(0, limit).reverse().map((f) => ({
      id: f.id, grupoId: f.grupoId, contenido: f.contenido, adjuntoUrl: f.adjuntoUrl, createdAt: f.createdAt,
      autor: toUsuarioPublico(f.autor),
    }));
    return { items, hayMas };
  },

  async enviarMensaje(id, caller, { contenido }) {
    await cargar(id);
    await exigirMiembroActivo(id, caller.userId);
    const m = await prisma.mensajeGrupo.create({
      data: { grupoId: id, autorId: caller.userId, contenido },
      include: { autor: { select: USUARIO_PUBLICO_SELECT } },
    });
    const dto = { id: m.id, grupoId: id, contenido: m.contenido, adjuntoUrl: null, createdAt: m.createdAt, autor: toUsuarioPublico(m.autor) };
    emitirTiempoReal({ room: `grupo:${id}`, evento: 'grupo:mensaje', payload: dto });
    return dto;
  },
};

module.exports = grupoService;
