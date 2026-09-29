/**
 * Integración — event-service: publicación, cupos, inscripciones, asistencia y exportación.
 */
const request = require('supertest');
const app = require('../app');
const {
  prisma, bearer, esperarHasta, localidad, crearBeneficiario, crearConstructora, crearMaterial, crearEvento,
} = require('../../../../test/helpers');

afterAll(() => prisma.$disconnect());

const inscribir = (token, id) => request(app).post(`/api/v1/eventos/${id}/inscripcion`).set(bearer(token));

describe('creación y publicación', () => {
  const datos = async (extra = {}) => {
    const inicio = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    return {
      nombre: 'Jornada de entrega en Bosa', tipoEvento: 'entrega_masiva', direccion: 'Parque principal de Bosa',
      fechaInicio: inicio.toISOString(), fechaFin: new Date(inicio.getTime() + 4 * 3600 * 1000).toISOString(),
      localidadId: (await localidad()).id, capacidadMaxima: 30, ...extra,
    };
  };

  it('publica respetando el estado solicitado y notifica a beneficiarios de la localidad', async () => {
    const { token } = await crearConstructora();
    const vecino = await crearBeneficiario({ loc: 'Bosa' });
    const res = await request(app).post('/api/v1/eventos').set(bearer(token)).send({ ...(await datos()), estado: 'publicado' });
    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('publicado');
    const aviso = await esperarHasta(() => prisma.notificacion.count({ where: { usuarioId: vecino.usuario.id, tipo: 'evento_nuevo' } }));
    expect(aviso).toBe(1);
  });

  it('una constructora sin verificar no puede publicar', async () => {
    const { token } = await crearConstructora({ verificada: false });
    await request(app).post('/api/v1/eventos').set(bearer(token)).send({ ...(await datos()), estado: 'publicado' }).expect(403);
  });

  it('rechaza fechas incoherentes y materiales de otra empresa', async () => {
    const { token } = await crearConstructora();
    const ajena = await crearConstructora();
    const m = await crearMaterial(ajena.constructora);
    const d = await datos();
    await request(app).post('/api/v1/eventos').set(bearer(token)).send({ ...d, fechaFin: d.fechaInicio }).expect(400);
    await request(app).post('/api/v1/eventos').set(bearer(token)).send({ ...d, materialIds: [m.id] }).expect(400);
  });

  it('solo se eliminan borradores', async () => {
    const { constructora, token } = await crearConstructora();
    const publicado = await crearEvento(constructora);
    const borrador = await crearEvento(constructora, { estado: 'borrador' });
    await request(app).delete(`/api/v1/eventos/${publicado.id}`).set(bearer(token)).expect(409);
    await request(app).delete(`/api/v1/eventos/${borrador.id}`).set(bearer(token)).expect(200);
  });
});

describe('inscripciones y cupos', () => {
  it('respeta la capacidad y permite reinscribirse tras cancelar', async () => {
    const { constructora } = await crearConstructora();
    const e = await crearEvento(constructora, { capacidadMaxima: 1 });
    const a = await crearBeneficiario();
    const b = await crearBeneficiario();

    await inscribir(a.token, e.id).expect(201);
    await inscribir(a.token, e.id).expect(409);
    await inscribir(b.token, e.id).expect(409);

    await request(app).delete(`/api/v1/eventos/${e.id}/inscripcion`).set(bearer(a.token)).expect(200);
    await inscribir(b.token, e.id).expect(201);
    await inscribir(a.token, e.id).expect(409);
  });

  it('inscripciones simultáneas no superan el cupo', async () => {
    const { constructora } = await crearConstructora();
    const e = await crearEvento(constructora, { capacidadMaxima: 2 });
    const beneficiarios = await Promise.all([1, 2, 3, 4].map(() => crearBeneficiario()));
    const res = await Promise.all(beneficiarios.map((b) => inscribir(b.token, e.id)));
    expect(res.filter((r) => r.status === 201)).toHaveLength(2);
    expect(await prisma.inscripcionEvento.count({ where: { eventoId: e.id, estado: 'inscrito' } })).toBe(2);
  });

  it('informa cupos disponibles y la inscripción del visitante', async () => {
    const { constructora } = await crearConstructora();
    const e = await crearEvento(constructora, { capacidadMaxima: 5 });
    const b = await crearBeneficiario();
    await inscribir(b.token, e.id).expect(201);
    const res = await request(app).get(`/api/v1/eventos/${e.id}`).set(bearer(b.token));
    expect(res.body.data).toMatchObject({ inscritos: 1, cuposDisponibles: 4, miInscripcion: 'inscrito' });
  });

  it('cancelar el evento notifica a los inscritos y cierra inscripciones', async () => {
    const { constructora, token } = await crearConstructora();
    const e = await crearEvento(constructora);
    const b = await crearBeneficiario();
    await inscribir(b.token, e.id).expect(201);

    await request(app).patch(`/api/v1/eventos/${e.id}/estado`).set(bearer(token)).send({ estado: 'cancelado' }).expect(400);
    await request(app).patch(`/api/v1/eventos/${e.id}/estado`).set(bearer(token)).send({ estado: 'cancelado', motivo: 'Lluvia fuerte' }).expect(200);
    expect(await esperarHasta(() => prisma.notificacion.count({ where: { usuarioId: b.usuario.id, tipo: 'evento_cancelado' } }))).toBe(1);

    const otro = await crearBeneficiario();
    await inscribir(otro.token, e.id).expect(400);
  });
});

describe('asistencia y exportación', () => {
  it('no permite marcar inscripciones de otro evento (IDOR)', async () => {
    const { constructora, token } = await crearConstructora();
    const hoy = await crearEvento(constructora, { dias: 0.02 });
    const otro = await crearEvento(constructora, { dias: 0.02 });
    const b = await crearBeneficiario();
    const insOtro = (await inscribir(b.token, otro.id)).body.data;

    await request(app).patch(`/api/v1/eventos/${hoy.id}/asistencia`).set(bearer(token))
      .send({ inscripciones: [{ id: insOtro.id, asistio: true }] }).expect(400);
    const res = await request(app).patch(`/api/v1/eventos/${otro.id}/asistencia`).set(bearer(token))
      .send({ inscripciones: [{ id: insOtro.id, asistio: true }] });
    expect(res.status).toBe(200);
    expect((await prisma.inscripcionEvento.findUnique({ where: { id: insOtro.id } })).estado).toBe('asistio');
  });

  it('solo la empresa organizadora ve los inscritos', async () => {
    const { constructora } = await crearConstructora();
    const ajena = await crearConstructora();
    const e = await crearEvento(constructora);
    await request(app).get(`/api/v1/eventos/${e.id}/inscritos`).set(bearer(ajena.token)).expect(403);
  });

  it('el CSV neutraliza fórmulas y escapa comillas', async () => {
    const { constructora, token } = await crearConstructora();
    const e = await crearEvento(constructora);
    const b = await crearBeneficiario({ nombre: '=HYPERLINK("http://x","clic")' });
    await inscribir(b.token, e.id).expect(201);
    const res = await request(app).get(`/api/v1/eventos/${e.id}/inscritos/export`).set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain(`"'=HYPERLINK(""http://x"",""clic"")"`);
  });
});
