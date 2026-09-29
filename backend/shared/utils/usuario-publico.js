/**
 * Datos públicos de un usuario (nunca email, cédula ni NIT).
 * Usar USUARIO_PUBLICO_SELECT en los `select`/`include` de Prisma y
 * toUsuarioPublico() para aplanar el resultado.
 */
const USUARIO_PUBLICO_SELECT = {
  id: true,
  rol: true,
  avatarUrl: true,
  beneficiario: {
    select: { id: true, nombreCompleto: true, esAlimentadorWeb: true, nombreEmprendimiento: true },
  },
  constructora: {
    select: { id: true, razonSocial: true, logoUrl: true, verificada: true },
  },
};

function nombrePublico(u) {
  if (!u) return 'Usuario';
  if (u.constructora) return u.constructora.razonSocial;
  if (u.beneficiario) return u.beneficiario.nombreEmprendimiento || u.beneficiario.nombreCompleto;
  if (u.rol === 'ADMINISTRADOR') return 'Equipo BrickByBrick';
  return 'Usuario';
}

function toUsuarioPublico(u) {
  if (!u) return null;
  return {
    id: u.id,
    rol: u.rol,
    nombre: nombrePublico(u),
    avatarUrl: u.avatarUrl || u.constructora?.logoUrl || null,
    esAlimentadorWeb: Boolean(u.beneficiario?.esAlimentadorWeb),
    verificada: Boolean(u.constructora?.verificada),
  };
}

module.exports = { USUARIO_PUBLICO_SELECT, toUsuarioPublico, nombrePublico };
