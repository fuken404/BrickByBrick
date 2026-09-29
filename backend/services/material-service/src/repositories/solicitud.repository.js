const { prisma } = require('@brickbybrick/shared');

const MATERIAL_BASICO = {
  select: {
    id: true, nombre: true, unidadMedida: true, cantidad: true, valorUnitarioCop: true, estadoPublicacion: true,
    constructoraId: true,
    categoria: { select: { id: true, nombre: true, colorHex: true, icono: true } },
    fotos: { orderBy: { orden: 'asc' }, take: 1 },
  },
};

/** Vista del beneficiario: datos de la constructora para coordinar el retiro. */
const INCLUDE_BENEFICIARIO = {
  material: {
    select: {
      ...MATERIAL_BASICO.select,
      condicionesRetiro: true,
      constructora: {
        select: {
          id: true, usuarioId: true, razonSocial: true, logoUrl: true, direccion: true,
          localidad: { select: { nombre: true } },
          usuario: { select: { telefono: true } },
        },
      },
    },
  },
};

/** Vista de la constructora: contacto del beneficiario solo si la solicitud está aprobada/entregada. */
const INCLUDE_CONSTRUCTORA = {
  material: { select: { ...MATERIAL_BASICO.select, condicionesRetiro: true } },
  beneficiario: {
    select: {
      id: true, usuarioId: true, nombreCompleto: true, cedula: true,
      localidad: { select: { nombre: true } },
      usuario: { select: { email: true, telefono: true } },
    },
  },
};

const INCLUDE_ADMIN = {
  material: { select: { ...MATERIAL_BASICO.select, constructora: { select: { id: true, razonSocial: true } } } },
  beneficiario: { select: { id: true, nombreCompleto: true, localidad: { select: { nombre: true } } } },
};

async function paginar(where, include, { skip, limit }) {
  const [total, items] = await prisma.$transaction([
    prisma.solicitudMaterial.count({ where }),
    prisma.solicitudMaterial.findMany({ where, include, skip, take: limit, orderBy: { fechaSolicitud: 'desc' } }),
  ]);
  return { total, items };
}

async function contarPorEstado(where) {
  const filas = await prisma.solicitudMaterial.groupBy({ by: ['estado'], where, _count: { _all: true } });
  const base = { pendiente: 0, aprobada: 0, rechazada: 0, entregada: 0, cancelada: 0 };
  for (const f of filas) base[f.estado] = f._count._all;
  return base;
}

const solicitudRepository = {
  INCLUDE_CONSTRUCTORA,

  listarBeneficiario(beneficiarioId, f, pag) {
    const where = { beneficiarioId, ...(f.estado ? { estado: f.estado } : {}) };
    return paginar(where, INCLUDE_BENEFICIARIO, pag);
  },

  listarConstructora(constructoraId, f, pag) {
    const where = {
      material: { constructoraId },
      ...(f.estado ? { estado: f.estado } : {}),
      ...(f.materialId ? { materialId: f.materialId } : {}),
    };
    return paginar(where, INCLUDE_CONSTRUCTORA, pag);
  },

  listarAdmin(f, pag) {
    const where = {
      ...(f.estado ? { estado: f.estado } : {}),
      ...(f.materialId ? { materialId: f.materialId } : {}),
    };
    return paginar(where, INCLUDE_ADMIN, pag);
  },

  contarPorEstado,

  findById(id) {
    return prisma.solicitudMaterial.findUnique({
      where: { id },
      include: {
        material: {
          include: {
            constructora: { select: { id: true, usuarioId: true, razonSocial: true, verificada: true } },
          },
        },
        beneficiario: { select: { id: true, usuarioId: true, nombreCompleto: true } },
      },
    });
  },

  findDetalle(id, include) {
    return prisma.solicitudMaterial.findUnique({ where: { id }, include });
  },

  INCLUDE_BENEFICIARIO,

  activaDeBeneficiario(materialId, beneficiarioId, db = prisma) {
    return db.solicitudMaterial.findFirst({
      where: { materialId, beneficiarioId, estado: { in: ['pendiente', 'aprobada'] } },
    });
  },

  contarActivasBeneficiario(beneficiarioId, db = prisma) {
    return db.solicitudMaterial.count({ where: { beneficiarioId, estado: { in: ['pendiente', 'aprobada'] } } });
  },

  create(data, db = prisma) {
    return db.solicitudMaterial.create({ data });
  },

  /**
   * Bloquea las filas del material y del beneficiario hasta el fin de la
   * transacción: serializa las solicitudes concurrentes (doble envío, límites).
   */
  async bloquearParaSolicitud(tx, materialId, beneficiarioId) {
    await tx.$queryRaw`SELECT id FROM materiales WHERE id = ${materialId}::uuid FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM beneficiarios WHERE id = ${beneficiarioId}::uuid FOR UPDATE`;
  },

  update(id, data) {
    return prisma.solicitudMaterial.update({ where: { id }, data });
  },

  /** Pendientes de materiales vencidos (para el cron). */
  pendientesDeMaterial(materialId) {
    return prisma.solicitudMaterial.findMany({
      where: { materialId, estado: 'pendiente' },
      include: { beneficiario: { select: { usuarioId: true } } },
    });
  },
};

module.exports = solicitudRepository;
