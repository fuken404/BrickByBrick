const { prisma, createNotification, sendEmail } = require('@brickbybrick/shared');

class SolicitudService {
  async findByBeneficiario(callerId, { estado, page = 1, limit = 20 } = {}) {
    const beneficiario = await prisma.beneficiario.findUnique({ where: { usuarioId: callerId } });
    if (!beneficiario) throw { status: 403, message: 'Solo beneficiarios pueden ver sus solicitudes' };

    const where = { beneficiarioId: beneficiario.id };
    if (estado) where.estado = estado;

    const [total, items] = await Promise.all([
      prisma.solicitudMaterial.count({ where }),
      prisma.solicitudMaterial.findMany({
        where,
        include: {
          material: {
            include: {
              categoria:    { select: { id: true, nombre: true, colorHex: true, icono: true } },
              constructora: { select: { id: true, razonSocial: true, logoUrl: true } },
              fotos:        { orderBy: { orden: 'asc' }, take: 1 },
            },
          },
        },
        orderBy: { fechaSolicitud: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      }),
    ]);
    return { total, page: Number(page), limit: Number(limit), items };
  }

  async findByConstructora(callerId, { estado, page = 1, limit = 20 } = {}) {
    const constructora = await prisma.constructora.findUnique({ where: { usuarioId: callerId } });
    if (!constructora) throw { status: 403, message: 'Sin perfil de constructora' };

    const where = { material: { constructoraId: constructora.id } };
    if (estado) where.estado = estado;

    const [total, items] = await Promise.all([
      prisma.solicitudMaterial.count({ where }),
      prisma.solicitudMaterial.findMany({
        where,
        include: {
          material:     { select: { id: true, nombre: true, unidadMedida: true } },
          beneficiario: { select: { id: true, nombreCompleto: true, cedula: true } },
        },
        orderBy: { fechaSolicitud: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      }),
    ]);
    return { total, page: Number(page), limit: Number(limit), items };
  }

  async findAll({ estado, page = 1, limit = 20 } = {}) {
    const where = {};
    if (estado) where.estado = estado;

    const [total, items, pendientes, aprobadas, entregadas, rechazadas] = await Promise.all([
      prisma.solicitudMaterial.count({ where }),
      prisma.solicitudMaterial.findMany({
        where,
        include: {
          material:     { select: { id: true, nombre: true, unidadMedida: true, constructora: { select: { razonSocial: true } } } },
          beneficiario: { select: { id: true, nombreCompleto: true, cedula: true } },
        },
        orderBy: { fechaSolicitud: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      }),
      prisma.solicitudMaterial.count({ where: { estado: 'pendiente' } }),
      prisma.solicitudMaterial.count({ where: { estado: 'aprobada' } }),
      prisma.solicitudMaterial.count({ where: { estado: 'entregada' } }),
      prisma.solicitudMaterial.count({ where: { estado: 'rechazada' } }),
    ]);

    return { total, page: Number(page), limit: Number(limit), items, stats: { pendientes, aprobadas, entregadas, rechazadas } };
  }

  async findByMaterial(materialId, callerId, callerRol) {
    // Verificar que el caller es dueño del material o admin
    const material = await prisma.material.findUnique({
      where:   { id: materialId },
      include: { constructora: { select: { usuarioId: true } } },
    });
    if (!material) throw { status: 404, message: 'Material no encontrado' };
    if (callerRol !== 'ADMINISTRADOR' && material.constructora.usuarioId !== callerId) {
      throw { status: 403, message: 'Sin permiso' };
    }

    return prisma.solicitudMaterial.findMany({
      where:   { materialId },
      include: {
        beneficiario: { select: { id: true, nombreCompleto: true, cedula: true, usuario: { select: { email: true } } } },
      },
      orderBy: { fechaSolicitud: 'desc' },
    });
  }

  async create(materialId, callerId, data) {
    // Verificar que el caller es un beneficiario
    const beneficiario = await prisma.beneficiario.findUnique({ where: { usuarioId: callerId } });
    if (!beneficiario) throw { status: 403, message: 'Solo los beneficiarios pueden solicitar materiales' };

    const material = await prisma.material.findUnique({
      where:   { id: materialId },
      include: { constructora: { select: { usuarioId: true } } },
    });
    if (!material) throw { status: 404, message: 'Material no encontrado' };
    if (material.estadoPublicacion !== 'activo') {
      throw { status: 400, message: 'El material no está disponible para solicitudes' };
    }
    if (data.cantidadSolicitada > Number(material.cantidad)) {
      throw { status: 400, message: 'La cantidad solicitada supera la disponible' };
    }

    // Verificar cupo si hay maxSolicitudes
    if (material.maxSolicitudes) {
      const count = await prisma.solicitudMaterial.count({
        where: { materialId, estado: { in: ['pendiente', 'aprobada'] } },
      });
      if (count >= material.maxSolicitudes) {
        throw { status: 409, message: 'No hay cupos disponibles para este material' };
      }
    }

    // Verificar que no haya ya una solicitud del mismo beneficiario
    const existing = await prisma.solicitudMaterial.findUnique({
      where: { materialId_beneficiarioId: { materialId, beneficiarioId: beneficiario.id } },
    });
    if (existing) throw { status: 409, message: 'Ya tienes una solicitud para este material' };

    const solicitud = await prisma.solicitudMaterial.create({
      data: {
        materialId,
        beneficiarioId:      beneficiario.id,
        cantidadSolicitada:  data.cantidadSolicitada,
        propositoUso:        data.propositoUso || null,
        descripcionProyecto: data.descripcionProyecto || null,
        estado:              'pendiente',
      },
    });

    // Notificar a la constructora
    await createNotification({
      usuarioId:  material.constructora.usuarioId,
      tipo:       'material_nuevo',
      titulo:     'Nueva solicitud de material',
      mensaje:    `${beneficiario.nombreCompleto} solicitó "${material.nombre}".`,
      urlDestino: `/mis-materiales/${materialId}/solicitudes`,
    }).catch(() => {});

    return solicitud;
  }

  async cambiarEstado(solicitudId, callerId, callerRol, { estado, instruccionesRetiro }) {
    const solicitud = await prisma.solicitudMaterial.findUnique({
      where:   { id: solicitudId },
      include: {
        material: { include: { constructora: { select: { usuarioId: true } } } },
        beneficiario: { include: { usuario: { select: { email: true, id: true } } } },
      },
    });
    if (!solicitud) throw { status: 404, message: 'Solicitud no encontrada' };

    // Solo la constructora dueña o admin puede cambiar el estado
    if (callerRol !== 'ADMINISTRADOR' && solicitud.material.constructora.usuarioId !== callerId) {
      throw { status: 403, message: 'Sin permiso' };
    }
    if (solicitud.estado === 'entregada' || solicitud.estado === 'cancelada') {
      throw { status: 400, message: `No se puede cambiar el estado desde "${solicitud.estado}"` };
    }

    const updated = await prisma.solicitudMaterial.update({
      where: { id: solicitudId },
      data:  {
        estado,
        instruccionesRetiro: instruccionesRetiro || null,
        fechaRespuesta: ['aprobada', 'rechazada'].includes(estado) ? new Date() : undefined,
        fechaEntrega:   estado === 'entregada' ? new Date() : undefined,
      },
    });

    // Descontar cantidad del material al aprobar; restaurar si se rechaza desde aprobada
    if (estado === 'aprobada') {
      await prisma.material.update({
        where: { id: solicitud.materialId },
        data:  { cantidad: { decrement: solicitud.cantidadSolicitada } },
      });
    } else if (estado === 'rechazada' && solicitud.estado === 'aprobada') {
      await prisma.material.update({
        where: { id: solicitud.materialId },
        data:  { cantidad: { increment: solicitud.cantidadSolicitada } },
      });
    }

    // Notificar al beneficiario
    const tipoNotif = {
      aprobada:  'solicitud_aprobada',
      rechazada: 'solicitud_rechazada',
      entregada: 'solicitud_entregada',
    }[estado];

    if (tipoNotif) {
      await createNotification({
        usuarioId:  solicitud.beneficiario.usuario.id,
        tipo:       tipoNotif,
        titulo:     `Solicitud ${estado}`,
        mensaje:    `Tu solicitud para "${solicitud.material.nombre}" fue ${estado}.`,
        urlDestino: `/mis-solicitudes/${solicitudId}`,
      }).catch(() => {});

      // Email de notificación
      sendEmail({
        to:      solicitud.beneficiario.usuario.email,
        subject: `Tu solicitud fue ${estado} — BrickByBrick`,
        html:    `<p>Tu solicitud para <strong>${solicitud.material.nombre}</strong> fue <strong>${estado}</strong>.</p>
                  ${instruccionesRetiro ? `<p>Instrucciones de retiro: ${instruccionesRetiro}</p>` : ''}`,
      }).catch(() => {});
    }

    return updated;
  }

  async calificar(solicitudId, callerId, data) {
    const beneficiario = await prisma.beneficiario.findUnique({ where: { usuarioId: callerId } });
    if (!beneficiario) throw { status: 403, message: 'Solo beneficiarios pueden calificar' };

    const solicitud = await prisma.solicitudMaterial.findUnique({ where: { id: solicitudId } });
    if (!solicitud) throw { status: 404, message: 'Solicitud no encontrada' };
    if (solicitud.beneficiarioId !== beneficiario.id) throw { status: 403, message: 'Sin permiso' };
    if (solicitud.estado !== 'entregada') throw { status: 400, message: 'Solo se pueden calificar entregas completadas' };
    if (solicitud.calificacion) throw { status: 409, message: 'Ya has calificado esta entrega' };

    return prisma.solicitudMaterial.update({
      where: { id: solicitudId },
      data:  {
        calificacion:           data.calificacion,
        comentarioCalificacion: data.comentarioCalificacion || null,
      },
    });
  }
}

module.exports = new SolicitudService();
