const { prisma } = require('@brickbybrick/shared');

module.exports = {
  findByUsuarioId(usuarioId) {
    return prisma.beneficiario.findUnique({ where: { usuarioId } });
  },
};
