const { prisma } = require('@brickbybrick/shared');

const tokenRepository = {
  crear({ usuarioId, tipo, tokenHash, expiresAt }) {
    return prisma.tokenUsuario.create({ data: { usuarioId, tipo, tokenHash, expiresAt } });
  },

  findVigente({ tokenHash, tipo }) {
    return prisma.tokenUsuario.findFirst({
      where: { tokenHash, tipo, usado: false, expiresAt: { gt: new Date() } },
    });
  },

  findPorHash({ tokenHash, tipo }) {
    return prisma.tokenUsuario.findFirst({ where: { tokenHash, tipo } });
  },

  findById(id) {
    return prisma.tokenUsuario.findUnique({ where: { id } });
  },

  marcarUsado(id) {
    return prisma.tokenUsuario.update({ where: { id }, data: { usado: true } });
  },

  incrementarIntentos(id) {
    return prisma.tokenUsuario.update({ where: { id }, data: { intentos: { increment: 1 } } });
  },

  invalidarTodos(usuarioId, tipo) {
    return prisma.tokenUsuario.updateMany({ where: { usuarioId, tipo, usado: false }, data: { usado: true } });
  },

  /** Limpieza de tokens caducados (llamada oportunista). */
  purgarExpirados() {
    return prisma.tokenUsuario.deleteMany({
      where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
  },
};

module.exports = tokenRepository;
