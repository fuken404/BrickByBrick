const { prisma, uploadToStorage, createNotification } = require('@brickbybrick/shared');

const CONSTRUCTORA_SELECT = {
  id:                 true,
  razonSocial:        true,
  nit:                true,
  representanteLegal: true,
  cargoRepresentante: true,
  numEmpleados:       true,
  direccion:          true,
  descripcion:        true,
  logoUrl:            true,
  sitioWeb:           true,
  verificada:         true,
  fechaVerificacion:  true,
  localidad:          { select: { id: true, nombre: true } },
  usuario:            { select: { id: true, email: true, estado: true, createdAt: true } },
  documentosEmpresa:  { orderBy: { fechaSubida: 'desc' } },
};

class ConstructoraService {
  async findAll({ page = 1, limit = 20, verificada, localidadId, q } = {}) {
    const p = Number(page);
    const l = Number(limit);
    const where = {};
    if (verificada !== undefined) where.verificada = verificada === 'true';
    if (localidadId) where.localidadId = Number(localidadId);
    if (q) where.razonSocial = { contains: q, mode: 'insensitive' };

    const [total, items] = await Promise.all([
      prisma.constructora.count({ where }),
      prisma.constructora.findMany({
        where,
        select: CONSTRUCTORA_SELECT,
        skip: (p - 1) * l,
        take: l,
        orderBy: { razonSocial: 'asc' },
      }),
    ]);
    return { total, page: p, limit: l, items };
  }

  async findById(id) {
    const c = await prisma.constructora.findUnique({
      where: { id },
      select: CONSTRUCTORA_SELECT,
    });
    if (!c) throw { status: 404, message: 'Constructora no encontrada' };
    return c;
  }

  async update(id, callerId, callerRol, data) {
    const c = await prisma.constructora.findUnique({ where: { id } });
    if (!c) throw { status: 404, message: 'Constructora no encontrada' };
    if (callerRol !== 'ADMINISTRADOR' && c.usuarioId !== callerId) {
      throw { status: 403, message: 'Sin permiso para modificar este perfil' };
    }

    return prisma.constructora.update({
      where:  { id },
      data,
      select: CONSTRUCTORA_SELECT,
    });
  }

  async verificar(id) {
    const c = await prisma.constructora.findUnique({ where: { id } });
    if (!c) throw { status: 404, message: 'Constructora no encontrada' };

    const updated = await prisma.constructora.update({
      where: { id },
      data:  { verificada: true, fechaVerificacion: new Date() },
      select: CONSTRUCTORA_SELECT,
    });

    // Notificar a la constructora
    await createNotification({
      usuarioId:  c.usuarioId,
      tipo:       'verificacion',
      titulo:     '¡Tu empresa ha sido verificada!',
      mensaje:    'Tu empresa está verificada y ya puedes publicar materiales y eventos.',
      urlDestino: '/mi-empresa',
    }).catch(() => {});

    return updated;
  }

  async subirDocumento(constructoraId, callerId, callerRol, file, tipo) {
    const c = await prisma.constructora.findUnique({ where: { id: constructoraId } });
    if (!c) throw { status: 404, message: 'Constructora no encontrada' };
    if (callerRol !== 'ADMINISTRADOR' && c.usuarioId !== callerId) {
      throw { status: 403, message: 'Sin permiso' };
    }
    if (!['rut', 'camara_comercio'].includes(tipo)) {
      throw { status: 400, message: 'Tipo de documento inválido (rut | camara_comercio)' };
    }

    const url = await uploadToStorage(file.buffer, 'documentos', file.originalname);

    return prisma.documentoEmpresa.create({
      data: { constructoraId, tipo, url, estado: 'pendiente' },
    });
  }

  async actualizarLogo(constructoraId, callerId, callerRol, file) {
    const c = await prisma.constructora.findUnique({ where: { id: constructoraId } });
    if (!c) throw { status: 404, message: 'Constructora no encontrada' };
    if (callerRol !== 'ADMINISTRADOR' && c.usuarioId !== callerId) {
      throw { status: 403, message: 'Sin permiso' };
    }

    const logoUrl = await uploadToStorage(file.buffer, 'logos', file.originalname, file.mimetype);

    return prisma.constructora.update({
      where:  { id: constructoraId },
      data:   { logoUrl },
      select: { id: true, logoUrl: true },
    });
  }
}

module.exports = new ConstructoraService();
