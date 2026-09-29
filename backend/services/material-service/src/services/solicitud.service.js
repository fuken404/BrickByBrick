const {
  prisma, parsePaginacion, pagina, createNotification, registrarAuditoria, configSistema, escapeHtml,
  NotFoundError, ForbiddenError, BadRequestError, ConflictError,
} = require('@brickbybrick/shared');
const solicitudRepository = require('../repositories/solicitud.repository');
const materialRepository = require('../repositories/material.repository');
const constructoraRepository = require('../repositories/constructora.repository');
const beneficiarioRepository = require('../repositories/beneficiario.repository');

/**
 * Máquina de estados de una solicitud de material.
 *
 *   pendiente ──aprobar──▶ aprobada ──entregar──▶ entregada ──(beneficiario confirma recepción)
 *       │                      │
 *       ├──rechazar──▶ rechazada
 *       └──cancelar──▶ cancelada ◀──cancelar── (repone stock)
 *
 * El stock se descuenta al APROBAR (reserva) y se repone si una aprobada se cancela.
 */
const TRANSICIONES_CONSTRUCTORA = {
  pendiente: ['aprobada', 'rechazada'],
  aprobada: ['entregada', 'cancelada'],
};

const cantidadTexto = (s) => `${Number(s.cantidadSolicitada)} ${s.material.unidadMedida}`;

async function beneficiarioDelUsuario(usuarioId) {
  const b = await beneficiarioRepository.findByUsuarioId(usuarioId);
  if (!b) throw new ForbiddenError('Solo los beneficiarios pueden realizar esta acción');
  return b;
}

async function cargar(id) {
  const s = await solicitudRepository.findById(id);
  if (!s) throw new NotFoundError('Solicitud no encontrada');
  return s;
}

/** Reserva stock de forma atómica; falla si no alcanza (evita sobre-asignación). */
async function reservarStock(tx, materialId, cantidad) {
  const { count } = await tx.material.updateMany({
    where: { id: materialId, cantidad: { gte: cantidad } },
    data: { cantidad: { decrement: cantidad } },
  });
  if (!count) throw new ConflictError('No hay suficiente cantidad disponible para aprobar esta solicitud');
  const m = await tx.material.findUnique({ where: { id: materialId }, select: { cantidad: true, estadoPublicacion: true } });
  if (Number(m.cantidad) <= 0 && m.estadoPublicacion === 'activo') {
    await tx.material.update({ where: { id: materialId }, data: { estadoPublicacion: 'agotado' } });
  }
}

async function liberarStock(tx, materialId, cantidad) {
  const m = await tx.material.update({
    where: { id: materialId },
    data: { cantidad: { increment: cantidad } },
    select: { estadoPublicacion: true },
  });
  if (m.estadoPublicacion === 'agotado') {
    await tx.material.update({ where: { id: materialId }, data: { estadoPublicacion: 'activo' } });
  }
}

async function siguienteConstancia(tx) {
  const [{ n }] = await tx.$queryRaw`SELECT nextval('constancia_donacion_seq') AS n`;
  return `BBB-${new Date().getFullYear()}-${String(n).padStart(6, '0')}`;
}

const solicitudService = {
  TRANSICIONES_CONSTRUCTORA,

  async listarMias(usuarioId, filtros) {
    const b = await beneficiarioDelUsuario(usuarioId);
    const pag = parsePaginacion(filtros);
    const [{ total, items }, resumen] = await Promise.all([
      solicitudRepository.listarBeneficiario(b.id, filtros, pag),
      solicitudRepository.contarPorEstado({ beneficiarioId: b.id }),
    ]);
    return { ...pagina(items, total, pag), resumen };
  },

  async listarRecibidas(usuarioId, filtros) {
    const c = await constructoraRepository.findByUsuarioId(usuarioId);
    if (!c) throw new ForbiddenError('Tu cuenta no tiene una empresa asociada');
    const pag = parsePaginacion(filtros);
    const [{ total, items }, resumen] = await Promise.all([
      solicitudRepository.listarConstructora(c.id, filtros, pag),
      solicitudRepository.contarPorEstado({ material: { constructoraId: c.id } }),
    ]);
    // El contacto del beneficiario solo se comparte cuando la solicitud fue aprobada
    const protegidos = items.map((s) => (['aprobada', 'entregada'].includes(s.estado)
      ? s
      : { ...s, beneficiario: { ...s.beneficiario, cedula: null, usuario: null } }));
    return { ...pagina(protegidos, total, pag), resumen };
  },

  async listarAdmin(filtros) {
    const pag = parsePaginacion(filtros);
    const [{ total, items }, resumen] = await Promise.all([
      solicitudRepository.listarAdmin(filtros, pag),
      solicitudRepository.contarPorEstado({}),
    ]);
    return { ...pagina(items, total, pag), resumen };
  },

  async listarPorMaterial(materialId, caller, filtros) {
    const m = await materialRepository.findById(materialId);
    if (!m) throw new NotFoundError('Material no encontrado');
    if (caller.rol !== 'ADMINISTRADOR' && m.constructora.usuarioId !== caller.userId) {
      throw new ForbiddenError('No tienes permiso sobre este material');
    }
    return this.listarRecibidas(m.constructora.usuarioId, { ...filtros, materialId });
  },

  async crear(materialId, usuarioId, data) {
    const b = await beneficiarioDelUsuario(usuarioId);
    const m = await materialRepository.findById(materialId);
    if (!m || m.eliminadoEn || m.estadoPublicacion !== 'activo' || !m.constructora.verificada) {
      throw new BadRequestError('El material no está disponible para solicitudes');
    }
    if (m.fechaLimite && new Date(m.fechaLimite) < materialRepository.inicioHoyBogota()) {
      throw new BadRequestError('El plazo para solicitar este material ya terminó');
    }
    if (data.cantidadSolicitada > Number(m.cantidad)) {
      throw new BadRequestError(`Solo hay ${Number(m.cantidad)} ${m.unidadMedida} disponibles`);
    }
    const limite = Number(await configSistema.obtenerParametro('maxSolicitudesActivasBeneficiario'));

    // Las comprobaciones y la creación van en una transacción con bloqueo para
    // que dos envíos simultáneos no dupliquen la solicitud ni superen los límites.
    const solicitud = await prisma.$transaction(async (tx) => {
      await solicitudRepository.bloquearParaSolicitud(tx, materialId, b.id);
      if (await solicitudRepository.activaDeBeneficiario(materialId, b.id, tx)) {
        throw new ConflictError('Ya tienes una solicitud activa para este material');
      }
      if ((await solicitudRepository.contarActivasBeneficiario(b.id, tx)) >= limite) {
        throw new ConflictError(`Puedes tener máximo ${limite} solicitudes activas. Espera respuesta o cancela alguna.`);
      }
      if (m.maxSolicitudes && (await materialRepository.contarSolicitudesActivas(materialId, tx)) >= m.maxSolicitudes) {
        throw new ConflictError('Este material ya alcanzó el máximo de solicitudes que la empresa puede atender');
      }
      return solicitudRepository.create({
        materialId,
        beneficiarioId: b.id,
        cantidadSolicitada: data.cantidadSolicitada,
        propositoUso: data.propositoUso,
        descripcionProyecto: data.descripcionProyecto ?? null,
      }, tx);
    });

    createNotification({
      usuarioId: m.constructora.usuarioId,
      tipo: 'solicitud_nueva',
      titulo: 'Nueva solicitud de material',
      mensaje: `${b.nombreCompleto} solicitó ${data.cantidadSolicitada} ${m.unidadMedida} de "${m.nombre}".`,
      recurso: 'solicitud',
      recursoId: solicitud.id,
    });
    return solicitud;
  },

  /** Transiciones que ejecuta la constructora (o el administrador). */
  async cambiarEstado(id, caller, { estado, instruccionesRetiro, motivo }) {
    const s = await cargar(id);
    const esDueno = s.material.constructora.usuarioId === caller.userId;
    if (caller.rol !== 'ADMINISTRADOR' && !esDueno) throw new ForbiddenError('No tienes permiso sobre esta solicitud');

    const permitidas = TRANSICIONES_CONSTRUCTORA[s.estado] || [];
    if (!permitidas.includes(estado)) {
      throw new BadRequestError(`No se puede pasar de "${s.estado}" a "${estado}"`);
    }

    const cantidad = Number(s.cantidadSolicitada);
    const ahora = new Date();

    const actualizada = await prisma.$transaction(async (tx) => {
      const data = { estado };
      if (estado === 'aprobada') {
        await reservarStock(tx, s.materialId, cantidad);
        Object.assign(data, { fechaRespuesta: ahora, instruccionesRetiro });
      }
      if (estado === 'rechazada') Object.assign(data, { fechaRespuesta: ahora, motivoRechazo: motivo });
      if (estado === 'cancelada') {
        await liberarStock(tx, s.materialId, cantidad);
        Object.assign(data, { fechaCancelacion: ahora, motivoRechazo: motivo });
      }
      if (estado === 'entregada') {
        const valorUnitario = s.material.valorUnitarioCop ? Number(s.material.valorUnitarioCop) : 0;
        Object.assign(data, {
          fechaEntrega: ahora,
          valorDonadoCop: Math.round(cantidad * valorUnitario * 100) / 100,
          numeroConstancia: await siguienteConstancia(tx),
        });
      }
      // Guarda optimista: el estado no cambió entre la lectura y la escritura
      const { count } = await tx.solicitudMaterial.updateMany({ where: { id, estado: s.estado }, data });
      if (!count) throw new ConflictError('La solicitud cambió mientras la procesabas. Recarga e inténtalo de nuevo.');
      return tx.solicitudMaterial.findUnique({ where: { id }, include: solicitudRepository.INCLUDE_CONSTRUCTORA });
    });

    const mensajes = {
      aprobada: {
        tipo: 'solicitud_aprobada', titulo: '¡Tu solicitud fue aprobada!',
        mensaje: `${s.material.constructora.razonSocial} aprobó ${cantidadTexto(s)} de "${s.material.nombre}". Revisa las instrucciones de retiro.`,
        cuerpo: `<p>${escapeHtml(s.material.constructora.razonSocial)} aprobó tu solicitud de <strong>${escapeHtml(cantidadTexto(s))}</strong> de <strong>${escapeHtml(s.material.nombre)}</strong>.</p><p><strong>Instrucciones de retiro:</strong><br>${escapeHtml(instruccionesRetiro)}</p>`,
      },
      rechazada: {
        tipo: 'solicitud_rechazada', titulo: 'Tu solicitud no fue aprobada',
        mensaje: `La solicitud de "${s.material.nombre}" fue rechazada. Motivo: ${motivo}`,
      },
      cancelada: {
        tipo: 'solicitud_cancelada', titulo: 'La constructora canceló tu solicitud',
        mensaje: `La solicitud aprobada de "${s.material.nombre}" fue cancelada. Motivo: ${motivo}`,
      },
      entregada: {
        tipo: 'solicitud_entregada', titulo: 'Material entregado',
        mensaje: `Se registró la entrega de "${s.material.nombre}". Confirma la recepción y califica la donación.`,
      },
    }[estado];

    createNotification({
      usuarioId: s.beneficiario.usuarioId,
      tipo: mensajes.tipo,
      titulo: mensajes.titulo,
      mensaje: mensajes.mensaje,
      recurso: 'solicitud',
      recursoId: id,
      email: estado === 'entregada' ? false : { cuerpoHtml: mensajes.cuerpo, cta: 'Ver mi solicitud' },
    });
    if (caller.rol === 'ADMINISTRADOR') {
      registrarAuditoria({ usuarioId: caller.userId, accion: `solicitud_${estado}`, entidad: 'solicitud', entidadId: id, detalle: { motivo } });
    }
    return actualizada;
  },

  /** El beneficiario cancela su propia solicitud (pendiente o aprobada). */
  async cancelarPropia(id, usuarioId, { motivo }) {
    const b = await beneficiarioDelUsuario(usuarioId);
    const s = await cargar(id);
    if (s.beneficiarioId !== b.id) throw new ForbiddenError('No tienes permiso sobre esta solicitud');
    if (!['pendiente', 'aprobada'].includes(s.estado)) {
      throw new BadRequestError(`No se puede cancelar una solicitud ${s.estado}`);
    }

    await prisma.$transaction(async (tx) => {
      if (s.estado === 'aprobada') await liberarStock(tx, s.materialId, Number(s.cantidadSolicitada));
      const { count } = await tx.solicitudMaterial.updateMany({
        where: { id, estado: s.estado },
        data: { estado: 'cancelada', fechaCancelacion: new Date(), motivoRechazo: motivo || 'Cancelada por el beneficiario' },
      });
      if (!count) throw new ConflictError('La solicitud cambió. Recarga e inténtalo de nuevo.');
    });

    createNotification({
      usuarioId: s.material.constructora.usuarioId,
      tipo: 'solicitud_cancelada',
      titulo: 'Un beneficiario canceló su solicitud',
      mensaje: `${s.beneficiario.nombreCompleto} canceló la solicitud de "${s.material.nombre}".`,
      recurso: 'solicitud',
      recursoId: id,
    });
    return solicitudRepository.findDetalle(id, solicitudRepository.INCLUDE_BENEFICIARIO);
  },

  async confirmarRecepcion(id, usuarioId, data) {
    const b = await beneficiarioDelUsuario(usuarioId);
    const s = await cargar(id);
    if (s.beneficiarioId !== b.id) throw new ForbiddenError('No tienes permiso sobre esta solicitud');
    if (s.estado !== 'entregada') throw new BadRequestError('Solo puedes confirmar solicitudes entregadas');
    if (s.fechaConfirmacion) throw new ConflictError('Ya confirmaste la recepción');

    await solicitudRepository.update(id, {
      fechaConfirmacion: new Date(),
      ...(data.calificacion ? { calificacion: data.calificacion, comentarioCalificacion: data.comentarioCalificacion ?? null } : {}),
    });
    createNotification({
      usuarioId: s.material.constructora.usuarioId,
      tipo: 'recepcion_confirmada',
      titulo: 'Recepción confirmada',
      mensaje: `${b.nombreCompleto} confirmó que recibió "${s.material.nombre}"${data.calificacion ? ` y calificó la donación con ${data.calificacion}/5` : ''}.`,
      recurso: 'solicitud',
      recursoId: id,
    });
    return solicitudRepository.findDetalle(id, solicitudRepository.INCLUDE_BENEFICIARIO);
  },

  async calificar(id, usuarioId, data) {
    const b = await beneficiarioDelUsuario(usuarioId);
    const s = await cargar(id);
    if (s.beneficiarioId !== b.id) throw new ForbiddenError('No tienes permiso sobre esta solicitud');
    if (s.estado !== 'entregada') throw new BadRequestError('Solo se pueden calificar entregas completadas');
    if (s.calificacion) throw new ConflictError('Ya calificaste esta entrega');
    await solicitudRepository.update(id, {
      calificacion: data.calificacion,
      comentarioCalificacion: data.comentarioCalificacion ?? null,
      fechaConfirmacion: s.fechaConfirmacion ?? new Date(),
    });
    return solicitudRepository.findDetalle(id, solicitudRepository.INCLUDE_BENEFICIARIO);
  },

  /** Detalle para cualquiera de las partes o el administrador. */
  async obtener(id, caller) {
    const s = await cargar(id);
    const esBeneficiario = s.beneficiario.usuarioId === caller.userId;
    const esConstructora = s.material.constructora.usuarioId === caller.userId;
    if (!esBeneficiario && !esConstructora && caller.rol !== 'ADMINISTRADOR') {
      throw new ForbiddenError('No tienes permiso sobre esta solicitud');
    }
    return solicitudRepository.findDetalle(id, esBeneficiario ? solicitudRepository.INCLUDE_BENEFICIARIO : solicitudRepository.INCLUDE_CONSTRUCTORA);
  },
};

module.exports = solicitudService;
