/**
 * Integración — auth-service: registro, login, refresh rotativo, MFA y suspensión.
 */
jest.mock('@brickbybrick/shared', () => ({
  ...jest.requireActual('@brickbybrick/shared'),
  generateOtp: jest.fn(() => '246810'),
  sendEmail: jest.fn(async () => undefined),
}));

const request = require('supertest');
const app = require('../app');
const { sendEmail } = require('@brickbybrick/shared');
const { prisma, PASSWORD, esperarHasta, localidad, crearBeneficiario, crearAdmin } = require('../../../../test/helpers');

const cookieDe = (res) => res.headers['set-cookie']?.find((c) => c.startsWith('refreshToken='))?.split(';')[0];

afterAll(() => prisma.$disconnect());

describe('registro de beneficiario', () => {
  const datos = async (extra = {}) => ({
    email: `nuevo_${Date.now()}@test.co`, password: 'Segura123', nombreCompleto: 'Persona Nueva',
    cedula: String(Date.now()).slice(-9), fechaNacimiento: '1990-05-10', localidadId: (await localidad('Suba')).id,
    telefono: '3009998877', aceptaTerminos: true, ...extra,
  });

  it('crea la cuenta sin exponer datos sensibles', async () => {
    const res = await request(app).post('/api/v1/auth/register/beneficiario').send(await datos());
    expect(res.status).toBe(201);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|password_hash/);
  });

  it('rechaza menores de edad, contraseñas débiles y términos no aceptados', async () => {
    const res = await request(app).post('/api/v1/auth/register/beneficiario')
      .send(await datos({ fechaNacimiento: '2015-01-01', password: 'abc', aceptaTerminos: false }));
    expect(res.status).toBe(400);
    const campos = res.body.errors.map((e) => e.field);
    expect(campos).toEqual(expect.arrayContaining(['fechaNacimiento', 'password', 'aceptaTerminos']));
  });

  it('no permite correos ni cédulas duplicadas', async () => {
    const d = await datos();
    await request(app).post('/api/v1/auth/register/beneficiario').send(d).expect(201);
    const res = await request(app).post('/api/v1/auth/register/beneficiario').send({ ...d, email: `otro_${Date.now()}@test.co` });
    expect(res.status).toBe(409);
  });
});

describe('login y sesión', () => {
  it('inicia sesión, registra el intento y entrega cookie de refresh httpOnly', async () => {
    const { usuario } = await crearBeneficiario();
    const res = await request(app).post('/api/v1/auth/login').send({ email: usuario.email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.mfaRequerido).toBe(false);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.headers['set-cookie'].join(';')).toMatch(/refreshToken=.*HttpOnly/i);
    const intentos = await prisma.intentoLogin.count({ where: { usuarioId: usuario.id, exito: true } });
    expect(intentos).toBe(1);
  });

  it('responde igual para correo inexistente y contraseña errada', async () => {
    const { usuario } = await crearBeneficiario();
    const a = await request(app).post('/api/v1/auth/login').send({ email: usuario.email, password: 'Otra1234' });
    const b = await request(app).post('/api/v1/auth/login').send({ email: 'nadie@test.co', password: 'Otra1234' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.message).toBe(b.body.message);
  });

  it('rota el refresh token y detecta su reutilización revocando todas las sesiones', async () => {
    const { usuario } = await crearBeneficiario();
    const login = await request(app).post('/api/v1/auth/login').send({ email: usuario.email, password: PASSWORD });
    const original = cookieDe(login);

    const r1 = await request(app).post('/api/v1/auth/refresh-token').set('Cookie', original);
    expect(r1.status).toBe(200);
    const rotada = cookieDe(r1);
    expect(rotada).not.toBe(original);

    // Reutilizar el token ya usado revoca también el rotado
    await request(app).post('/api/v1/auth/refresh-token').set('Cookie', original).expect(401);
    await request(app).post('/api/v1/auth/refresh-token').set('Cookie', rotada).expect(401);
  });

  it('logout invalida el refresh token', async () => {
    const { usuario } = await crearBeneficiario();
    const login = await request(app).post('/api/v1/auth/login').send({ email: usuario.email, password: PASSWORD });
    const cookie = cookieDe(login);
    await request(app).post('/api/v1/auth/logout').set('Cookie', cookie).expect(200);
    await request(app).post('/api/v1/auth/refresh-token').set('Cookie', cookie).expect(401);
  });

  it('una cuenta suspendida no puede ingresar ni renovar su sesión', async () => {
    const { usuario } = await crearBeneficiario();
    const login = await request(app).post('/api/v1/auth/login').send({ email: usuario.email, password: PASSWORD });
    await prisma.usuario.update({ where: { id: usuario.id }, data: { estado: 'suspendido' } });
    await request(app).post('/api/v1/auth/refresh-token').set('Cookie', cookieDe(login)).expect(401);
    const res = await request(app).post('/api/v1/auth/login').send({ email: usuario.email, password: PASSWORD });
    expect(res.status).toBe(403);
  });
});

describe('verificación en dos pasos (MFA)', () => {
  it('es obligatoria para administradores y emite la sesión con el código correcto', async () => {
    const { usuario } = await crearAdmin();
    const paso1 = await request(app).post('/api/v1/auth/login').send({ email: usuario.email, password: PASSWORD });
    expect(paso1.status).toBe(200);
    expect(paso1.body.data).toMatchObject({ mfaRequerido: true, desafioId: expect.any(String) });
    expect(paso1.body.data.accessToken).toBeUndefined();

    await request(app).post('/api/v1/auth/mfa/verificar').send({ desafioId: paso1.body.data.desafioId, codigo: '000000' }).expect(401);
    const paso2 = await request(app).post('/api/v1/auth/mfa/verificar').send({ desafioId: paso1.body.data.desafioId, codigo: '246810' });
    expect(paso2.status).toBe(200);
    expect(paso2.body.data.accessToken).toEqual(expect.any(String));

    // El desafío es de un solo uso
    await request(app).post('/api/v1/auth/mfa/verificar').send({ desafioId: paso1.body.data.desafioId, codigo: '246810' }).expect(401);
  });

  it('bloquea el desafío tras 5 intentos fallidos', async () => {
    const { usuario } = await crearAdmin();
    const paso1 = await request(app).post('/api/v1/auth/login').send({ email: usuario.email, password: PASSWORD });
    const { desafioId } = paso1.body.data;
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/v1/auth/mfa/verificar').send({ desafioId, codigo: '111111' }).expect(401);
    }
    await request(app).post('/api/v1/auth/mfa/verificar').send({ desafioId, codigo: '246810' }).expect(401);
  });

  it('un administrador no puede desactivarla', async () => {
    const { token } = await crearAdmin();
    const res = await request(app).patch('/api/v1/auth/mfa').set('Authorization', `Bearer ${token}`).send({ habilitar: false, password: PASSWORD });
    expect(res.status).toBe(403);
  });

  it('un beneficiario puede activarla confirmando su contraseña', async () => {
    const { usuario, token } = await crearBeneficiario();
    await request(app).patch('/api/v1/auth/mfa').set('Authorization', `Bearer ${token}`).send({ habilitar: true, password: 'Mala1234' }).expect(400);
    await request(app).patch('/api/v1/auth/mfa').set('Authorization', `Bearer ${token}`).send({ habilitar: true, password: PASSWORD }).expect(200);
    const login = await request(app).post('/api/v1/auth/login').send({ email: usuario.email, password: PASSWORD });
    expect(login.body.data.mfaRequerido).toBe(true);
  });
});

describe('cambio de contraseña', () => {
  it('exige la contraseña actual y revoca las demás sesiones', async () => {
    const { usuario, token } = await crearBeneficiario();
    const otraSesion = await request(app).post('/api/v1/auth/login').send({ email: usuario.email, password: PASSWORD });

    await request(app).patch('/api/v1/auth/password').set('Authorization', `Bearer ${token}`)
      .send({ passwordActual: 'Incorrecta1', passwordNueva: 'NuevaClave9' }).expect(400);
    const res = await request(app).patch('/api/v1/auth/password').set('Authorization', `Bearer ${token}`)
      .send({ passwordActual: PASSWORD, passwordNueva: 'NuevaClave9' });
    expect(res.status).toBe(200);

    await request(app).post('/api/v1/auth/refresh-token').set('Cookie', cookieDe(otraSesion)).expect(401);
    await request(app).post('/api/v1/auth/login').send({ email: usuario.email, password: 'NuevaClave9' }).expect(200);
  });
});

describe('olvidé mi contraseña', () => {
  /** Pide el enlace y devuelve el token que llegó por correo. */
  async function solicitarEnlace(email) {
    sendEmail.mockClear();
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email });
    expect(res.status).toBe(200);
    const correo = await esperarHasta(() => sendEmail.mock.calls.find(([c]) => c.to === email)?.[0]);
    return correo?.html.match(/restablecer-password\/([a-f0-9]+)/)[1];
  }

  it('responde lo mismo exista o no la cuenta, y solo envía correo si existe', async () => {
    const { usuario } = await crearBeneficiario();
    sendEmail.mockClear();
    const a = await request(app).post('/api/v1/auth/forgot-password').send({ email: usuario.email });
    const b = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'no-existe@test.co' });
    expect(a.status).toBe(200);
    expect(b.body.message).toBe(a.body.message);
    await esperarHasta(() => sendEmail.mock.calls.length > 0);
    await new Promise((r) => setTimeout(r, 100));
    expect(sendEmail.mock.calls.map(([c]) => c.to)).toEqual([usuario.email]);
  });

  it('flujo completo: validar enlace, cambiar contraseña, cerrar sesiones y no reutilizar el enlace', async () => {
    const { usuario } = await crearBeneficiario();
    const sesion = await request(app).post('/api/v1/auth/login').send({ email: usuario.email, password: PASSWORD });
    const token = await solicitarEnlace(usuario.email);
    expect(token).toEqual(expect.any(String));

    const validar = await request(app).get(`/api/v1/auth/reset-password/${token}`);
    expect(validar.status).toBe(200);
    expect(validar.body.data.emailParcial).toMatch(/^.{2}•••@test\.co$/);

    await request(app).post(`/api/v1/auth/reset-password/${token}`).send({ password: 'debil' }).expect(400);
    await request(app).post(`/api/v1/auth/reset-password/${token}`).send({ password: 'Restablecida1' }).expect(200);

    await request(app).post('/api/v1/auth/refresh-token').set('Cookie', cookieDe(sesion)).expect(401);
    await request(app).post('/api/v1/auth/login').send({ email: usuario.email, password: 'Restablecida1' }).expect(200);
    await request(app).get(`/api/v1/auth/reset-password/${token}`).expect(400);
    await request(app).post(`/api/v1/auth/reset-password/${token}`).send({ password: 'OtraClave22' }).expect(400);
  });

  it('un enlace nuevo invalida el anterior', async () => {
    const { usuario } = await crearBeneficiario();
    const viejo = await solicitarEnlace(usuario.email);
    const nuevo = await solicitarEnlace(usuario.email);
    await request(app).get(`/api/v1/auth/reset-password/${viejo}`).expect(400);
    await request(app).get(`/api/v1/auth/reset-password/${nuevo}`).expect(200);
  });

  it('el mismo enlace enviado dos veces a la vez solo cambia la contraseña una vez', async () => {
    const { usuario } = await crearBeneficiario();
    const token = await solicitarEnlace(usuario.email);
    const res = await Promise.all(['Primera111A', 'Segunda22B'].map((password) =>
      request(app).post(`/api/v1/auth/reset-password/${token}`).send({ password })));
    expect(res.map((r) => r.status).sort()).toEqual([200, 400]);
  });

  it('una cuenta suspendida no puede usar el enlace', async () => {
    const { usuario } = await crearBeneficiario();
    const token = await solicitarEnlace(usuario.email);
    await prisma.usuario.update({ where: { id: usuario.id }, data: { estado: 'suspendido' } });
    await request(app).post(`/api/v1/auth/reset-password/${token}`).send({ password: 'Restablecida1' }).expect(400);
  });
});
