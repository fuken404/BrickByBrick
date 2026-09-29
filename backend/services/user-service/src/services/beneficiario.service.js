const {
  parsePaginacion, pagina, registrarAuditoria, createNotification,
  NotFoundError, ForbiddenError,
} = require('@brickbybrick/shared');
const beneficiarioRepository = require('../repositories/beneficiario.repository');

async function obtenerPropio(id, caller) {
  const b = await beneficiarioRepository.findById(id);
  if (!b) throw new NotFoundError('Beneficiario no encontrado');
  if (caller.rol !== 'ADMINISTRADOR' && b.usuarioId !== caller.userId) {
    throw new ForbiddenError('No tienes permiso para ver este perfil');
  }
  return b;
}

const beneficiarioService = {
  async listar(query) {
    const pag = parsePaginacion(query);
    const { total, items } = await beneficiarioRepository.list(query, pag);
    return pagina(items, total, pag);
  },

  obtener: obtenerPropio,

  async actualizar(id, caller, data) {
    await obtenerPropio(id, caller);
    const cambios = { ...data };
    if (data.fechaNacimiento !== undefined) cambios.fechaNacimiento = data.fechaNacimiento ? new Date(data.fechaNacimiento) : null;
    const actualizado = await beneficiarioRepository.update(id, cambios);
    if (caller.rol === 'ADMINISTRADOR') {
      registrarAuditoria({ usuarioId: caller.userId, accion: 'beneficiario_editado', entidad: 'beneficiario', entidadId: id, detalle: Object.keys(data) });
    }
    return actualizado;
  },

  async actualizarPortafolio(id, caller, data) {
    const b = await obtenerPropio(id, caller);
    if (b.usuarioId !== caller.userId) throw new ForbiddenError('Solo el titular puede editar su portafolio');
    return beneficiarioRepository.update(id, data);
  },

  async toggleAlimentador(id, caller) {
    const b = await beneficiarioRepository.findById(id);
    if (!b) throw new NotFoundError('Beneficiario no encontrado');
    const actualizado = await beneficiarioRepository.update(id, { esAlimentadorWeb: !b.esAlimentadorWeb });
    registrarAuditoria({
      usuarioId: caller.userId, accion: actualizado.esAlimentadorWeb ? 'alimentador_asignado' : 'alimentador_retirado',
      entidad: 'beneficiario', entidadId: id,
    });
    if (actualizado.esAlimentadorWeb) {
      createNotification({
        usuarioId: b.usuarioId, tipo: 'cuenta', titulo: '¡Ahora eres Alimentador Web!',
        mensaje: 'Tus publicaciones aparecerán destacadas como creador de contenido de la comunidad.',
        recurso: 'perfil',
      });
    }
    return actualizado;
  },
};

module.exports = beneficiarioService;
