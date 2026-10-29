/**
 * Pruebas de desempeño (RNF-001, RNF-006, variable TRP).
 * Requiere la plataforma corriendo en BASE (por defecto http://localhost:3000)
 * con CLIENT_IP_HEADER=x-carga-ip, para que el limitador de peticiones trate
 * cada petición como un cliente distinto y se mida la aplicación, no el limitador.
 */
const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = process.argv[2] || path.join(__dirname, 'resultados');
const ipAleatoria = () => `10.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}`;

function correr({ nombre, metodo = 'GET', ruta, cuerpo, conexiones, duracion, cantidad }) {
  return new Promise((resolve, reject) => {
    const opciones = {
      url: BASE,
      connections: conexiones,
      timeout: 10,
      requests: [{
        method: metodo,
        path: ruta,
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
        setupRequest: (req) => ({ ...req, headers: { ...req.headers, 'x-carga-ip': ipAleatoria() } }),
      }],
    };
    if (cantidad) opciones.amount = cantidad; else opciones.duration = duracion;
    autocannon(opciones, (err, r) => {
      if (err) return reject(err);
      const fila = {
        escenario: nombre, metodo, ruta, conexiones,
        peticiones: r.requests.total,
        rps: Math.round(r.requests.average),
        promedioMs: Math.round(r.latency.average),
        p50Ms: r.latency.p50, p90Ms: r.latency.p90, p97_5Ms: r.latency.p97_5, p99Ms: r.latency.p99, maxMs: r.latency.max,
        respuestas2xx: r['2xx'], no2xx: r.non2xx, errores: r.errors, timeouts: r.timeouts,
      };
      console.log(`${nombre.padEnd(42)} c=${String(conexiones).padStart(3)}  n=${String(fila.peticiones).padStart(6)}  prom=${fila.promedioMs}ms  p97.5=${fila.p97_5Ms}ms  p99=${fila.p99Ms}ms  máx=${fila.maxMs}ms  no2xx=${fila.no2xx}  err=${fila.errores}  timeouts=${fila.timeouts}`);
      resolve(fila);
    });
  });
}

(async () => {
  const filas = [];
  console.log(`Pruebas de desempeño contra ${BASE}\n`);

  // 1) Latencia de un solo usuario (condiciones normales): 200 peticiones secuenciales por operación
  const individuales = [
    ['Salud del sistema (6 servicios)', '/health'],
    ['Catálogo de materiales (página 1)', '/api/v1/materiales?page=1&limit=12'],
    ['Búsqueda de materiales por texto', '/api/v1/materiales?q=ladrillo'],
    ['Listado de eventos', '/api/v1/eventos'],
    ['Feed de la comunidad', '/api/v1/publicaciones'],
    ['Estadísticas públicas', '/api/v1/public/estadisticas'],
  ];
  for (const [nombre, ruta] of individuales) {
    filas.push(await correr({ nombre: `Individual · ${nombre}`, ruta, conexiones: 1, cantidad: 200 }));
  }
  filas.push(await correr({
    nombre: 'Individual · Inicio de sesión (bcrypt 12)', metodo: 'POST', ruta: '/api/v1/auth/login',
    cuerpo: { email: 'beneficiario1@test.co', password: 'Test@1234' }, conexiones: 1, cantidad: 50,
  }));

  // 2) Concurrencia creciente sobre la operación más consultada (catálogo/búsqueda)
  for (const c of [10, 50, 100, 300]) {
    filas.push(await correr({ nombre: 'Concurrencia · Búsqueda de materiales', ruta: '/api/v1/materiales?q=ladrillo', conexiones: c, duracion: 20 }));
  }
  filas.push(await correr({ nombre: 'Concurrencia · Feed de la comunidad', ruta: '/api/v1/publicaciones', conexiones: 100, duracion: 20 }));
  filas.push(await correr({ nombre: 'Concurrencia · Listado de eventos', ruta: '/api/v1/eventos', conexiones: 100, duracion: 20 }));

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'carga.json'), JSON.stringify({ base: BASE, fecha: new Date().toISOString(), filas }, null, 2));
  console.log(`\nResultados guardados en ${path.join(OUT, 'carga.json')}`);
})().catch((e) => { console.error(e); process.exit(1); });
