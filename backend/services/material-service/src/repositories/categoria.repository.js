const { prisma } = require('@brickbybrick/shared');

module.exports = {
  listar() {
    return prisma.categoriaMaterial.findMany({
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { materiales: true } } },
    });
  },
  findById(id) {
    return prisma.categoriaMaterial.findUnique({ where: { id } });
  },
  create(data) {
    return prisma.categoriaMaterial.create({ data });
  },
  update(id, data) {
    return prisma.categoriaMaterial.update({ where: { id }, data });
  },
  delete(id) {
    return prisma.categoriaMaterial.delete({ where: { id } });
  },
  contarMateriales(id) {
    return prisma.material.count({ where: { categoriaId: id } });
  },
};
