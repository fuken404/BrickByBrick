/**
 * Rutas del frontend a las que apuntan las notificaciones y correos.
 * Deben coincidir con app.routes.ts y los *.routes.ts de cada rol.
 */
const PREFIJO = {
  BENEFICIARIO: '/beneficiario',
  CONSTRUCTORA: '/empresa',
  ADMINISTRADOR: '/admin',
};

const RUTAS = {
  solicitud:     { BENEFICIARIO: (id) => `/mis-solicitudes?id=${id}`, CONSTRUCTORA: (id) => `/donaciones?id=${id}`, ADMINISTRADOR: () => '/donaciones' },
  material:      { BENEFICIARIO: (id) => `/materiales/${id}`,          CONSTRUCTORA: (id) => `/materiales/${id}/editar`, ADMINISTRADOR: () => '/materiales' },
  evento:        { BENEFICIARIO: (id) => `/eventos/${id}`,             CONSTRUCTORA: (id) => `/eventos/${id}`,           ADMINISTRADOR: () => '/eventos' },
  publicacion:   { '*': (id) => `/comunidad/${id}` },
  usuario:       { '*': (id) => `/usuarios/${id}` },
  grupo:         { '*': (id) => `/grupos/${id}` },
  conversacion:  { '*': (id) => `/mensajes/${id}` },
  notificaciones:{ '*': () => '/notificaciones' },
  perfil:        { '*': () => '/perfil' },
  tributario:    { CONSTRUCTORA: () => '/tributario' },
  constructora:  { ADMINISTRADOR: (id) => `/constructoras?id=${id}`, CONSTRUCTORA: () => '/perfil' },
  moderacion:    { ADMINISTRADOR: () => '/moderacion' },
};

/**
 * @param {'BENEFICIARIO'|'CONSTRUCTORA'|'ADMINISTRADOR'} rol
 * @param {keyof typeof RUTAS} recurso
 * @param {string} [id]
 * @returns {string|null}
 */
function rutaPara(rol, recurso, id) {
  const def = RUTAS[recurso];
  if (!def || !PREFIJO[rol]) return null;
  const fn = def[rol] || def['*'];
  return fn ? `${PREFIJO[rol]}${fn(id)}` : null;
}

module.exports = { rutaPara };
