/**
 * Integración — material-service: módulo tributario (resumen, tope y PDFs).
 */
const request = require('supertest');
const app = require('../app');
const { prisma, bearer, crearBeneficiario, crearConstructora, crearMaterial } = require('../../../../test/helpers');

afterAll(() => prisma.$disconnect());

async function entregar({ cantidad, valor }) {
  const c = await crearConstructora();
  const b = await crearBeneficiario();
  const m = await crearMaterial(c.constructora, { cantidad: 100, valorUnitarioCop: valor });
  const s = await request(app).post(`/api/v1/materiales/${m.id}/solicitudes`).set(bearer(b.token))
    .send({ cantidadSolicitada: cantidad, propositoUso: 'Huerta comunitaria' });
  await request(app).patch(`/api/v1/solicitudes/${s.body.data.id}/estado`).set(bearer(c.token))
    .send({ estado: 'aprobada', instruccionesRetiro: 'Retiro en la obra principal' }).expect(200);
  await request(app).patch(`/api/v1/solicitudes/${s.body.data.id}/estado`).set(bearer(c.token)).send({ estado: 'entregada' }).expect(200);
  return { ...c, solicitudId: s.body.data.id, beneficiario: b };
}

describe('resumen tributario', () => {
  const anio = new Date().getFullYear();

  it('calcula valor donado y descuento estimado del 25 %', async () => {
    const { token } = await entregar({ cantidad: 10, valor: 40000 });
    const res = await request(app).get('/api/v1/tributario/resumen').set(bearer(token)).query({ anio });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ entregas: 1, valorDonadoCop: 400000, porcentaje: 25, descuentoEstimadoCop: 100000 });
  });

  it('aplica el tope del 25 % sobre el impuesto estimado', async () => {
    const { token } = await entregar({ cantidad: 10, valor: 40000 });
    const res = await request(app).get('/api/v1/tributario/resumen').set(bearer(token)).query({ anio, impuestoEstimado: 200000 });
    expect(res.body.data).toMatchObject({ topeCop: 50000, descuentoAplicableCop: 50000 });
  });

  it('genera la constancia y el resumen anual en PDF solo para la empresa dueña', async () => {
    const { token, solicitudId } = await entregar({ cantidad: 2, valor: 1000 });
    const otra = await crearConstructora();

    const pdf = await request(app).get(`/api/v1/tributario/constancias/${solicitudId}/pdf`).set(bearer(token));
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toMatch(/application\/pdf/);

    await request(app).get(`/api/v1/tributario/constancias/${solicitudId}/pdf`).set(bearer(otra.token)).expect(403);

    const anual = await request(app).get(`/api/v1/tributario/certificado/${anio}/pdf`).set(bearer(token));
    expect(anual.status).toBe(200);
    expect(anual.headers['content-type']).toMatch(/application\/pdf/);
  });

  it('un beneficiario no accede al módulo tributario', async () => {
    const { token } = await crearBeneficiario();
    await request(app).get('/api/v1/tributario/resumen').set(bearer(token)).expect(403);
  });
});
