const {
  prisma, parsePaginacion, pagina, notificarAdmins, createNotification, registrarAuditoria, configSistema,
  toUsuarioPublico, USUARIO_PUBLICO_SELECT,
  NotFoundError, ConflictError, BadRequestError,
} = require('@brickbybrick/shared');

/** Carga un resumen del contenido reportado para mostrarlo al moderador. */
async function contenido(tipo, id) {
  switch (tipo) {
    case 'publicacion': {
      const p = await prisma.publicacion.findUnique({ where: { id }, include: { autor: { select: USUARIO_PUBLICO_SELECT } } });
      return p && { titulo: p.titulo, texto: p.contenido.slice(0, 300), estado: p.estado, autor: toUsuarioPublico(p.autor), enlaceId: p.id };
    }
    case 'comentario': {
      const c = await prisma.comentario.findUnique({ where: { id }, include: { autor: { select: USUARIO_PUBLICO_SELECT } } });
      return c && { texto: c.contenido.slice(0, 300), estado: c.oculto ? 'oculto' : 'visible', autor: toUsuarioPublico(c.autor), enlaceId: c.publicacionId };
    }
    case 'material': {
      const m = await prisma.material.findUnique({ where: { id }, include: { constructora: { select: { razonSocial: true } } } });
      return m && { titulo: m.nombre, texto: m.descripcion?.slice(0, 300), estado: m.estadoPublicacion, autor: { nombre: m.constructora.razonSocial }, enlaceId: m.id };
    }
    case 'usuario': {
      const u = await prisma.usuario.findUnique({ where: { id }, select: { ...USUARIO_PUBLICO_SELECT, estado: true } });
      return u && { titulo: toUsuarioPublico(u).nombre, estado: u.estado, autor: toUsuarioPublico(u), enlaceId: u.id };
    }
    default:
      return null;
  }
}

/** Oculta el contenido reportado (según su tipo). */
async function ocultar(tipo, id) {
  if (tipo === 'publicacion') await prisma.publicacion.update({ where: { id }, data: { estado: 'suspendida' } });
  if (tipo === 'comentario') await prisma.comentario.update({ where: { id }, data: { oculto: true } });
  if (tipo === 'material') await prisma.material.update({ where: { id }, data: { estadoPublicacion: 'pausado' } });
}

async function autorDe(tipo, id) {
  if (tipo === 'publicacion') return (await prisma.publicacion.findUnique({ where: { id }, select: { autorId: true } }))?.autorId;
  if (tipo === 'comentario') return (await prisma.comentario.findUnique({ where: { id }, select: { autorId: true } }))?.autorId;
  if (tipo === 'material') return (await prisma.material.findUnique({ where: { id }, select: { constructora: { select: { usuarioId: true } } } }))?.constructora.usuarioId;
  return null;
}

const reporteService = {
  async crear(usuarioId, { tipoContenido, contenidoId, motivo }) {
    const objetivo = await contenido(tipoContenido, contenidoId);
    if (!objetivo) throw new NotFoundError('El contenido reportado no existe');
    if (tipoContenido === 'usuario' && contenidoId === usuarioId) throw new BadRequestError('No puedes reportarte a ti mismo');
    const duplicado = await prisma.reporte.findFirst({ where: { tipoContenido, contenidoId, reportadoPor: usuarioId, estado: 'pendiente' } });
    if (duplicado) throw new ConflictError('Ya reportaste este contenido; lo estamos revisando');

    const reporte = await prisma.reporte.create({ data: { tipoContenido, contenidoId, motivo, reportadoPor: usuarioId } });

    const pendientes = await prisma.reporte.count({ where: { tipoContenido, contenidoId, estado: 'pendiente' } });
    const umbral = Number(await configSistema.obtenerParametro('umbralReportesOcultar'));
    const autoOcultado = pendientes >= umbral && tipoContenido !== 'usuario';
    if (autoOcultado) await ocultar(tipoContenido, contenidoId);

    notificarAdmins({
      tipo: 'reporte_resuelto',
      titulo: autoOcultado ? 'Contenido ocultado automáticamente' : 'Nuevo reporte de contenido',
      mensaje: autoOcultado
        ? `Un(a) ${tipoContenido} alcanzó ${pendientes} reportes y se ocultó a la espera de revisión.`
        : `Se reportó un(a) ${tipoContenido}: "${motivo.slice(0, 80)}"`,
      recurso: 'moderacion',
    });
    return reporte;
  },

  async listar(query) {
    const pag = parsePaginacion(query);
    const where = {
      ...(query.estado ? { estado: query.estado } : { estado: 'pendiente' }),
      ...(query.tipo ? { tipoContenido: query.tipo } : {}),
    };
    const [total, items] = await prisma.$transaction([
      prisma.reporte.count({ where }),
      prisma.reporte.findMany({
        where, skip: pag.skip, take: pag.limit, orderBy: { createdAt: 'desc' },
        include: {
          usuario: { select: USUARIO_PUBLICO_SELECT },
          resueltoPor: { select: { id: true, email: true } },
        },
      }),
    ]);
    const conContenido = await Promise.all(items.map(async (r) => ({
      id: r.id,
      tipoContenido: r.tipoContenido,
      contenidoId: r.contenidoId,
      motivo: r.motivo,
      estado: r.estado,
      resolucion: r.resolucion,
      resueltoEn: r.resueltoEn,
      createdAt: r.createdAt,
      reportadoPor: toUsuarioPublico(r.usuario),
      resueltoPor: r.resueltoPor?.email ?? null,
      contenido: await contenido(r.tipoContenido, r.contenidoId),
      totalReportes: await prisma.reporte.count({ where: { tipoContenido: r.tipoContenido, contenidoId: r.contenidoId } }),
    })));
    return pagina(conContenido, total, pag);
  },

  async resolver(id, adminId, { accion, resolucion }) {
    const r = await prisma.reporte.findUnique({ where: { id } });
    if (!r) throw new NotFoundError('Reporte no encontrado');
    if (r.estado !== 'pendiente') throw new ConflictError('Este reporte ya fue resuelto');

    if (accion === 'ocultar') await ocultar(r.tipoContenido, r.contenidoId);
    const afectados = await prisma.reporte.findMany({
      where: { tipoContenido: r.tipoContenido, contenidoId: r.contenidoId, estado: 'pendiente' },
      select: { reportadoPor: true },
    });
    await prisma.reporte.updateMany({
      where: { tipoContenido: r.tipoContenido, contenidoId: r.contenidoId, estado: 'pendiente' },
      data: { estado: accion === 'ocultar' ? 'resuelto' : 'ignorado', resolucion, resueltoPorId: adminId, resueltoEn: new Date() },
    });

    registrarAuditoria({ usuarioId: adminId, accion: `reporte_${accion}`, entidad: r.tipoContenido, entidadId: r.contenidoId, detalle: { resolucion } });
    for (const { reportadoPor } of afectados) {
      createNotification({
        usuarioId: reportadoPor,
        tipo: 'reporte_resuelto',
        titulo: 'Revisamos tu reporte',
        mensaje: accion === 'ocultar'
          ? 'Gracias. El contenido que reportaste fue retirado de la comunidad.'
          : 'Gracias por reportar. Tras revisarlo, el contenido cumple las normas de la comunidad.',
      });
    }
    if (accion === 'ocultar') {
      const autorId = await autorDe(r.tipoContenido, r.contenidoId);
      if (autorId) {
        createNotification({
          usuarioId: autorId,
          tipo: 'reporte_resuelto',
          titulo: 'Retiramos uno de tus contenidos',
          mensaje: `Un moderador ocultó tu ${r.tipoContenido} por incumplir las normas. Motivo: ${resolucion}`,
        });
      }
    }
    return { id, estado: accion === 'ocultar' ? 'resuelto' : 'ignorado' };
  },
};

module.exports = reporteService;
