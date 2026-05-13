const { prisma, createNotification, sendEmail } = require('@brickbybrick/shared');

const EVENTO_INCLUDE = {
  constructora: { select: { id: true, razonSocial: true, logoUrl: true } },
  localidad:    { select: { id: true, nombre: true } },
  _count:       { select: { inscripciones: true } },
};

class EventoService {
  async findAll({ page = 1, limit = 20, tipoEvento, localidadId, estado } = {}) {
    const where = { estado: estado || 'publicado' };
    if (tipoEvento)  where.tipoEvento  = tipoEvento;
    if (localidadId) where.localidadId = Number(localidadId);

    const [total, items] = await Promise.all([
      prisma.evento.count({ where }),
      prisma.evento.findMany({
        where,
        include: EVENTO_INCLUDE,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { fechaInicio: 'asc' },
      }),
    ]);
    return { total, page: Number(page), limit: Number(limit), items };
  }

  async findByConstructora(callerId, { page = 1, limit = 20, estado } = {}) {
    const constructora = await prisma.constructora.findUnique({ where: { usuarioId: callerId } });
    if (!constructora) throw { status: 403, message: 'Sin perfil de constructora' };

    const where = { constructoraId: constructora.id };
    if (estado) where.estado = estado;

    const [total, items] = await Promise.all([
      prisma.evento.count({ where }),
      prisma.evento.findMany({
        where,
        include: EVENTO_INCLUDE,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { fechaInicio: 'desc' },
      }),
    ]);
    return { total, page: Number(page), limit: Number(limit), items };
  }

  async findById(id) {
    const e = await prisma.evento.findUnique({ where: { id }, include: { ...EVENTO_INCLUDE, materiales: { include: { material: true } } } });
    if (!e) throw { status: 404, message: 'Evento no encontrado' };
    return e;
  }

  async create(callerId, data) {
    const constructora = await prisma.constructora.findUnique({ where: { usuarioId: callerId } });
    if (!constructora) throw { status: 403, message: 'No tienes una empresa registrada' };

    return prisma.evento.create({
      data: {
        constructoraId:  constructora.id,
        nombre:          data.nombre,
        tipoEvento:      data.tipoEvento,
        descripcion:     data.descripcion  || null,
        fechaInicio:     new Date(data.fechaInicio),
        fechaFin:        new Date(data.fechaFin),
        direccion:       data.direccion    || null,
        localidadId:     data.localidadId  || null,
        capacidadMaxima: data.capacidadMaxima || null,
        estado:          'borrador',
      },
      include: EVENTO_INCLUDE,
    });
  }

  async update(id, callerId, callerRol, data) {
    await this._ownOrAdmin(id, callerId, callerRol);

    return prisma.evento.update({
      where: { id },
      data:  {
        ...data,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        fechaFin:    data.fechaFin    ? new Date(data.fechaFin)    : undefined,
      },
      include: EVENTO_INCLUDE,
    });
  }

  async remove(id, callerId, callerRol) {
    const evento = await this._ownOrAdmin(id, callerId, callerRol);

    // Notificar inscritos si el evento estaba publicado
    if (evento.estado === 'publicado') {
      const inscritos = await prisma.inscripcionEvento.findMany({
        where:   { eventoId: id },
        include: { beneficiario: { include: { usuario: { select: { id: true } } } } },
      });

      await Promise.allSettled(
        inscritos.map((i) =>
          createNotification({
            usuarioId:  i.beneficiario.usuario.id,
            tipo:       'evento_inscripcion',
            titulo:     'Evento cancelado',
            mensaje:    `El evento "${evento.nombre}" fue cancelado.`,
            urlDestino: '/eventos',
          })
        )
      );
    }

    await prisma.evento.delete({ where: { id } });
  }

  // ------------------------------------------------------------------
  async getInscritos(id, callerId, callerRol) {
    await this._ownOrAdmin(id, callerId, callerRol);
    return prisma.inscripcionEvento.findMany({
      where:   { eventoId: id },
      include: { beneficiario: { select: { id: true, nombreCompleto: true, cedula: true, usuario: { select: { email: true } } } } },
      orderBy: { fechaInscripcion: 'asc' },
    });
  }

  async inscribirse(eventoId, callerId) {
    const beneficiario = await prisma.beneficiario.findUnique({ where: { usuarioId: callerId } });
    if (!beneficiario) throw { status: 403, message: 'Solo beneficiarios pueden inscribirse' };

    const evento = await prisma.evento.findUnique({ where: { id: eventoId }, include: { _count: { select: { inscripciones: true } } } });
    if (!evento) throw { status: 404, message: 'Evento no encontrado' };
    if (evento.estado !== 'publicado') throw { status: 400, message: 'El evento no está disponible' };

    if (evento.capacidadMaxima && evento._count.inscripciones >= evento.capacidadMaxima) {
      throw { status: 409, message: 'El evento está lleno' };
    }

    const yaInscrito = await prisma.inscripcionEvento.findUnique({
      where: { eventoId_beneficiarioId: { eventoId, beneficiarioId: beneficiario.id } },
    });
    if (yaInscrito) throw { status: 409, message: 'Ya estás inscrito en este evento' };

    const inscripcion = await prisma.inscripcionEvento.create({
      data: { eventoId, beneficiarioId: beneficiario.id },
    });

    // Notificar si quedan pocos cupos
    if (evento.capacidadMaxima) {
      const pct = (evento._count.inscripciones + 1) / evento.capacidadMaxima;
      if (pct >= 0.9) {
        await createNotification({
          usuarioId:  evento.constructoraId,  // approx: usar constructoraId como placeholder
          tipo:       'evento_cupos_bajos',
          titulo:     'Cupos casi agotados',
          mensaje:    `El evento "${evento.nombre}" tiene menos del 10% de cupos restantes.`,
          urlDestino: `/mis-eventos/${eventoId}`,
        }).catch(() => {});
      }
    }

    return inscripcion;
  }

  async desinscribirse(eventoId, callerId) {
    const beneficiario = await prisma.beneficiario.findUnique({ where: { usuarioId: callerId } });
    if (!beneficiario) throw { status: 403, message: 'Sin permiso' };

    const inscripcion = await prisma.inscripcionEvento.findUnique({
      where: { eventoId_beneficiarioId: { eventoId, beneficiarioId: beneficiario.id } },
    });
    if (!inscripcion) throw { status: 404, message: 'No estás inscrito en este evento' };

    await prisma.inscripcionEvento.delete({ where: { id: inscripcion.id } });
  }

  async marcarAsistencia(eventoId, callerId, callerRol, inscritos) {
    await this._ownOrAdmin(eventoId, callerId, callerRol);
    await Promise.all(
      inscritos.map((i) =>
        prisma.inscripcionEvento.update({
          where: { id: i.id },
          data:  { asistio: i.asistio },
        })
      )
    );
  }

  async exportInscritos(id, callerId, callerRol) {
    const data = await this.getInscritos(id, callerId, callerRol);
    return data.map((i) => ({
      nombre:   i.beneficiario.nombreCompleto,
      cedula:   i.beneficiario.cedula,
      email:    i.beneficiario.usuario.email,
      fecha:    i.fechaInscripcion.toISOString(),
      asistio:  i.asistio ? 'Sí' : 'No',
    }));
  }

  // ------------------------------------------------------------------
  async _ownOrAdmin(eventoId, callerId, callerRol) {
    const evento = await prisma.evento.findUnique({
      where:   { id: eventoId },
      include: { constructora: { select: { usuarioId: true } } },
    });
    if (!evento) throw { status: 404, message: 'Evento no encontrado' };
    if (callerRol !== 'ADMINISTRADOR' && evento.constructora.usuarioId !== callerId) {
      throw { status: 403, message: 'Sin permiso' };
    }
    return evento;
  }
}

module.exports = new EventoService();
