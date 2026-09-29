const { prisma } = require('@brickbybrick/shared');

const MATERIAL_INCLUDE = {
  categoria: { select: { id: true, nombre: true, colorHex: true, icono: true } },
  constructora: {
    select: {
      id: true, usuarioId: true, razonSocial: true, logoUrl: true, verificada: true,
      localidad: { select: { id: true, nombre: true } },
    },
  },
  fotos: { orderBy: { orden: 'asc' } },
  _count: { select: { solicitudes: true } },
};

const ORDEN = {
  recientes: [{ publicadoEn: 'desc' }, { createdAt: 'desc' }],
  vencen:    [{ fechaLimite: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
  cantidad:  [{ cantidad: 'desc' }],
};

function inicioHoyBogota() {
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  return new Date(`${hoy}T00:00:00.000Z`);
}

function filtrosComunes(f) {
  const and = [];
  if (f.categoriaId) and.push({ categoriaId: f.categoriaId });
  if (f.estadoMaterial) and.push({ estadoMaterial: f.estadoMaterial });
  if (f.constructoraId) and.push({ constructoraId: f.constructoraId });
  if (f.localidadId) and.push({ constructora: { localidadId: f.localidadId } });
  if (f.q) {
    and.push({
      OR: [
        { nombre: { contains: f.q, mode: 'insensitive' } },
        { descripcion: { contains: f.q, mode: 'insensitive' } },
        { categoria: { nombre: { contains: f.q, mode: 'insensitive' } } },
      ],
    });
  }
  return and;
}

const materialRepository = {
  INCLUDE: MATERIAL_INCLUDE,
  inicioHoyBogota,

  /** Catálogo público: activos, vigentes y de constructoras verificadas. */
  async listarPublico(f, { skip, limit }) {
    const where = {
      AND: [
        { estadoPublicacion: 'activo', eliminadoEn: null, constructora: { verificada: true } },
        { OR: [{ fechaLimite: null }, { fechaLimite: { gte: inicioHoyBogota() } }] },
        ...filtrosComunes(f),
      ],
    };
    const [total, items] = await prisma.$transaction([
      prisma.material.count({ where }),
      prisma.material.findMany({ where, include: MATERIAL_INCLUDE, skip, take: limit, orderBy: ORDEN[f.orden] }),
    ]);
    return { total, items };
  },

  async listarDeConstructora(constructoraId, f, { skip, limit }) {
    const where = { AND: [{ constructoraId, eliminadoEn: null }, ...filtrosComunes(f)] };
    if (f.estadoPublicacion) where.AND.push({ estadoPublicacion: f.estadoPublicacion });
    const [total, items] = await prisma.$transaction([
      prisma.material.count({ where }),
      prisma.material.findMany({ where, include: MATERIAL_INCLUDE, skip, take: limit, orderBy: [{ createdAt: 'desc' }] }),
    ]);
    return { total, items };
  },

  async listarAdmin(f, { skip, limit }) {
    const where = { AND: [{ eliminadoEn: null }, ...filtrosComunes(f)] };
    if (f.estadoPublicacion) where.AND.push({ estadoPublicacion: f.estadoPublicacion });
    const [total, items] = await prisma.$transaction([
      prisma.material.count({ where }),
      prisma.material.findMany({ where, include: MATERIAL_INCLUDE, skip, take: limit, orderBy: [{ createdAt: 'desc' }] }),
    ]);
    return { total, items };
  },

  findById(id) {
    return prisma.material.findUnique({ where: { id }, include: MATERIAL_INCLUDE });
  },

  create(data) {
    return prisma.material.create({ data, include: MATERIAL_INCLUDE });
  },

  update(id, data) {
    return prisma.material.update({ where: { id }, data, include: MATERIAL_INCLUDE });
  },

  contarFotos(materialId) {
    return prisma.fotoMaterial.count({ where: { materialId } });
  },

  crearFotos(data) {
    return prisma.fotoMaterial.createMany({ data });
  },

  fotos(materialId) {
    return prisma.fotoMaterial.findMany({ where: { materialId }, orderBy: { orden: 'asc' } });
  },

  findFoto(id) {
    return prisma.fotoMaterial.findUnique({ where: { id } });
  },

  eliminarFoto(id) {
    return prisma.fotoMaterial.delete({ where: { id } });
  },

  contarSolicitudesActivas(materialId, db = prisma) {
    return db.solicitudMaterial.count({ where: { materialId, estado: { in: ['pendiente', 'aprobada'] } } });
  },

  /** Destinatarios del aviso de material nuevo: seguidores + beneficiarios de la localidad. */
  async destinatariosMaterialNuevo(constructora) {
    const [seguidores, vecinos] = await prisma.$transaction([
      prisma.seguidor.findMany({ where: { seguidoId: constructora.usuarioId }, select: { seguidorId: true } }),
      constructora.localidad
        ? prisma.beneficiario.findMany({
          where: { localidadId: constructora.localidad.id, usuario: { estado: 'activo' } },
          select: { usuarioId: true },
          take: 500,
        })
        : prisma.beneficiario.findMany({ where: { id: '00000000-0000-0000-0000-000000000000' }, select: { usuarioId: true } }),
    ]);
    return [...new Set([...seguidores.map((s) => s.seguidorId), ...vecinos.map((b) => b.usuarioId)])];
  },
};

module.exports = materialRepository;
