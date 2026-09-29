/**
 * Gateway con STORAGE_DRIVER=db: los archivos subidos se guardan en
 * PostgreSQL y se sirven desde /uploads (plataformas sin disco persistente).
 */
const request = require('supertest');

let app;
let almacenamiento;
let prisma;

beforeAll(() => {
  process.env.STORAGE_DRIVER = 'db';
  ({ prisma } = require('@brickbybrick/shared'));
  almacenamiento = require('@brickbybrick/shared');
  ({ app } = require('../app').crearGateway());
});

afterAll(async () => {
  delete process.env.STORAGE_DRIVER;
  await prisma.$disconnect();
});

describe('almacenamiento de archivos en la base de datos', () => {
  it('guarda, sirve con caché permanente y elimina un archivo', async () => {
    const contenido = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
    const ruta = await almacenamiento.uploadToStorage(contenido, 'materiales', 'foto.png', 'image/png');
    expect(ruta).toMatch(/^\/uploads\/materiales\/\d+-[a-f0-9]{12}\.png$/);

    const res = await request(app).get(ruta).buffer(true).parse((r, cb) => {
      const partes = [];
      r.on('data', (c) => partes.push(c));
      r.on('end', () => cb(null, Buffer.concat(partes)));
    });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['cache-control']).toContain('immutable');
    expect(Buffer.compare(res.body, contenido)).toBe(0);

    await almacenamiento.deleteFromStorage(ruta);
    await request(app).get(ruta).expect(404);
  });

  it('no permite rutas con caracteres fuera del patrón', async () => {
    await request(app).get('/uploads/../etc/passwd').expect(404);
    await request(app).get('/uploads/materiales/no-existe.png').expect(404);
  });
});
