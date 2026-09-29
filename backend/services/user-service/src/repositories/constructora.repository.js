const { prisma } = require('@brickbybrick/shared');

const LOCALIDAD = { select: { id: true, nombre: true } };

/** Datos visibles para cualquier visitante (sin NIT ni email). */
const PUBLIC_SELECT = {
  id: true,
  usuarioId: true,
  razonSocial: true,
  descripcion: true,
  logoUrl: true,
  sitioWeb: true,
  verificada: true,
  localidad: LOCALIDAD,
};

/** Datos completos para la propia constructora y el administrador. */
const FULL_SELECT = {
  ...PUBLIC_SELECT,
  nit: true,
  representanteLegal: true,
  cargoRepresentante: true,
  numEmpleados: true,
  direccion: true,
  fechaVerificacion: true,
  motivoRechazo: true,
  usuario: { select: { id: true, email: true, telefono: true, estado: true, createdAt: true } },
  documentosEmpresa: { orderBy: { fechaSubida: 'desc' } },
};

const constructoraRepository = {
  PUBLIC_SELECT,
  FULL_SELECT,

  findById(id, { completo = false } = {}) {
    return prisma.constructora.findUnique({ where: { id }, select: completo ? FULL_SELECT : PUBLIC_SELECT });
  },

  findRaw(id) {
    return prisma.constructora.findUnique({ where: { id } });
  },

  update(id, data) {
    return prisma.constructora.update({ where: { id }, data, select: FULL_SELECT });
  },

  async list({ q, verificada, localidadId }, { skip, limit }, { completo = false } = {}) {
    const where = {};
    if (!completo) where.verificada = true;
    else if (verificada !== undefined) where.verificada = verificada === 'true';
    if (localidadId) where.localidadId = Number(localidadId);
    if (q) {
      where.OR = [{ razonSocial: { contains: q, mode: 'insensitive' } }];
      if (completo) where.OR.push({ nit: { contains: q } });
    }
    const [total, items] = await prisma.$transaction([
      prisma.constructora.count({ where }),
      prisma.constructora.findMany({
        where, select: completo ? FULL_SELECT : PUBLIC_SELECT, skip, take: limit, orderBy: { razonSocial: 'asc' },
      }),
    ]);
    return { total, items };
  },

  crearDocumento(data) {
    return prisma.documentoEmpresa.create({ data });
  },

  findDocumento(id) {
    return prisma.documentoEmpresa.findUnique({ where: { id }, include: { constructora: true } });
  },

  updateDocumento(id, data) {
    return prisma.documentoEmpresa.update({ where: { id }, data });
  },
};

module.exports = constructoraRepository;
