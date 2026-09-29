const { prisma } = require('@brickbybrick/shared');

module.exports = {
  findByUsuarioId(usuarioId) {
    return prisma.constructora.findUnique({
      where: { usuarioId },
      include: { localidad: { select: { id: true, nombre: true } }, documentosEmpresa: true },
    });
  },
  findById(id) {
    return prisma.constructora.findUnique({
      where: { id },
      include: { localidad: { select: { id: true, nombre: true } }, documentosEmpresa: true, usuario: { select: { email: true } } },
    });
  },
};
