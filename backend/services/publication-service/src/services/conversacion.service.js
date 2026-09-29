const {
  prisma, toUsuarioPublico, USUARIO_PUBLICO_SELECT, createNotification, emitirTiempoReal,
  NotFoundError, ForbiddenError, BadRequestError,
} = require('@brickbybrick/shared');

const par = (a, b) => (a < b ? [a, b] : [b, a]);

async function cargarPropia(id, usuarioId) {
  const c = await prisma.conversacion.findUnique({ where: { id } });
  if (!c) throw new NotFoundError('Conversación no encontrada');
  if (c.usuarioAId !== usuarioId && c.usuarioBId !== usuarioId) throw new ForbiddenError('No participas en esta conversación');
  return c;
}

function toMensaje(m) {
  return { id: m.id, conversacionId: m.conversacionId, autorId: m.autorId, contenido: m.contenido, leidoEn: m.leidoEn, createdAt: m.createdAt };
}

const conversacionService = {
  async listar(usuarioId) {
    const convs = await prisma.conversacion.findMany({
      where: { OR: [{ usuarioAId: usuarioId }, { usuarioBId: usuarioId }], mensajes: { some: {} } },
      orderBy: { ultimoMensajeEn: 'desc' },
      include: {
        usuarioA: { select: USUARIO_PUBLICO_SELECT },
        usuarioB: { select: USUARIO_PUBLICO_SELECT },
        mensajes: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      take: 100,
    });
    const noLeidos = await prisma.mensajeDirecto.groupBy({
      by: ['conversacionId'],
      where: { conversacionId: { in: convs.map((c) => c.id) }, autorId: { not: usuarioId }, leidoEn: null },
      _count: { _all: true },
    });
    const mapa = new Map(noLeidos.map((n) => [n.conversacionId, n._count._all]));
    return convs.map((c) => ({
      id: c.id,
      otroUsuario: toUsuarioPublico(c.usuarioAId === usuarioId ? c.usuarioB : c.usuarioA),
      ultimoMensaje: c.mensajes[0] ? toMensaje(c.mensajes[0]) : null,
      ultimoMensajeEn: c.ultimoMensajeEn,
      noLeidos: mapa.get(c.id) ?? 0,
    }));
  },

  async noLeidos(usuarioId) {
    const total = await prisma.mensajeDirecto.count({
      where: {
        autorId: { not: usuarioId }, leidoEn: null,
        conversacion: { OR: [{ usuarioAId: usuarioId }, { usuarioBId: usuarioId }] },
      },
    });
    return { total };
  },

  async abrir(usuarioId, { usuarioId: otroId }) {
    if (otroId === usuarioId) throw new BadRequestError('No puedes escribirte a ti mismo');
    const otro = await prisma.usuario.findUnique({ where: { id: otroId }, select: { ...USUARIO_PUBLICO_SELECT, estado: true } });
    if (!otro || otro.estado !== 'activo') throw new NotFoundError('Usuario no encontrado');
    const [usuarioAId, usuarioBId] = par(usuarioId, otroId);
    const c = await prisma.conversacion.upsert({
      where: { usuarioAId_usuarioBId: { usuarioAId, usuarioBId } },
      update: {},
      create: { usuarioAId, usuarioBId },
    });
    return { id: c.id, otroUsuario: toUsuarioPublico(otro), ultimoMensaje: null, ultimoMensajeEn: c.ultimoMensajeEn, noLeidos: 0 };
  },

  async obtener(id, usuarioId) {
    const c = await cargarPropia(id, usuarioId);
    const otroId = c.usuarioAId === usuarioId ? c.usuarioBId : c.usuarioAId;
    const otro = await prisma.usuario.findUnique({ where: { id: otroId }, select: USUARIO_PUBLICO_SELECT });
    return { id: c.id, otroUsuario: toUsuarioPublico(otro) };
  },

  async mensajes(id, usuarioId, { antes, limit }) {
    await cargarPropia(id, usuarioId);
    const filas = await prisma.mensajeDirecto.findMany({
      where: { conversacionId: id, ...(antes ? { createdAt: { lt: antes } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });
    return { items: filas.slice(0, limit).reverse().map(toMensaje), hayMas: filas.length > limit };
  },

  async enviar(id, usuarioId, { contenido }) {
    const c = await cargarPropia(id, usuarioId);
    const otroId = c.usuarioAId === usuarioId ? c.usuarioBId : c.usuarioAId;
    const otro = await prisma.usuario.findUnique({ where: { id: otroId }, select: { estado: true } });
    if (otro?.estado !== 'activo') throw new BadRequestError('Este usuario ya no puede recibir mensajes');

    const pendientesPrevios = await prisma.mensajeDirecto.count({ where: { conversacionId: id, autorId: usuarioId, leidoEn: null } });
    const [m] = await prisma.$transaction([
      prisma.mensajeDirecto.create({ data: { conversacionId: id, autorId: usuarioId, contenido } }),
      prisma.conversacion.update({ where: { id }, data: { ultimoMensajeEn: new Date() } }),
    ]);
    const dto = toMensaje(m);
    emitirTiempoReal({ usuarioIds: [usuarioId, otroId], evento: 'dm:mensaje', payload: dto });

    // Solo se notifica el primer mensaje sin leer para no saturar la bandeja
    if (!pendientesPrevios) {
      const yo = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: USUARIO_PUBLICO_SELECT });
      createNotification({
        usuarioId: otroId,
        tipo: 'mensaje_nuevo',
        titulo: `Mensaje de ${toUsuarioPublico(yo).nombre}`,
        mensaje: contenido.length > 100 ? `${contenido.slice(0, 100)}…` : contenido,
        recurso: 'conversacion',
        recursoId: id,
      });
    }
    return dto;
  },

  async marcarLeida(id, usuarioId) {
    await cargarPropia(id, usuarioId);
    const { count } = await prisma.mensajeDirecto.updateMany({
      where: { conversacionId: id, autorId: { not: usuarioId }, leidoEn: null },
      data: { leidoEn: new Date() },
    });
    if (count) emitirTiempoReal({ usuarioIds: [usuarioId], evento: 'dm:leido', payload: { conversacionId: id } });
    return { marcados: count };
  },
};

module.exports = conversacionService;
