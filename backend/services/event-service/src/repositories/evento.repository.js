const { prisma } = require('@brickbybrick/shared');

const INCLUDE_LISTA = {
  constructora: { select: { id: true, usuarioId: true, razonSocial: true, logoUrl: true, verificada: true } },
  localidad: { select: { id: true, nombre: true } },
  _count: { select: { inscripciones: { where: { estado: { in: ['inscrito', 'asistio'] } } }, materiales: true } },
};

const INCLUDE_DETALLE = {
  ...INCLUDE_LISTA,
  materiales: {
    include: {
      material: {
        select: {
          id: true, nombre: true, cantidad: true, unidadMedida: true, estadoPublicacion: true,
          categoria: { select: { nombre: true, colorHex: true, icono: true } },
          fotos: { orderBy: { orden: 'asc' }, take: 1 },
        },
      },
    },
  },
};

function filtros(f) {
  const and = [];
  if (f.tipoEvento) and.push({ tipoEvento: f.tipoEvento });
  if (f.localidadId) and.push({ localidadId: f.localidadId });
  if (f.q) {
    and.push({
      OR: [
        { nombre: { contains: f.q, mode: 'insensitive' } },
        { descripcion: { contains: f.q, mode: 'insensitive' } },
        { constructora: { razonSocial: { contains: f.q, mode: 'insensitive' } } },
      ],
    });
  }
  if (f.alcance === 'proximos') and.push({ fechaFin: { gte: new Date() } });
  if (f.alcance === 'pasados') and.push({ fechaFin: { lt: new Date() } });
  return and;
}

const CERRADOS = ['finalizado', 'cancelado'];

/** Alcance temporal para las vistas de gestión (constructora y administración). */
function alcanceGestion(alcance) {
  if (alcance === 'proximos') return [{ estado: { notIn: CERRADOS } }, { OR: [{ fechaFin: { gte: new Date() } }, { estado: 'borrador' }] }];
  if (alcance === 'pasados') return [{ OR: [{ estado: { in: CERRADOS } }, { AND: [{ fechaFin: { lt: new Date() } }, { estado: { not: 'borrador' } }] }] }];
  return [];
}

async function paginar(where, orderBy, { skip, limit }) {
  const [total, items] = await prisma.$transaction([
    prisma.evento.count({ where }),
    prisma.evento.findMany({ where, include: INCLUDE_LISTA, skip, take: limit, orderBy }),
  ]);
  return { total, items };
}

const eventoRepository = {
  listarPublico(f, pag) {
    const porDefecto = f.alcance === 'proximos' ? ['publicado', 'en_curso'] : ['publicado', 'en_curso', 'finalizado'];
    const estados = f.estado && ['publicado', 'en_curso', 'finalizado', 'cancelado'].includes(f.estado)
      ? [f.estado] : porDefecto;
    const where = { AND: [{ estado: { in: estados } }, ...filtros(f)] };
    return paginar(where, [{ fechaInicio: f.alcance === 'pasados' ? 'desc' : 'asc' }], pag);
  },

  /** Vista de gestión: incluye borradores; los cancelados/finalizados cuentan como pasados. */
  listarDeConstructora(constructoraId, f, pag) {
    const where = { AND: [{ constructoraId }, ...(f.estado ? [{ estado: f.estado }] : []), ...filtros({ ...f, alcance: 'todos' }), ...alcanceGestion(f.alcance)] };
    return paginar(where, [{ fechaInicio: f.alcance === 'proximos' ? 'asc' : 'desc' }], pag);
  },

  listarAdmin(f, pag) {
    const where = { AND: [...(f.estado ? [{ estado: f.estado }] : []), ...filtros({ ...f, alcance: 'todos' }), ...alcanceGestion(f.alcance)] };
    return paginar(where, [{ fechaInicio: f.alcance === 'proximos' ? 'asc' : 'desc' }], pag);
  },

  findById(id) {
    return prisma.evento.findUnique({ where: { id }, include: INCLUDE_DETALLE });
  },

  update(id, data) {
    return prisma.evento.update({ where: { id }, data, include: INCLUDE_DETALLE });
  },

  inscripcionesDe(beneficiarioId, eventoIds) {
    return prisma.inscripcionEvento.findMany({
      where: { beneficiarioId, eventoId: { in: eventoIds } },
      select: { eventoId: true, estado: true },
    });
  },

  misInscripciones(beneficiarioId, { alcance }, { skip, limit }) {
    const where = {
      beneficiarioId,
      estado: { in: ['inscrito', 'asistio', 'no_asistio'] },
      ...(alcance === 'proximos' ? { evento: { fechaFin: { gte: new Date() }, estado: { in: ['publicado', 'en_curso'] } } } : {}),
      ...(alcance === 'pasados' ? { evento: { OR: [{ fechaFin: { lt: new Date() } }, { estado: { in: ['finalizado', 'cancelado'] } }] } } : {}),
    };
    return prisma.$transaction([
      prisma.inscripcionEvento.count({ where }),
      prisma.inscripcionEvento.findMany({
        where, skip, take: limit, orderBy: { evento: { fechaInicio: 'asc' } },
        include: { evento: { include: INCLUDE_LISTA } },
      }),
    ]);
  },

  inscritos(eventoId, estado) {
    return prisma.inscripcionEvento.findMany({
      where: { eventoId, ...(estado ? { estado } : { estado: { not: 'cancelada' } }) },
      include: {
        beneficiario: {
          select: {
            id: true, usuarioId: true, nombreCompleto: true, cedula: true,
            localidad: { select: { nombre: true } },
            usuario: { select: { email: true, telefono: true } },
          },
        },
      },
      orderBy: { fechaInscripcion: 'asc' },
    });
  },

  usuariosInscritos(eventoId) {
    return prisma.inscripcionEvento.findMany({
      where: { eventoId, estado: 'inscrito' },
      select: { beneficiario: { select: { usuarioId: true } } },
    }).then((filas) => filas.map((f) => f.beneficiario.usuarioId));
  },

  materialesPropios(constructoraId, ids) {
    return prisma.material.count({ where: { id: { in: ids }, constructoraId, eliminadoEn: null } });
  },

  async destinatariosEventoNuevo(evento) {
    const [seguidores, vecinos] = await prisma.$transaction([
      prisma.seguidor.findMany({ where: { seguidoId: evento.constructora.usuarioId }, select: { seguidorId: true } }),
      prisma.beneficiario.findMany({
        where: { localidadId: evento.localidadId ?? -1, usuario: { estado: 'activo' } },
        select: { usuarioId: true }, take: 500,
      }),
    ]);
    return [...new Set([...seguidores.map((s) => s.seguidorId), ...vecinos.map((b) => b.usuarioId)])];
  },
};

module.exports = eventoRepository;
