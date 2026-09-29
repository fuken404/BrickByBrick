/**
 * Unitaria — texto plano de los correos: los enlaces deben conservar su URL.
 */
const { aTextoPlano } = require('../utils/email.utils');
const { plantillaCorreo } = require('../utils/html');

describe('aTextoPlano', () => {
  it('conserva la URL del botón de acción de la plantilla', () => {
    const html = plantillaCorreo({
      titulo: 'Restablece tu contraseña', cuerpoHtml: '<p>Hola &amp; bienvenido</p>',
      ctaTexto: 'Crear nueva contraseña', ctaUrl: 'http://localhost:4200/restablecer-password/abc123',
    });
    const texto = aTextoPlano(html);
    expect(texto).toContain('Crear nueva contraseña: http://localhost:4200/restablecer-password/abc123');
    expect(texto).toContain('Hola & bienvenido');
    expect(texto).not.toMatch(/<[a-z]/i);
  });
});
