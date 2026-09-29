/**
 * Integración — notification-service: bandeja propia y API interna protegida.
 */
const request = require('supertest');
const app = require('../app');
const { prisma, bearer, crearBeneficiario } = require('../../../../test/helpers');

afterAll(() => prisma.$disconnect());

const crear = (usuarioId, titulo) => prisma.notificacion.create({
  data: { usuarioId, tipo: 'cuenta', titulo, mensaje: 'Mensaje de prueba' },
});

describe('bandeja de notificaciones', () => {
  it('lista solo las propias con el conteo de no leídas', async () => {
    const yo = await crearBeneficiario();
    const otro = await crearBeneficiario();
    await crear(yo.usuario.id, 'Mía 1');
    await crear(yo.usuario.id, 'Mía 2');
    await crear(otro.usuario.id, 'Ajena');

    const res = await request(app).get('/api/v1/notificaciones').set(bearer(yo.token));
    expect(res.status).toBe(200);
    expect(res.body.data.items.map((n) => n.titulo).sort()).toEqual(['Mía 1', 'Mía 2']);
    expect(res.body.data.noLeidas).toBe(2);
  });

  it('no permite marcar ni borrar notificaciones de otro usuario', async () => {
    const yo = await crearBeneficiario();
    const otro = await crearBeneficiario();
    const ajena = await crear(otro.usuario.id, 'Ajena');
    const leer = await request(app).patch(`/api/v1/notificaciones/${ajena.id}/leer`).set(bearer(yo.token));
    const borrar = await request(app).delete(`/api/v1/notificaciones/${ajena.id}`).set(bearer(yo.token));
    expect(leer.status).toBe(403);
    expect(borrar.status).toBe(403);
    expect((await prisma.notificacion.findUnique({ where: { id: ajena.id } })).leida).toBe(false);
  });

  it('marca todas como leídas y borra solo las leídas', async () => {
    const yo = await crearBeneficiario();
    await crear(yo.usuario.id, 'A');
    await crear(yo.usuario.id, 'B');
    await request(app).patch('/api/v1/notificaciones/leer-todas').set(bearer(yo.token)).expect(200);
    const conteo = await request(app).get('/api/v1/notificaciones/no-leidas').set(bearer(yo.token));
    expect(conteo.body.data.total ?? conteo.body.data.noLeidas ?? conteo.body.data).toBe(0);
    await crear(yo.usuario.id, 'C');
    await request(app).delete('/api/v1/notificaciones/leidas').set(bearer(yo.token)).expect(200);
    expect(await prisma.notificacion.count({ where: { usuarioId: yo.usuario.id } })).toBe(1);
  });
});

describe('API interna', () => {
  it('rechaza peticiones sin la clave interna', async () => {
    const res = await request(app).post('/internal/emit').send({ usuarioIds: [], evento: 'notification', payload: {} });
    expect([401, 403]).toContain(res.status);
  });
});
