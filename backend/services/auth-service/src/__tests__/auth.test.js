/**
 * Tests de integración — Auth Service
 *
 * Prerrequisitos:
 *  - DATABASE_URL apunta a una DB de test (o se usa mock de Prisma)
 *  - Variables de entorno cargadas desde .env
 */

const request = require('supertest');
const app     = require('../app');
const { prisma } = require('@brickbybrick/shared');

const TEST_EMAIL    = `test_${Date.now()}@brickbybrick.co`;
const TEST_PASSWORD = 'Test1234!';
const TEST_CEDULA   = `9999${Date.now()}`.slice(0, 10);

afterAll(async () => {
  // Limpiar usuario de test
  await prisma.usuario.deleteMany({ where: { email: { startsWith: 'test_' } } });
  await prisma.$disconnect();
});

// ------------------------------------------------------------------
describe('POST /api/v1/auth/register/beneficiario', () => {
  it('registra correctamente un beneficiario', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/beneficiario')
      .send({
        email:          TEST_EMAIL,
        password:       TEST_PASSWORD,
        nombreCompleto: 'Usuario Test',
        cedula:         TEST_CEDULA,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(TEST_EMAIL);
  });

  it('rechaza email duplicado', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/beneficiario')
      .send({
        email:          TEST_EMAIL,
        password:       TEST_PASSWORD,
        nombreCompleto: 'Usuario Test 2',
        cedula:         `8888${Date.now()}`.slice(0, 10),
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rechaza contraseña débil', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/beneficiario')
      .send({
        email:          'nuevo@test.co',
        password:       '123',
        nombreCompleto: 'Test',
        cedula:         '11111111',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

// ------------------------------------------------------------------
describe('POST /api/v1/auth/login', () => {
  it('inicia sesión y devuelve accessToken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
  });

  it('rechaza contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'WrongPass1!' });

    expect(res.status).toBe(401);
  });

  it('rechaza email inexistente', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'noexiste@brickbybrick.co', password: TEST_PASSWORD });

    expect(res.status).toBe(401);
  });
});

// ------------------------------------------------------------------
describe('POST /api/v1/auth/logout', () => {
  it('limpia la cookie de refresh token', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
  });
});
