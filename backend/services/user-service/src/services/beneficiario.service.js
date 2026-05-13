const { prisma } = require('@brickbybrick/shared');

const BENEFICIARIO_SELECT = {
  id:              true,
  nombreCompleto:  true,
  cedula:          true,
  fechaNacimiento: true,
  genero:          true,
  estrato:         true,
  esAlimentadorWeb: true,
  localidad:       { select: { id: true, nombre: true } },
  usuario:         { select: { id: true, email: true, estado: true, createdAt: true } },
};

class BeneficiarioService {
  async findAll({ page = 1, limit = 20, localidadId, q } = {}) {
    const p = Number(page);
    const l = Number(limit);
    const where = {};
    if (localidadId) where.localidadId = Number(localidadId);
    if (q) where.nombreCompleto = { contains: q, mode: 'insensitive' };
    const [total, items] = await Promise.all([
      prisma.beneficiario.count({ where }),
      prisma.beneficiario.findMany({
        where,
        select: BENEFICIARIO_SELECT,
        skip:  (p - 1) * l,
        take:  l,
        orderBy: { usuario: { createdAt: 'desc' } },
      }),
    ]);
    return { total, page: p, limit: l, items };
  }

  async findById(id) {
    const b = await prisma.beneficiario.findUnique({
      where: { id },
      select: BENEFICIARIO_SELECT,
    });
    if (!b) throw { status: 404, message: 'Beneficiario no encontrado' };
    return b;
  }

  async update(id, callerId, callerRol, data) {
    const b = await prisma.beneficiario.findUnique({ where: { id } });
    if (!b) throw { status: 404, message: 'Beneficiario no encontrado' };

    // Solo el propio usuario o admin puede actualizar
    if (callerRol !== 'ADMINISTRADOR' && b.usuarioId !== callerId) {
      throw { status: 403, message: 'Sin permiso para modificar este perfil' };
    }

    return prisma.beneficiario.update({
      where: { id },
      data:  {
        nombreCompleto:  data.nombreCompleto,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : undefined,
        genero:          data.genero,
        estrato:         data.estrato,
        localidadId:     data.localidadId,
      },
      select: BENEFICIARIO_SELECT,
    });
  }

  async remove(id) {
    const b = await prisma.beneficiario.findUnique({ where: { id } });
    if (!b) throw { status: 404, message: 'Beneficiario no encontrado' };
    // Eliminar usuario en cascada (relación ON DELETE CASCADE)
    await prisma.usuario.delete({ where: { id: b.usuarioId } });
  }

  async toggleAlimentadorWeb(id) {
    const b = await prisma.beneficiario.findUnique({ where: { id } });
    if (!b) throw { status: 404, message: 'Beneficiario no encontrado' };
    return prisma.beneficiario.update({
      where: { id },
      data:  { esAlimentadorWeb: !b.esAlimentadorWeb },
      select: { id: true, nombreCompleto: true, esAlimentadorWeb: true },
    });
  }
}

module.exports = new BeneficiarioService();
