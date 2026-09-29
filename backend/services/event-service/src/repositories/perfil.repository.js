const { prisma } = require('@brickbybrick/shared');

module.exports = {
  constructoraDe(usuarioId) {
    return prisma.constructora.findUnique({ where: { usuarioId } });
  },
  beneficiarioDe(usuarioId) {
    return prisma.beneficiario.findUnique({ where: { usuarioId } });
  },
};
