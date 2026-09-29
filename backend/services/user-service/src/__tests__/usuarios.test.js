/**
 * Integración — user-service: perfil propio, perfiles públicos, administración y métricas.
 */
const request = require('supertest');
const app = require('../app');
const {
  prisma, bearer, PASSWORD, localidad, crearBeneficiario, crearConstructora, crearAdmin,
} = require('../../../../test/helpers');

afterAll(() => prisma.$disconnect());

describe('perfil propio', () => {
  it('actualiza datos permitidos y rechaza la cédula (solo admin)', async () => {
    const { beneficiario, token } = await crearBeneficiario();
    const suba = await localidad('Suba');
    const ok = await request(app).put(`/api/v1/beneficiarios/${beneficiario.id}`).set(bearer(token))
      .send({ nombreCompleto: 'Nombre Actualizado', genero: 'femenino', estrato: 2, localidadId: suba.id });
    expect(ok.status).toBe(200);
    expect(ok.body.data.localidad.nombre).toBe('Suba');
    await request(app).put(`/api/v1/beneficiarios/${beneficiario.id}`).set(bearer(token)).send({ cedula: '123456789' }).expect(400);
  });

  it('un beneficiario no puede editar a otro', async () => {
    const a = await crearBeneficiario();
    const b = await crearBeneficiario();
    await request(app).put(`/api/v1/beneficiarios/${b.beneficiario.id}`).set(bearer(a.token)).send({ nombreCompleto: 'Intruso' }).expect(403);
  });

  it('la constructora no puede cambiar su NIT', async () => {
    const { constructora, token } = await crearConstructora();
    await request(app).put(`/api/v1/constructoras/${constructora.id}`).set(bearer(token)).send({ nit: '900000000-1' }).expect(400);
    await request(app).put(`/api/v1/constructoras/${constructora.id}`).set(bearer(token)).send({ descripcion: 'Obras sostenibles' }).expect(200);
  });

  it('guarda teléfono y preferencias de notificación', async () => {
    const { token } = await crearBeneficiario();
    const res = await request(app).patch('/api/v1/me').set(bearer(token)).send({ telefono: '3105550000', preferenciasNotif: { email: false, inApp: true } });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ telefono: '3105550000', preferenciasNotif: { email: false, inApp: true } });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
  });

  it('eliminar la cuenta exige contraseña y anonimiza los datos', async () => {
    const { usuario, token } = await crearBeneficiario();
    await request(app).post('/api/v1/me/eliminar').set(bearer(token)).send({ password: 'Mala12345', confirmacion: 'ELIMINAR' }).expect(400);
    await request(app).post('/api/v1/me/eliminar').set(bearer(token)).send({ password: PASSWORD, confirmacion: 'ELIMINAR' }).expect(200);
    const despues = await prisma.usuario.findUnique({ where: { id: usuario.id }, include: { beneficiario: true } });
    expect(despues.estado).toBe('inactivo');
    expect(despues.email).not.toBe(usuario.email);
  });
});

describe('perfiles públicos', () => {
  it('no exponen correo, cédula ni NIT', async () => {
    const b = await crearBeneficiario();
    const c = await crearConstructora();
    const pb = await request(app).get(`/api/v1/perfiles/${b.usuario.id}`);
    const pc = await request(app).get(`/api/v1/perfiles/${c.usuario.id}`);
    expect(pb.status).toBe(200);
    expect(pc.status).toBe(200);
    const texto = JSON.stringify([pb.body, pc.body]);
    expect(texto).not.toContain(b.usuario.email);
    expect(texto).not.toContain(b.beneficiario.cedula);
    expect(texto).not.toContain(c.constructora.nit);
  });

  it('el listado público de constructoras solo muestra verificadas y sin NIT', async () => {
    const pendiente = await crearConstructora({ verificada: false });
    const res = await request(app).get('/api/v1/constructoras').query({ limit: 100 });
    expect(res.body.data.items.map((c) => c.id)).not.toContain(pendiente.constructora.id);
    expect(JSON.stringify(res.body)).not.toMatch(/"nit"/);
  });
});

describe('administración', () => {
  it('rutas de administración exigen rol ADMINISTRADOR', async () => {
    const { token } = await crearConstructora();
    await request(app).get('/api/v1/admin/dashboard').set(bearer(token)).expect(403);
    await request(app).get('/api/v1/admin/dashboard').expect(401);
  });

  it('suspender revoca las sesiones y reactivar las permite de nuevo', async () => {
    const { token: ta } = await crearAdmin();
    const { usuario } = await crearBeneficiario();
    await prisma.tokenUsuario.create({ data: { usuarioId: usuario.id, tipo: 'refresh', tokenHash: `h_${usuario.id}`, expiresAt: new Date(Date.now() + 86400000) } });

    await request(app).patch(`/api/v1/admin/usuarios/${usuario.id}/estado`).set(bearer(ta)).send({ estado: 'suspendido', motivo: 'Uso indebido' }).expect(200);
    expect(await prisma.tokenUsuario.count({ where: { usuarioId: usuario.id, tipo: 'refresh', usado: false } })).toBe(0);
    expect((await prisma.usuario.findUnique({ where: { id: usuario.id } })).estado).toBe('suspendido');

    await request(app).patch(`/api/v1/admin/usuarios/${usuario.id}/estado`).set(bearer(ta)).send({ estado: 'activo' }).expect(200);
  });

  it('verifica o rechaza constructoras con motivo y deja auditoría', async () => {
    const { usuario: admin, token: ta } = await crearAdmin();
    const { constructora } = await crearConstructora({ verificada: false });
    await request(app).patch(`/api/v1/admin/constructoras/${constructora.id}/verificacion`).set(bearer(ta)).send({ aprobar: false }).expect(400);
    const rechazo = await request(app).patch(`/api/v1/admin/constructoras/${constructora.id}/verificacion`).set(bearer(ta)).send({ aprobar: false, motivo: 'RUT ilegible' });
    expect(rechazo.body.data).toMatchObject({ verificada: false, motivoRechazo: 'RUT ilegible' });
    const ok = await request(app).patch(`/api/v1/admin/constructoras/${constructora.id}/verificacion`).set(bearer(ta)).send({ aprobar: true });
    expect(ok.body.data.verificada).toBe(true);
    expect(await prisma.auditoria.count({ where: { usuarioId: admin.id, entidadId: constructora.id } })).toBeGreaterThanOrEqual(2);
  });

  it('configuración validada y persistida', async () => {
    const { token: ta } = await crearAdmin();
    const actual = (await request(app).get('/api/v1/admin/configuracion').set(bearer(ta))).body.data;
    await request(app).put('/api/v1/admin/configuracion').set(bearer(ta)).send({ ...actual, porcentajeDescuentoTributario: 150 }).expect(400);
    const res = await request(app).put('/api/v1/admin/configuracion').set(bearer(ta)).send({ ...actual, maxSolicitudesActivasBeneficiario: 7 });
    expect(res.body.data.maxSolicitudesActivasBeneficiario).toBe(7);
    await request(app).put('/api/v1/admin/configuracion').set(bearer(ta)).send(actual).expect(200);
  });

  it('métricas IPE, TPA y TEA con la forma esperada', async () => {
    const { token: ta } = await crearAdmin();
    const res = await request(app).get('/api/v1/admin/metricas').set(bearer(ta)).query({ dias: 30 });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      ipe: { ipe: expect.any(Number), cupos: expect.any(Number) },
      tpa: { tpaDias: expect.any(Number) },
      tea: { tea: expect.any(Number), intentos: expect.any(Number) },
      impacto: { valorDonadoCop: expect.any(Number) },
    });
  });

  it('exporta CSV con BOM y sin columnas sensibles de contraseña', async () => {
    const { token: ta } = await crearAdmin();
    const res = await request(app).get('/api/v1/admin/exportar/usuarios').set(bearer(ta));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text.charCodeAt(0)).toBe(0xfeff);
    expect(res.text).not.toMatch(/password/i);
  });
});
