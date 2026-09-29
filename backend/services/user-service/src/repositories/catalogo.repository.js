const { prisma } = require('@brickbybrick/shared');

module.exports = {
  localidades() {
    return prisma.localidad.findMany({ orderBy: { nombre: 'asc' } });
  },
};
