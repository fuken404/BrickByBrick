const bcrypt = require('bcryptjs');
const {
  uploadToStorage, deleteFromStorage, registrarAuditoria, NotFoundError, BadRequestError, ForbiddenError,
} = require('@brickbybrick/shared');
const usuarioRepository = require('../repositories/usuario.repository');

/** Perfil propio (nunca incluye el hash de la contraseña). */
function toMe(u) {
  const { passwordHash, ...resto } = u;
  return resto;
}

const meService = {
  async obtener(usuarioId) {
    const u = await usuarioRepository.findMe(usuarioId);
    if (!u) throw new NotFoundError('Usuario no encontrado');
    return toMe(u);
  },

  async actualizar(usuarioId, data) {
    return toMe(await usuarioRepository.update(usuarioId, data));
  },

  async actualizarAvatar(usuarioId, file) {
    const actual = await usuarioRepository.findById(usuarioId);
    const avatarUrl = await uploadToStorage(file.buffer, 'avatares', file.originalname, file.mimetype);
    const u = await usuarioRepository.update(usuarioId, { avatarUrl });
    if (actual?.avatarUrl) deleteFromStorage(actual.avatarUrl);
    return { avatarUrl: u.avatarUrl };
  },

  async eliminarCuenta(usuarioId, { password }) {
    const u = await usuarioRepository.findById(usuarioId);
    if (!u) throw new NotFoundError('Usuario no encontrado');
    if (u.rol === 'ADMINISTRADOR') throw new ForbiddenError('Las cuentas de administrador no se eliminan desde aquí');
    if (!(await bcrypt.compare(password, u.passwordHash))) throw new BadRequestError('La contraseña es incorrecta');
    await usuarioRepository.anonimizar(u);
    registrarAuditoria({ usuarioId, accion: 'cuenta_eliminada', entidad: 'usuario', entidadId: usuarioId });
  },
};

module.exports = meService;
