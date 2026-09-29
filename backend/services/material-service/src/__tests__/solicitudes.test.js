/**
 * Integración — material-service: catálogo, máquina de estados de solicitudes,
 * control de stock y permisos.
 */
const request = require('supertest');
const app = require('../app');
const { prisma, bearer, crearBeneficiario, crearConstructora, crearAdmin, crearMaterial } = require('../../../../test/helpers');

afterAll(() => prisma.$disconnect());

const solicitar = (token, materialId, cantidadSolicitada, extra = {}) =>
  request(app).post(`/api/v1/materiales/${materialId}/solicitudes`).set(bearer(token))
    .send({ cantidadSolicitada, propositoUso: 'Mejoramiento de vivienda', ...extra });

const cambiar = (token, id, body) => request(app).patch(`/api/v1/solicitudes/${id}/estado`).set(bearer(token)).send(body);
const APROBAR = { estado: 'aprobada', instruccionesRetiro: 'Retiro en obra de 8 a 16 h' };
const stock = async (id) => Number((await prisma.material.findUnique({ where: { id } })).cantidad);

describe('catálogo público', () => {
  it('solo muestra materiales activos y no expone datos de contacto de la empresa', async () => {
    const { constructora } = await crearConstructora();
    const activo = await crearMaterial(constructora, { nombre: `Visible ${Date.now()}` });
    const borrador = await crearMaterial(constructora, { nombre: `Oculto ${Date.now()}`, estadoPublicacion: 'borrador' });
    const res = await request(app).get('/api/v1/materiales').query({ constructoraId: constructora.id, limit: 50 });
    expect(res.status).toBe(200);
    const ids = res.body.data.items.map((m) => m.id);
    expect(ids).toContain(activo.id);
    expect(ids).not.toContain(borrador.id);
    expect(JSON.stringify(res.body)).not.toMatch(/"nit"|"email"|passwordHash/);
  });

  it('la búsqueda por texto no muestra materiales vencidos', async () => {
    const { constructora } = await crearConstructora();
    const nombre = `Ladrillo único ${Date.now()}`;
    const m = await crearMaterial(constructora, { nombre });
    await prisma.material.update({ where: { id: m.id }, data: { fechaLimite: new Date(Date.now() - 2 * 24 * 3600 * 1000) } });
    const res = await request(app).get('/api/v1/materiales').query({ q: nombre });
    expect(res.body.data.items).toHaveLength(0);
  });
});

describe('publicación de materiales', () => {
  const datos = { categoriaId: 1, nombre: 'Bloque de concreto', estadoMaterial: 'nuevo', cantidad: 10, unidadMedida: 'unidades', valorUnitarioCop: 2500 };

  it('una constructora sin verificar solo puede guardar borradores', async () => {
    const { token } = await crearConstructora({ verificada: false });
    await request(app).post('/api/v1/materiales').set(bearer(token)).send({ ...datos, estadoPublicacion: 'activo' }).expect(403);
    await request(app).post('/api/v1/materiales').set(bearer(token)).send({ ...datos, estadoPublicacion: 'borrador' }).expect(201);
  });

  it('exige valor unitario para publicar y rechaza campos no permitidos', async () => {
    const { token } = await crearConstructora();
    const { valorUnitarioCop, ...sinValor } = datos;
    await request(app).post('/api/v1/materiales').set(bearer(token)).send({ ...sinValor, estadoPublicacion: 'activo' }).expect(400);
    await request(app).post('/api/v1/materiales').set(bearer(token)).send({ ...datos, constructoraId: '00000000-0000-0000-0000-000000000000' }).expect(400);
  });

  it('otra constructora no puede editar ni eliminar el material', async () => {
    const { constructora } = await crearConstructora();
    const otra = await crearConstructora();
    const m = await crearMaterial(constructora);
    await request(app).put(`/api/v1/materiales/${m.id}`).set(bearer(otra.token)).send({ nombre: 'Hackeado' }).expect(403);
    await request(app).delete(`/api/v1/materiales/${m.id}`).set(bearer(otra.token)).expect(403);
  });
});

describe('máquina de estados de solicitudes', () => {
  it('flujo completo: solicitar → aprobar (reserva stock) → entregar (constancia) → confirmar y calificar', async () => {
    const { constructora, token: tc } = await crearConstructora();
    const { token: tb } = await crearBeneficiario();
    const m = await crearMaterial(constructora, { cantidad: 20, valorUnitarioCop: 1500 });

    const creada = await solicitar(tb, m.id, 8);
    expect(creada.status).toBe(201);
    const id = creada.body.data.id;
    expect(await stock(m.id)).toBe(20);

    await cambiar(tc, id, APROBAR).expect(200);
    expect(await stock(m.id)).toBe(12);

    const entregada = await cambiar(tc, id, { estado: 'entregada' });
    expect(entregada.status).toBe(200);
    expect(entregada.body.data.valorDonadoCop).toBe(12000);
    expect(entregada.body.data.numeroConstancia).toMatch(/^BBB-\d{4}-\d{6}$/);

    const conf = await request(app).post(`/api/v1/solicitudes/${id}/confirmar-recepcion`).set(bearer(tb)).send({ calificacion: 5, comentarioCalificacion: 'Excelente' });
    expect(conf.status).toBe(200);
    expect(conf.body.data.fechaConfirmacion).toEqual(expect.any(String));
    await request(app).post(`/api/v1/solicitudes/${id}/confirmar-recepcion`).set(bearer(tb)).send({}).expect(409);
  });

  it('no permite saltar estados ni aprobar dos veces', async () => {
    const { constructora, token: tc } = await crearConstructora();
    const { token: tb } = await crearBeneficiario();
    const m = await crearMaterial(constructora, { cantidad: 10 });
    const { body } = await solicitar(tb, m.id, 4);
    await cambiar(tc, body.data.id, { estado: 'entregada' }).expect(400);
    await cambiar(tc, body.data.id, APROBAR).expect(200);
    await cambiar(tc, body.data.id, APROBAR).expect(400);
    expect(await stock(m.id)).toBe(6);
  });

  it('exige instrucciones al aprobar y motivo al rechazar', async () => {
    const { constructora, token: tc } = await crearConstructora();
    const { token: tb } = await crearBeneficiario();
    const m = await crearMaterial(constructora);
    const { body } = await solicitar(tb, m.id, 1);
    await cambiar(tc, body.data.id, { estado: 'aprobada' }).expect(400);
    await cambiar(tc, body.data.id, { estado: 'rechazada' }).expect(400);
    await cambiar(tc, body.data.id, { estado: 'rechazada', motivo: 'Material comprometido' }).expect(200);
  });

  it('no permite más cantidad de la disponible ni solicitudes activas duplicadas', async () => {
    const { constructora } = await crearConstructora();
    const { token: tb } = await crearBeneficiario();
    const m = await crearMaterial(constructora, { cantidad: 5 });
    await solicitar(tb, m.id, 6).expect(400);
    await solicitar(tb, m.id, 2).expect(201);
    await solicitar(tb, m.id, 1).expect(409);
  });

  it('un doble envío simultáneo crea una sola solicitud', async () => {
    const { constructora } = await crearConstructora();
    const { beneficiario, token: tb } = await crearBeneficiario();
    const m = await crearMaterial(constructora, { cantidad: 50 });
    const res = await Promise.all([1, 2, 3].map(() => solicitar(tb, m.id, 2)));
    expect(res.map((r) => r.status).sort()).toEqual([201, 409, 409]);
    expect(await prisma.solicitudMaterial.count({ where: { materialId: m.id, beneficiarioId: beneficiario.id } })).toBe(1);
  });

  it('permite volver a solicitar tras un rechazo', async () => {
    const { constructora, token: tc } = await crearConstructora();
    const { token: tb } = await crearBeneficiario();
    const m = await crearMaterial(constructora);
    const { body } = await solicitar(tb, m.id, 1);
    await cambiar(tc, body.data.id, { estado: 'rechazada', motivo: 'Ya fue reservado' }).expect(200);
    await solicitar(tb, m.id, 1).expect(201);
  });

  it('agota el material cuando se reserva todo y lo reactiva al cancelar', async () => {
    const { constructora, token: tc } = await crearConstructora();
    const { token: tb } = await crearBeneficiario();
    const m = await crearMaterial(constructora, { cantidad: 3 });
    const { body } = await solicitar(tb, m.id, 3);
    await cambiar(tc, body.data.id, APROBAR).expect(200);
    expect((await prisma.material.findUnique({ where: { id: m.id } })).estadoPublicacion).toBe('agotado');

    await cambiar(tc, body.data.id, { estado: 'cancelada', motivo: 'El beneficiario no se presentó' }).expect(200);
    const despues = await prisma.material.findUnique({ where: { id: m.id } });
    expect(Number(despues.cantidad)).toBe(3);
    expect(despues.estadoPublicacion).toBe('activo');
  });

  it('dos aprobaciones simultáneas nunca dejan stock negativo', async () => {
    const { constructora, token: tc } = await crearConstructora();
    const b1 = await crearBeneficiario();
    const b2 = await crearBeneficiario();
    const m = await crearMaterial(constructora, { cantidad: 10 });
    const s1 = (await solicitar(b1.token, m.id, 7)).body.data.id;
    const s2 = (await solicitar(b2.token, m.id, 7)).body.data.id;

    const [r1, r2] = await Promise.all([cambiar(tc, s1, APROBAR), cambiar(tc, s2, APROBAR)]);
    expect([r1.status, r2.status].sort()).toEqual([200, 409]);
    expect(await stock(m.id)).toBe(3);
  });

  it('el beneficiario cancela su solicitud aprobada y el stock se repone', async () => {
    const { constructora, token: tc } = await crearConstructora();
    const { token: tb } = await crearBeneficiario();
    const m = await crearMaterial(constructora, { cantidad: 10 });
    const { body } = await solicitar(tb, m.id, 4);
    await cambiar(tc, body.data.id, APROBAR).expect(200);
    const res = await request(app).post(`/api/v1/solicitudes/${body.data.id}/cancelar`).set(bearer(tb)).send({ motivo: 'Ya no lo necesito' });
    expect(res.status).toBe(200);
    expect(await stock(m.id)).toBe(10);
  });
});

describe('permisos y privacidad', () => {
  it('otra constructora ni otro beneficiario pueden operar la solicitud', async () => {
    const { constructora } = await crearConstructora();
    const otra = await crearConstructora();
    const { token: tb } = await crearBeneficiario();
    const intruso = await crearBeneficiario();
    const m = await crearMaterial(constructora);
    const { body } = await solicitar(tb, m.id, 1);

    await cambiar(otra.token, body.data.id, APROBAR).expect(403);
    await request(app).post(`/api/v1/solicitudes/${body.data.id}/cancelar`).set(bearer(intruso.token)).send({}).expect(403);
    await request(app).get(`/api/v1/solicitudes/${body.data.id}`).set(bearer(intruso.token)).expect(403);
  });

  it('la constructora solo ve el contacto del beneficiario después de aprobar', async () => {
    const { constructora, token: tc } = await crearConstructora();
    const { token: tb } = await crearBeneficiario();
    const m = await crearMaterial(constructora);
    const { body } = await solicitar(tb, m.id, 1);

    const pendiente = await request(app).get('/api/v1/solicitudes/recibidas').set(bearer(tc)).query({ estado: 'pendiente' });
    const antes = pendiente.body.data.items.find((s) => s.id === body.data.id);
    expect(antes.beneficiario.usuario).toBeNull();
    expect(antes.beneficiario.cedula).toBeNull();

    await cambiar(tc, body.data.id, APROBAR).expect(200);
    const aprobada = await request(app).get('/api/v1/solicitudes/recibidas').set(bearer(tc)).query({ estado: 'aprobada' });
    const despues = aprobada.body.data.items.find((s) => s.id === body.data.id);
    expect(despues.beneficiario.usuario.email).toEqual(expect.any(String));
  });

  it('solo el administrador lista todas las solicitudes', async () => {
    const { token: tb } = await crearBeneficiario();
    const { token: ta } = await crearAdmin();
    await request(app).get('/api/v1/solicitudes').set(bearer(tb)).expect(403);
    await request(app).get('/api/v1/solicitudes').set(bearer(ta)).expect(200);
  });
});
