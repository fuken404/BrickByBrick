const { toUsuarioPublico, NotFoundError } = require('@brickbybrick/shared');
const perfilRepository = require('../repositories/perfil.repository');

const perfilService = {
  /**
   * Perfil público (portafolio). Los datos de emprendimiento del beneficiario
   * solo se muestran si activó su portafolio público.
   */
  async obtener(usuarioId, visitante) {
    const u = await perfilRepository.findUsuario(usuarioId);
    if (!u || u.estado === 'inactivo') throw new NotFoundError('Perfil no encontrado');

    const esPropio = visitante?.userId === u.id;
    const esAdmin = visitante?.rol === 'ADMINISTRADOR';
    const contadores = await perfilRepository.contadores(u.id, visitante?.userId);

    const perfil = {
      ...toUsuarioPublico(u),
      miembroDesde: u.createdAt,
      suspendido: u.estado === 'suspendido',
      esPropio,
      ...contadores,
    };

    if (u.beneficiario) {
      const visible = u.beneficiario.portafolioPublico || esPropio || esAdmin;
      perfil.portafolio = {
        publico: u.beneficiario.portafolioPublico,
        nombreEmprendimiento: visible ? u.beneficiario.nombreEmprendimiento : null,
        bio: visible ? u.beneficiario.bioPublica : null,
        localidad: visible ? u.beneficiario.localidad : null,
      };
    }

    if (u.constructora) {
      perfil.empresa = {
        id: u.constructora.id,
        descripcion: u.constructora.descripcion,
        sitioWeb: u.constructora.sitioWeb,
        localidad: u.constructora.localidad,
        ...(await perfilRepository.impactoConstructora(u.constructora.id)),
      };
    }

    return perfil;
  },
};

module.exports = perfilService;
