const {
  prisma, parsePaginacion, pagina, createNotification, registrarAuditoria, configSistema, toCsv,
  NotFoundError, BadRequestError, ForbiddenError,
} = require('@brickbybrick/shared');
const usuarioRepository = require('../repositories/usuario.repository');
const constructoraRepository = require('../repositories/constructora.repository');
const metricasRepository = require('../repositories/metricas.repository');

const adminService = {
  async listarUsuarios(query) {
    const pag = parsePaginacion(query);
    const { total, items } = await usuarioRepository.listarAdmin(query, pag);
    return pagina(items, total, pag);
  },

  async cambiarEstadoUsuario(adminId, usuarioId, { estado, motivo }) {
    if (adminId === usuarioId) throw new BadRequestError('No puedes cambiar el estado de tu propia cuenta');
    const u = await usuarioRepository.findById(usuarioId);
    if (!u) throw new NotFoundError('Usuario no encontrado');
    if (u.rol === 'ADMINISTRADOR') throw new ForbiddenError('No se puede suspender a otro administrador');
    if (u.estado === 'inactivo') throw new BadRequestError('La cuenta fue eliminada por su titular');

    await usuarioRepository.update(usuarioId, { estado });
    if (estado === 'suspendido') await usuarioRepository.revocarSesiones(usuarioId);

    registrarAuditoria({ usuarioId: adminId, accion: `usuario_${estado}`, entidad: 'usuario', entidadId: usuarioId, detalle: { motivo } });
    if (estado === 'activo') {
      createNotification({
        usuarioId, tipo: 'cuenta', titulo: 'Tu cuenta fue reactivada',
        mensaje: 'Ya puedes volver a usar BrickByBrick con normalidad.', email: true,
      });
    } else {
      // La notificación in-app no llega a cuentas suspendidas: se informa por correo
      const { sendEmail, plantillaCorreo, escapeHtml } = require('@brickbybrick/shared');
      sendEmail({
        to: u.email,
        subject: 'Tu cuenta fue suspendida — BrickByBrick',
        html: plantillaCorreo({
          titulo: 'Tu cuenta fue suspendida',
          cuerpoHtml: `<p>Motivo: ${escapeHtml(motivo)}</p><p>Si crees que es un error, responde a este correo.</p>`,
        }),
      }).catch(() => {});
    }
    return { id: usuarioId, estado };
  },

  async verificarConstructora(adminId, constructoraId, { aprobar, motivo }) {
    const c = await constructoraRepository.findRaw(constructoraId);
    if (!c) throw new NotFoundError('Constructora no encontrada');

    const actualizado = await prisma.$transaction(async (tx) => {
      if (aprobar) {
        await tx.documentoEmpresa.updateMany({
          where: { constructoraId, estado: 'pendiente' },
          data: { estado: 'aprobado', revisadoEn: new Date() },
        });
      }
      return tx.constructora.update({
        where: { id: constructoraId },
        data: aprobar
          ? { verificada: true, fechaVerificacion: new Date(), motivoRechazo: null }
          : { verificada: false, fechaVerificacion: null, motivoRechazo: motivo },
        select: constructoraRepository.FULL_SELECT,
      });
    });

    registrarAuditoria({
      usuarioId: adminId, accion: aprobar ? 'constructora_verificada' : 'constructora_rechazada',
      entidad: 'constructora', entidadId: constructoraId, detalle: { motivo },
    });
    createNotification({
      usuarioId: c.usuarioId,
      tipo: 'verificacion',
      titulo: aprobar ? '¡Tu empresa fue verificada!' : 'La verificación de tu empresa requiere cambios',
      mensaje: aprobar
        ? 'Ya puedes publicar materiales, crear eventos y generar constancias tributarias.'
        : `Motivo: ${motivo}. Actualiza tus documentos desde tu perfil.`,
      recurso: 'constructora',
      email: true,
    });
    return actualizado;
  },

  async revisarDocumento(adminId, documentoId, { estado, motivo, fechaVencimiento }) {
    const doc = await constructoraRepository.findDocumento(documentoId);
    if (!doc) throw new NotFoundError('Documento no encontrado');
    const actualizado = await constructoraRepository.updateDocumento(documentoId, {
      estado,
      motivoRechazo: estado === 'rechazado' ? motivo : null,
      revisadoEn: new Date(),
      ...(fechaVencimiento ? { fechaVencimiento: new Date(fechaVencimiento) } : {}),
    });
    registrarAuditoria({ usuarioId: adminId, accion: `documento_${estado}`, entidad: 'documento', entidadId: documentoId, detalle: { motivo } });
    createNotification({
      usuarioId: doc.constructora.usuarioId,
      tipo: 'documento_revisado',
      titulo: estado === 'aprobado' ? 'Documento aprobado' : 'Documento rechazado',
      mensaje: estado === 'aprobado'
        ? `Tu ${doc.tipo === 'rut' ? 'RUT' : 'Cámara de Comercio'} fue aprobado.`
        : `Tu ${doc.tipo === 'rut' ? 'RUT' : 'Cámara de Comercio'} fue rechazado: ${motivo}`,
      recurso: 'constructora',
    });
    return actualizado;
  },

  obtenerConfiguracion() {
    configSistema.invalidarConfiguracion();
    return configSistema.obtenerConfiguracion();
  },

  async guardarConfiguracion(adminId, cambios) {
    await prisma.$transaction(Object.entries(cambios).map(([clave, valor]) =>
      prisma.configuracionSistema.upsert({ where: { clave }, update: { valor }, create: { clave, valor } })));
    configSistema.invalidarConfiguracion();
    registrarAuditoria({ usuarioId: adminId, accion: 'configuracion_actualizada', entidad: 'configuracion', detalle: cambios });
    return configSistema.obtenerConfiguracion();
  },

  async auditoria(query) {
    const pag = parsePaginacion(query, { defaultLimit: 50 });
    const [total, items] = await metricasRepository.auditoria(query, pag);
    return pagina(items, total, pag);
  },

  async dashboard() {
    const [conteos, impacto, porEstado, series] = await Promise.all([
      metricasRepository.conteos(),
      metricasRepository.impacto(),
      metricasRepository.solicitudesPorEstado(),
      metricasRepository.seriesMensuales(6),
    ]);
    return { ...conteos, ...impacto, solicitudesPorEstado: porEstado, series };
  },

  async metricas({ dias = 30 } = {}) {
    const desde = new Date(Date.now() - Number(dias) * 24 * 60 * 60 * 1000);
    const cfg = await configSistema.obtenerConfiguracion();
    const [ipe, tpa, tea, impacto, topConstructoras, topCategorias, series] = await Promise.all([
      metricasRepository.ipe(),
      metricasRepository.tpa(),
      metricasRepository.tea(desde),
      metricasRepository.impacto(),
      metricasRepository.topConstructoras(),
      metricasRepository.topCategorias(),
      metricasRepository.seriesMensuales(12),
    ]);
    return {
      periodoTeaDias: Number(dias),
      ipe,
      tpa,
      tea,
      impacto: {
        ...impacto,
        descuentoEstimadoCop: Math.round(impacto.valorDonadoCop * (Number(cfg.porcentajeDescuentoTributario) / 100)),
      },
      topConstructoras,
      topCategorias,
      series,
    };
  },

  async exportar(tipo) {
    if (tipo === 'solicitudes') {
      const filas = await prisma.solicitudMaterial.findMany({
        orderBy: { fechaSolicitud: 'desc' },
        include: {
          material: { select: { nombre: true, unidadMedida: true, constructora: { select: { razonSocial: true } }, categoria: { select: { nombre: true } } } },
          beneficiario: { select: { nombreCompleto: true, localidad: { select: { nombre: true } } } },
        },
      });
      return toCsv(filas.map((s) => ({
        id: s.id, fecha_solicitud: s.fechaSolicitud.toISOString(), estado: s.estado,
        material: s.material.nombre, categoria: s.material.categoria.nombre, constructora: s.material.constructora.razonSocial,
        beneficiario: s.beneficiario.nombreCompleto, localidad: s.beneficiario.localidad?.nombre ?? '',
        cantidad: String(s.cantidadSolicitada), unidad: s.material.unidadMedida,
        fecha_entrega: s.fechaEntrega?.toISOString() ?? '', valor_donado_cop: s.valorDonadoCop ? String(s.valorDonadoCop) : '',
        constancia: s.numeroConstancia ?? '', calificacion: s.calificacion ?? '',
      })));
    }
    if (tipo === 'usuarios') {
      const filas = await prisma.usuario.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, rol: true, estado: true, createdAt: true, ultimoLogin: true,
          beneficiario: { select: { nombreCompleto: true, estrato: true, localidad: { select: { nombre: true } } } },
          constructora: { select: { razonSocial: true, verificada: true, localidad: { select: { nombre: true } } } },
        },
      });
      // Sin email, cédula ni NIT: el reporte es estadístico (Ley 1581)
      return toCsv(filas.map((u) => ({
        id: u.id, rol: u.rol, estado: u.estado, registro: u.createdAt.toISOString(),
        ultimo_login: u.ultimoLogin?.toISOString() ?? '',
        nombre: u.beneficiario?.nombreCompleto ?? u.constructora?.razonSocial ?? '',
        estrato: u.beneficiario?.estrato ?? '',
        localidad: u.beneficiario?.localidad?.nombre ?? u.constructora?.localidad?.nombre ?? '',
        verificada: u.constructora ? (u.constructora.verificada ? 'si' : 'no') : '',
      })));
    }
    if (tipo === 'eventos') {
      const filas = await prisma.evento.findMany({
        orderBy: { fechaInicio: 'desc' },
        include: {
          constructora: { select: { razonSocial: true } },
          localidad: { select: { nombre: true } },
          inscripciones: { select: { estado: true } },
        },
      });
      return toCsv(filas.map((e) => {
        const vigentes = e.inscripciones.filter((i) => ['inscrito', 'asistio'].includes(i.estado)).length;
        return {
          id: e.id, nombre: e.nombre, tipo: e.tipoEvento, estado: e.estado, constructora: e.constructora.razonSocial,
          localidad: e.localidad?.nombre ?? '', fecha_inicio: e.fechaInicio.toISOString(),
          cupos: e.capacidadMaxima ?? '', inscripciones: vigentes,
          asistentes: e.inscripciones.filter((i) => i.estado === 'asistio').length,
          ipe_pct: e.capacidadMaxima ? Math.round((vigentes / e.capacidadMaxima) * 1000) / 10 : '',
        };
      }));
    }
    throw new BadRequestError('Tipo de exportación inválido (solicitudes | usuarios | eventos)');
  },

  estadisticasPublicas() {
    return metricasRepository.publicas();
  },
};

module.exports = adminService;
