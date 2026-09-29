const { prisma } = require('@brickbybrick/shared');

const LOCALIDAD = { select: { id: true, nombre: true } };

const ME_INCLUDE = {
  beneficiario: { include: { localidad: LOCALIDAD } },
  constructora: {
    include: { localidad: LOCALIDAD, documentosEmpresa: { orderBy: { fechaSubida: 'desc' } } },
  },
};

const ADMIN_SELECT = {
  id: true, email: true, rol: true, estado: true, emailVerificado: true, mfaHabilitado: true,
  telefono: true, ultimoLogin: true, createdAt: true,
  beneficiario: { select: { id: true, nombreCompleto: true, cedula: true, esAlimentadorWeb: true, localidad: LOCALIDAD } },
  constructora: { select: { id: true, razonSocial: true, nit: true, verificada: true, localidad: LOCALIDAD } },
};

const usuarioRepository = {
  findMe(id) {
    return prisma.usuario.findUnique({ where: { id }, include: ME_INCLUDE });
  },

  findById(id) {
    return prisma.usuario.findUnique({ where: { id } });
  },

  update(id, data) {
    return prisma.usuario.update({ where: { id }, data, include: ME_INCLUDE });
  },

  async listarAdmin({ q, rol, estado }, { skip, limit }) {
    const where = {};
    if (rol) where.rol = rol;
    if (estado) where.estado = estado;
    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { beneficiario: { nombreCompleto: { contains: q, mode: 'insensitive' } } },
        { beneficiario: { cedula: { contains: q } } },
        { constructora: { razonSocial: { contains: q, mode: 'insensitive' } } },
        { constructora: { nit: { contains: q } } },
      ];
    }
    const [total, items] = await prisma.$transaction([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({ where, select: ADMIN_SELECT, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    ]);
    return { total, items };
  },

  revocarSesiones(usuarioId) {
    return prisma.tokenUsuario.updateMany({
      where: { usuarioId, tipo: 'refresh', usado: false },
      data: { usado: true },
    });
  },

  /** Ley 1581: elimina datos personales conservando la trazabilidad de donaciones. */
  anonimizar(usuario) {
    const sufijo = usuario.id.slice(0, 8);
    return prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          email: `eliminado-${usuario.id}@brickbybrick.invalid`,
          passwordHash: 'cuenta-eliminada',
          estado: 'inactivo',
          telefono: null,
          avatarUrl: null,
          mfaHabilitado: false,
        },
      });
      await tx.beneficiario.updateMany({
        where: { usuarioId: usuario.id },
        data: {
          nombreCompleto: 'Usuario eliminado', cedula: `DEL-${sufijo}`, fechaNacimiento: null,
          genero: null, bioPublica: null, nombreEmprendimiento: null, portafolioPublico: false,
        },
      });
      await tx.tokenUsuario.updateMany({ where: { usuarioId: usuario.id, usado: false }, data: { usado: true } });
      await tx.seguidor.deleteMany({ where: { OR: [{ seguidorId: usuario.id }, { seguidoId: usuario.id }] } });
      await tx.publicacion.updateMany({ where: { autorId: usuario.id }, data: { estado: 'suspendida' } });
    });
  },
};

module.exports = usuarioRepository;
