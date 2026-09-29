const {
  prisma, parsePaginacion, pagina, uploadToStorage, deleteFromStorage, notificar, createNotification,
  registrarAuditoria, toCsv,
  NotFoundError, ForbiddenError, BadRequestError, ConflictError,
} = require('@brickbybrick/shared');
const eventoRepository = require('../repositories/evento.repository');
const perfilRepository = require('../repositories/perfil.repository');

/**
 * Estados de un evento:
 *   borrador → publicado → en_curso → finalizado
 *                  └──────────┴──────→ cancelado
 */
const TRANSICIONES = {
  borrador: ['publicado'],
  publicado: ['en_curso', 'cancelado'],
  en_curso: ['finalizado', 'cancelado'],
};

const ESTADOS_VISIBLES = ['publicado', 'en_curso', 'finalizado', 'cancelado'];
const fechaCorta = (d) => new Date(d).toLocaleString('es-CO', {
  timeZone: 'America/Bogota', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
});

function conCupos(evento) {
  const inscritos = evento._count?.inscripciones ?? 0;
  return {
    ...evento,
    inscritos,
    cuposDisponibles: evento.capacidadMaxima ? Math.max(0, evento.capacidadMaxima - inscritos) : null,
  };
}

async function constructoraDelUsuario(usuarioId) {
  const c = await perfilRepository.constructoraDe(usuarioId);
  if (!c) throw new ForbiddenError('Tu cuenta no tiene una empresa asociada');
  return c;
}

async function beneficiarioDelUsuario(usuarioId) {
  const b = await perfilRepository.beneficiarioDe(usuarioId);
  if (!b) throw new ForbiddenError('Solo los beneficiarios pueden inscribirse a eventos');
  return b;
}

async function propioOAdmin(id, caller) {
  const e = await eventoRepository.findById(id);
  if (!e) throw new NotFoundError('Evento no encontrado');
  if (caller.rol !== 'ADMINISTRADOR' && e.constructora.usuarioId !== caller.userId) {
    throw new ForbiddenError('No tienes permiso sobre este evento');
  }
  return e;
}

function validarPublicable(evento, constructora) {
  if (!constructora.verificada) throw new ForbiddenError('Tu empresa debe estar verificada para publicar eventos');
  if (new Date(evento.fechaInicio) <= new Date()) throw new BadRequestError('La fecha de inicio debe ser futura para publicar');
}

async function validarMateriales(constructoraId, materialIds) {
  if (!materialIds?.length) return;
  const propios = await eventoRepository.materialesPropios(constructoraId, materialIds);
  if (propios !== new Set(materialIds).size) throw new BadRequestError('Solo puedes asociar materiales publicados por tu empresa');
}

async function avisarEventoNuevo(evento) {
  notificar({
    usuarioIds: await eventoRepository.destinatariosEventoNuevo(evento),
    tipo: 'evento_nuevo',
    titulo: 'Nuevo evento cerca de ti',
    mensaje: `${evento.constructora.razonSocial} organiza "${evento.nombre}" el ${fechaCorta(evento.fechaInicio)}.`,
    recurso: 'evento',
    recursoId: evento.id,
  });
}

async function marcarInscripciones(eventos, caller) {
  if (caller?.rol !== 'BENEFICIARIO' || !eventos.length) return eventos;
  const b = await perfilRepository.beneficiarioDe(caller.userId);
  if (!b) return eventos;
  const propias = await eventoRepository.inscripcionesDe(b.id, eventos.map((e) => e.id));
  const mapa = new Map(propias.map((i) => [i.eventoId, i.estado]));
  return eventos.map((e) => ({ ...e, miInscripcion: mapa.get(e.id) ?? null }));
}

const eventoService = {
  TRANSICIONES,

  async listarPublico(filtros, caller) {
    const pag = parsePaginacion(filtros, { defaultLimit: 12 });
    const { total, items } = await eventoRepository.listarPublico(filtros, pag);
    return pagina(await marcarInscripciones(items.map(conCupos), caller), total, pag);
  },

  async listarMios(usuarioId, filtros) {
    const c = await constructoraDelUsuario(usuarioId);
    const pag = parsePaginacion(filtros);
    const { total, items } = await eventoRepository.listarDeConstructora(c.id, filtros, pag);
    return pagina(items.map(conCupos), total, pag);
  },

  async listarAdmin(filtros) {
    const pag = parsePaginacion(filtros);
    const { total, items } = await eventoRepository.listarAdmin(filtros, pag);
    return pagina(items.map(conCupos), total, pag);
  },

  async misInscripciones(usuarioId, filtros) {
    const b = await beneficiarioDelUsuario(usuarioId);
    const pag = parsePaginacion(filtros);
    const [total, items] = await eventoRepository.misInscripciones(b.id, filtros, pag);
    return pagina(items.map((i) => ({ ...i, evento: conCupos(i.evento) })), total, pag);
  },

  async obtener(id, caller) {
    const e = await eventoRepository.findById(id);
    if (!e) throw new NotFoundError('Evento no encontrado');
    const esDueno = caller && e.constructora.usuarioId === caller.userId;
    if (!ESTADOS_VISIBLES.includes(e.estado) && !esDueno && caller?.rol !== 'ADMINISTRADOR') {
      throw new NotFoundError('Evento no encontrado');
    }
    const [conInscripcion] = await marcarInscripciones([conCupos(e)], caller);
    return { ...conInscripcion, esPropio: Boolean(esDueno) };
  },

  async crear(usuarioId, data) {
    const c = await constructoraDelUsuario(usuarioId);
    const { materialIds = [], estado, ...campos } = data;
    await validarMateriales(c.id, materialIds);
    if (estado === 'publicado') validarPublicable(campos, c);

    const evento = await prisma.evento.create({
      data: {
        ...campos,
        constructoraId: c.id,
        estado,
        publicadoEn: estado === 'publicado' ? new Date() : null,
        materiales: { create: [...new Set(materialIds)].map((materialId) => ({ materialId })) },
      },
    });
    const completo = await eventoRepository.findById(evento.id);
    if (estado === 'publicado') avisarEventoNuevo(completo);
    return conCupos(completo);
  },

  async actualizar(id, caller, data) {
    const e = await propioOAdmin(id, caller);
    if (['finalizado', 'cancelado'].includes(e.estado)) {
      throw new BadRequestError(`No se puede editar un evento ${e.estado}`);
    }
    const { materialIds, ...campos } = data;
    const inicio = campos.fechaInicio ?? e.fechaInicio;
    const fin = campos.fechaFin ?? e.fechaFin;
    if (new Date(fin) <= new Date(inicio)) throw new BadRequestError('La fecha de fin debe ser posterior a la de inicio');
    if (campos.capacidadMaxima && campos.capacidadMaxima < e._count.inscripciones) {
      throw new BadRequestError(`Ya hay ${e._count.inscripciones} inscritos; la capacidad no puede ser menor`);
    }
    if (materialIds) await validarMateriales(e.constructora.id, materialIds);

    await prisma.$transaction(async (tx) => {
      await tx.evento.update({ where: { id }, data: campos });
      if (materialIds) {
        await tx.materialEvento.deleteMany({ where: { eventoId: id } });
        await tx.materialEvento.createMany({ data: [...new Set(materialIds)].map((materialId) => ({ eventoId: id, materialId })) });
      }
    });

    const cambiosRelevantes = ['fechaInicio', 'fechaFin', 'direccion', 'localidadId'].some((k) => campos[k] !== undefined
      && String(campos[k]) !== String(e[k]));
    if (e.estado === 'publicado' && cambiosRelevantes) {
      notificar({
        usuarioIds: await eventoRepository.usuariosInscritos(id),
        tipo: 'evento_actualizado',
        titulo: 'Cambió un evento al que estás inscrito',
        mensaje: `"${e.nombre}" ahora es el ${fechaCorta(inicio)}${campos.direccion ? ` en ${campos.direccion}` : ''}.`,
        recurso: 'evento',
        recursoId: id,
        email: true,
      });
    }
    if (caller.rol === 'ADMINISTRADOR') {
      registrarAuditoria({ usuarioId: caller.userId, accion: 'evento_editado', entidad: 'evento', entidadId: id, detalle: Object.keys(data) });
    }
    return conCupos(await eventoRepository.findById(id));
  },

  async cambiarEstado(id, caller, { estado, motivo }) {
    const e = await propioOAdmin(id, caller);
    if (!(TRANSICIONES[e.estado] || []).includes(estado)) {
      throw new BadRequestError(`No se puede pasar de "${e.estado}" a "${estado}"`);
    }
    const data = { estado };
    if (estado === 'publicado') {
      validarPublicable(e, await perfilRepository.constructoraDe(e.constructora.usuarioId));
      data.publicadoEn = new Date();
    }
    if (estado === 'cancelado') data.motivoCancelacion = motivo;

    await prisma.$transaction(async (tx) => {
      await tx.evento.update({ where: { id }, data });
      if (estado === 'finalizado') {
        // Si se tomó asistencia, quienes no fueron marcados quedan como "no asistió"
        const conAsistencia = await tx.inscripcionEvento.count({ where: { eventoId: id, estado: 'asistio' } });
        if (conAsistencia) {
          await tx.inscripcionEvento.updateMany({ where: { eventoId: id, estado: 'inscrito' }, data: { estado: 'no_asistio' } });
        }
      }
    });

    const actualizado = await eventoRepository.findById(id);
    if (estado === 'publicado') avisarEventoNuevo(actualizado);
    if (estado === 'cancelado') {
      notificar({
        usuarioIds: await eventoRepository.usuariosInscritos(id),
        tipo: 'evento_cancelado',
        titulo: 'Evento cancelado',
        mensaje: `"${e.nombre}" fue cancelado. Motivo: ${motivo}`,
        recurso: 'evento',
        recursoId: id,
        email: true,
      });
    }
    if (caller.rol === 'ADMINISTRADOR') {
      registrarAuditoria({ usuarioId: caller.userId, accion: `evento_${estado}`, entidad: 'evento', entidadId: id, detalle: { motivo } });
    }
    return conCupos(actualizado);
  },

  async eliminar(id, caller) {
    const e = await propioOAdmin(id, caller);
    if (e.estado !== 'borrador') throw new ConflictError('Solo se pueden eliminar borradores. Cancela el evento si ya fue publicado.');
    await prisma.evento.delete({ where: { id } });
    if (e.imagenUrl) deleteFromStorage(e.imagenUrl);
  },

  async actualizarImagen(id, caller, file) {
    const e = await propioOAdmin(id, caller);
    const imagenUrl = await uploadToStorage(file.buffer, 'eventos', file.originalname, file.mimetype);
    const actualizado = await eventoRepository.update(id, { imagenUrl });
    if (e.imagenUrl) deleteFromStorage(e.imagenUrl);
    return conCupos(actualizado);
  },

  /** Inscripción con bloqueo de la fila del evento para no exceder el cupo. */
  async inscribirse(eventoId, usuarioId) {
    const b = await beneficiarioDelUsuario(usuarioId);

    const inscripcion = await prisma.$transaction(async (tx) => {
      const [evento] = await tx.$queryRaw`
        SELECT id, estado, capacidad_maxima AS "capacidadMaxima", fecha_fin AS "fechaFin"
        FROM eventos WHERE id = ${eventoId}::uuid FOR UPDATE`;
      if (!evento) throw new NotFoundError('Evento no encontrado');
      if (!['publicado', 'en_curso'].includes(evento.estado) || new Date(evento.fechaFin) < new Date()) {
        throw new BadRequestError('Este evento no admite inscripciones');
      }

      const existente = await tx.inscripcionEvento.findUnique({
        where: { eventoId_beneficiarioId: { eventoId, beneficiarioId: b.id } },
      });
      if (existente && existente.estado !== 'cancelada') throw new ConflictError('Ya estás inscrito en este evento');

      if (evento.capacidadMaxima) {
        const vigentes = await tx.inscripcionEvento.count({ where: { eventoId, estado: { in: ['inscrito', 'asistio'] } } });
        if (vigentes >= evento.capacidadMaxima) throw new ConflictError('El evento ya no tiene cupos disponibles');
      }

      return existente
        ? tx.inscripcionEvento.update({ where: { id: existente.id }, data: { estado: 'inscrito', fechaInscripcion: new Date(), fechaCancelacion: null } })
        : tx.inscripcionEvento.create({ data: { eventoId, beneficiarioId: b.id } });
    });

    const e = await eventoRepository.findById(eventoId);
    const inscritos = e._count.inscripciones;
    createNotification({
      usuarioId,
      tipo: 'evento_inscripcion',
      titulo: 'Inscripción confirmada',
      mensaje: `Te inscribiste a "${e.nombre}" (${fechaCorta(e.fechaInicio)}${e.direccion ? `, ${e.direccion}` : ''}).`,
      recurso: 'evento',
      recursoId: eventoId,
      email: true,
    });
    createNotification({
      usuarioId: e.constructora.usuarioId,
      tipo: 'evento_inscripcion',
      titulo: 'Nueva inscripción',
      mensaje: `${b.nombreCompleto} se inscribió a "${e.nombre}"${e.capacidadMaxima ? ` (${inscritos}/${e.capacidadMaxima})` : ''}.`,
      recurso: 'evento',
      recursoId: eventoId,
    });
    if (e.capacidadMaxima && inscritos / e.capacidadMaxima >= 0.9 && (inscritos - 1) / e.capacidadMaxima < 0.9) {
      createNotification({
        usuarioId: e.constructora.usuarioId,
        tipo: 'evento_cupos_bajos',
        titulo: 'Cupos casi agotados',
        mensaje: `"${e.nombre}" ya ocupó el 90% de sus cupos.`,
        recurso: 'evento',
        recursoId: eventoId,
      });
    }
    return inscripcion;
  },

  async cancelarInscripcion(eventoId, usuarioId) {
    const b = await beneficiarioDelUsuario(usuarioId);
    const inscripcion = await prisma.inscripcionEvento.findUnique({
      where: { eventoId_beneficiarioId: { eventoId, beneficiarioId: b.id } },
      include: { evento: { select: { estado: true, nombre: true } } },
    });
    if (!inscripcion || inscripcion.estado !== 'inscrito') throw new NotFoundError('No tienes una inscripción activa en este evento');
    if (!['publicado', 'en_curso'].includes(inscripcion.evento.estado)) {
      throw new BadRequestError('El evento ya no admite cambios de inscripción');
    }
    await prisma.inscripcionEvento.update({
      where: { id: inscripcion.id },
      data: { estado: 'cancelada', fechaCancelacion: new Date() },
    });
  },

  async inscritos(eventoId, caller, estado) {
    await propioOAdmin(eventoId, caller);
    return eventoRepository.inscritos(eventoId, estado);
  },

  async marcarAsistencia(eventoId, caller, inscripciones) {
    const e = await propioOAdmin(eventoId, caller);
    if (!['publicado', 'en_curso', 'finalizado'].includes(e.estado)) {
      throw new BadRequestError('Solo se registra asistencia en eventos publicados, en curso o finalizados');
    }
    if (new Date(e.fechaInicio).getTime() - Date.now() > 24 * 60 * 60 * 1000) {
      throw new BadRequestError('La asistencia se registra desde el día del evento');
    }
    const ids = inscripciones.map((i) => i.id);
    const propias = await prisma.inscripcionEvento.count({
      where: { id: { in: ids }, eventoId, estado: { not: 'cancelada' } },
    });
    if (propias !== new Set(ids).size) throw new BadRequestError('Alguna inscripción no pertenece a este evento');

    await prisma.$transaction(inscripciones.map((i) => prisma.inscripcionEvento.update({
      where: { id: i.id },
      data: { estado: i.asistio ? 'asistio' : e.estado === 'finalizado' ? 'no_asistio' : 'inscrito' },
    })));
    return eventoRepository.inscritos(eventoId);
  },

  async exportarInscritos(eventoId, caller) {
    const e = await propioOAdmin(eventoId, caller);
    const filas = await eventoRepository.inscritos(eventoId);
    const ESTADOS = { inscrito: 'Inscrito', asistio: 'Asistió', no_asistio: 'No asistió', cancelada: 'Cancelada' };
    return {
      nombre: `inscritos-${e.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.csv`,
      csv: toCsv(filas.map((i) => ({
        nombre: i.beneficiario.nombreCompleto,
        cedula: i.beneficiario.cedula,
        telefono: i.beneficiario.usuario.telefono ?? '',
        email: i.beneficiario.usuario.email,
        localidad: i.beneficiario.localidad?.nombre ?? '',
        fecha_inscripcion: i.fechaInscripcion.toISOString(),
        estado: ESTADOS[i.estado],
      }))),
    };
  },
};

module.exports = eventoService;
