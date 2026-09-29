const { registrarAuditoria, NotFoundError, ConflictError } = require('@brickbybrick/shared');
const categoriaRepository = require('../repositories/categoria.repository');

module.exports = {
  listar: () => categoriaRepository.listar(),

  async crear(adminId, data) {
    const c = await categoriaRepository.create(data);
    registrarAuditoria({ usuarioId: adminId, accion: 'categoria_creada', entidad: 'categoria', entidadId: c.id });
    return c;
  },

  async actualizar(adminId, id, data) {
    if (!(await categoriaRepository.findById(id))) throw new NotFoundError('Categoría no encontrada');
    const c = await categoriaRepository.update(id, data);
    registrarAuditoria({ usuarioId: adminId, accion: 'categoria_editada', entidad: 'categoria', entidadId: id });
    return c;
  },

  async eliminar(adminId, id) {
    if (!(await categoriaRepository.findById(id))) throw new NotFoundError('Categoría no encontrada');
    const enUso = await categoriaRepository.contarMateriales(id);
    if (enUso) throw new ConflictError(`No se puede eliminar: ${enUso} material(es) usan esta categoría`);
    await categoriaRepository.delete(id);
    registrarAuditoria({ usuarioId: adminId, accion: 'categoria_eliminada', entidad: 'categoria', entidadId: id });
  },
};
