/**
 * Gateway: enrutamiento por segmento completo, salud agregada y métrica TRP.
 * Los microservicios se simulan con servidores HTTP que responden su nombre.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const request = require('supertest');

const SERVICIOS = {
  AUTH_SERVICE_URL: 'auth', USER_SERVICE_URL: 'users', MATERIAL_SERVICE_URL: 'materials',
  EVENT_SERVICE_URL: 'events', PUB_SERVICE_URL: 'pubs', NOTIF_SERVICE_URL: 'notif',
};
const servidores = [];
let app;
let metricas;

beforeAll(async () => {
  for (const [variable, nombre] of Object.entries(SERVICIOS)) {
    const srv = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(req.url === '/health' ? { status: 'ok', db: 'ok' } : { servicio: nombre, url: req.url }));
    });
    await new Promise((ok) => srv.listen(0, ok));
    servidores.push(srv);
    process.env[variable] = `http://127.0.0.1:${srv.address().port}`;
  }
  // Frontend compilado de mentira para probar el modo "todo en uno"
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'bbb-dist-'));
  fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>SPA</title>');
  fs.writeFileSync(path.join(dist, 'main-ABCD1234.js'), 'console.log(1)');
  process.env.FRONTEND_DIST = dist;
  ({ app } = require('../app').crearGateway());
  metricas = require('../metrics');
});

afterAll(() => Promise.all(servidores.map((s) => new Promise((ok) => s.close(ok)))));

const destino = async (ruta) => (await request(app).get(ruta)).body.servicio;

describe('enrutamiento', () => {
  it.each([
    ['/api/v1/auth/login', 'auth'],
    ['/api/v1/public/estadisticas', 'users'],
    ['/api/v1/publicaciones', 'pubs'],
    ['/api/v1/publicaciones/abc/comentarios', 'pubs'],
    ['/api/v1/solicitudes/recibidas?estado=pendiente', 'materials'],
    ['/api/v1/tributario/resumen', 'materials'],
    ['/api/v1/eventos/mis-eventos', 'events'],
    ['/api/v1/notificaciones/no-leidas', 'notif'],
    ['/api/v1/me', 'users'],
    ['/api/v1/materiales/x/solicitudes', 'materials'],
  ])('%s → %s', async (ruta, servicio) => {
    expect(await destino(ruta)).toBe(servicio);
  });

  it('un prefijo parcial no se confunde con otro recurso', async () => {
    const res = await request(app).get('/api/v1/publicacionesfalsas');
    expect(res.status).toBe(404);
  });

  it('conserva la ruta y la consulta originales hacia el servicio', async () => {
    const res = await request(app).get('/api/v1/materiales?q=ladrillo&page=2');
    expect(res.body.url).toBe('/api/v1/materiales?q=ladrillo&page=2');
  });
});

describe('salud y métricas', () => {
  it('/health agrega el estado de los seis servicios', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.servicios).toHaveLength(6);
    expect(res.body.status).toBe('ok');
  });

  it('la métrica TRP cuenta también las subrutas', async () => {
    const antes = (nombre) => metricas.resumen().porServicio.find((s) => s.servicio === nombre)?.peticiones ?? 0;
    const pubs = antes('publication-service');
    const mats = antes('material-service');
    await request(app).get('/api/v1/publicaciones/uno/comentarios');
    await request(app).get('/api/v1/solicitudes/recibidas');
    await request(app).get('/api/v1/categorias');
    expect(antes('publication-service')).toBe(pubs + 1);
    expect(antes('material-service')).toBe(mats + 2);
  });

  it('el endpoint de rendimiento es exclusivo del administrador', async () => {
    await request(app).get('/api/v1/metricas/rendimiento').expect(401);
  });
});

describe('frontend compilado (imagen todo en uno)', () => {
  it('sirve index.html en la raíz y en las rutas de Angular sin caché', async () => {
    for (const ruta of ['/', '/beneficiario/materiales', '/restablecer-password/abc']) {
      const res = await request(app).get(ruta).set('Accept', 'text/html');
      expect(res.status).toBe(200);
      expect(res.text).toContain('<title>SPA</title>');
    }
    const res = await request(app).get('/login').set('Accept', 'text/html');
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('los archivos con hash se cachean de forma permanente', async () => {
    const res = await request(app).get('/main-ABCD1234.js');
    expect(res.headers['cache-control']).toContain('immutable');
  });

  it('no intercepta la API, el health ni rutas inexistentes de la API', async () => {
    expect((await request(app).get('/api/v1/materiales').set('Accept', 'text/html')).body.servicio).toBe('materials');
    expect((await request(app).get('/health')).body.servicios).toHaveLength(6);
    expect((await request(app).get('/api/v1/publicacionesfalsas').set('Accept', 'text/html')).status).toBe(404);
  });
});
