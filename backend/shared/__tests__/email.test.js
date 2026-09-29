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

describe('sendEmail con Resend', () => {
  const entorno = { ...process.env };
  afterEach(() => {
    process.env = { ...entorno };
    jest.restoreAllMocks();
  });

  it('usa la API HTTPS de Resend cuando MAIL_TRANSPORT=resend', async () => {
    process.env = { ...entorno, NODE_ENV: 'production', MAIL_TRANSPORT: 'resend', RESEND_API_KEY: 're_prueba', EMAIL_FROM: 'BrickByBrick <hola@ejemplo.test>' };
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{"id":"1"}', { status: 200 }));
    const { sendEmail } = require('../utils/email.utils');
    await sendEmail({ to: 'persona@ejemplo.test', subject: 'Hola', html: '<p>Hola</p>' });
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(opciones.headers.Authorization).toBe('Bearer re_prueba');
    expect(JSON.parse(opciones.body)).toMatchObject({ to: ['persona@ejemplo.test'], subject: 'Hola', text: 'Hola' });
  });

  it('en producción propaga el error si Resend rechaza el envío', async () => {
    process.env = { ...entorno, NODE_ENV: 'production', MAIL_TRANSPORT: 'resend', RESEND_API_KEY: 're_prueba' };
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('dominio no verificado', { status: 403 }));
    const { sendEmail } = require('../utils/email.utils');
    await expect(sendEmail({ to: 'x@ejemplo.test', subject: 'Hola', html: '<p>Hola</p>' })).rejects.toThrow(/Resend respondió 403/);
  });
});
