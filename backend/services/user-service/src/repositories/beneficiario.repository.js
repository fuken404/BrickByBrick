const { prisma } = require('@brickbybrick/shared');

const BENEFICIARIO_SELECT = {
  id: true,
  usuarioId: true,
  nombreCompleto: true,
  cedula: true,
  fechaNacimiento: true,
  genero: true,
  estrato: true,
  esAlimentadorWeb: true,
  nombreEmprendimiento: true,
  bioPublica: true,
  portafolioPublico: true,
  localidad: { select: { id: true, nombre: true } },
  usuario: { select: { id: true, email: true, telefono: true, estado: true, createdAt: true, avatarUrl: true } },
};

const beneficiarioRepository = {
  findById(id) {
    return prisma.beneficiario.findUnique({ where: { id }, select: BENEFICIARIO_SELECT });
  },

  update(id, data) {
    return prisma.beneficiario.update({ where: { id }, data, select: BENEFICIARIO_SELECT });
  },

  async list({ q, localidadId }, { skip, limit }) {
    const where = {};
    if (localidadId) where.localidadId = Number(localidadId);
    if (q) {
      where.OR = [
        { nombreCompleto: { contains: q, mode: 'insensitive' } },
        { cedula: { contains: q } },
      ];
    }
    const [total, items] = await prisma.$transaction([
      prisma.beneficiario.count({ where }),
      prisma.beneficiario.findMany({
        where, select: BENEFICIARIO_SELECT, skip, take: limit, orderBy: { usuario: { createdAt: 'desc' } },
      }),
    ]);
    return { total, items };
  },
};

module.exports = beneficiarioRepository;
