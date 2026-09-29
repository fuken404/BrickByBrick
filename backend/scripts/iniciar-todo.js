/**
 * Arranca el gateway y los seis microservicios en un solo contenedor.
 *
 * - Primero los seis microservicios; el gateway (único puerto público) se
 *   inicia cuando todos responden en /health. Así, mientras arrancan, la
 *   plataforma no envía visitantes a una aplicación a medio iniciar.
 * - Cada línea de log se prefija con el nombre del servicio.
 * - Si cualquier proceso termina, se detienen los demás y el contenedor sale
 *   con error para que la plataforma (Railway, Docker) lo reinicie.
 * - SIGTERM/SIGINT se reenvían para un apagado ordenado.
 *
 * Modos (variable PROCESOS):
 *   varios (por defecto) → un proceso Node por servicio: más aislamiento.
 *   uno                  → los 7 servicios (cada uno con su app y su puerto) en un
 *                          solo proceso que carga las librerías una vez. Pensado
 *                          para instancias con muy poca CPU/RAM (Render gratis):
 *                          arranca varias veces más rápido y usa menos memoria.
 */
const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

const http = require('http');

/** Microservicio → variable y puerto por defecto (igual que shared/config.js). */
const SERVICIOS = {
  'auth-service': ['PORT_AUTH', 3001],
  'user-service': ['PORT_USERS', 3002],
  'material-service': ['PORT_MATERIALS', 3003],
  'event-service': ['PORT_EVENTS', 3004],
  'publication-service': ['PORT_PUBS', 3005],
  'notification-service': ['PORT_NOTIF', 3006],
};
const ESPERA_MAXIMA_MS = 10 * 60 * 1000;

const raiz = path.resolve(__dirname, '..');
const hijos = new Map();
let apagando = false;

function prefijar(stream, nombre, salida) {
  readline.createInterface({ input: stream }).on('line', (linea) => salida.write(`[${nombre}] ${linea}\n`));
}

function detenerTodo(codigo) {
  if (apagando) return;
  apagando = true;
  for (const hijo of hijos.values()) hijo.kill('SIGTERM');
  // Si alguno no termina a tiempo, se fuerza la salida
  setTimeout(() => process.exit(codigo), 10_000).unref();
  const revisar = setInterval(() => {
    if ([...hijos.values()].every((h) => h.exitCode !== null || h.signalCode !== null)) {
      clearInterval(revisar);
      process.exit(codigo);
    }
  }, 200);
}

function iniciar(nombre) {
  const hijo = spawn(process.execPath, [path.join(raiz, 'services', nombre, 'src', 'index.js')], {
    cwd: raiz,
    env: { ...process.env, SERVICE_NAME: nombre },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  hijos.set(nombre, hijo);
  prefijar(hijo.stdout, nombre, process.stdout);
  prefijar(hijo.stderr, nombre, process.stderr);
  hijo.on('exit', (codigo, senal) => {
    if (apagando) return;
    process.stderr.write(`[iniciar-todo] ${nombre} terminó (código ${codigo ?? '-'}, señal ${senal ?? '-'}); se detiene el contenedor\n`);
    detenerTodo(1);
  });
}

const responde = (puerto) => new Promise((ok) => {
  const req = http.get({ host: '127.0.0.1', port: puerto, path: '/health', timeout: 2000 }, (res) => {
    res.resume();
    ok(res.statusCode === 200);
  });
  req.on('error', () => ok(false));
  req.on('timeout', () => { req.destroy(); ok(false); });
});

async function esperarServicios() {
  const inicio = Date.now();
  const puertos = Object.values(SERVICIOS).map(([variable, defecto]) => Number(process.env[variable]) || defecto);
  while (!apagando) {
    const listos = await Promise.all(puertos.map(responde));
    if (listos.every(Boolean)) return;
    if (Date.now() - inicio > ESPERA_MAXIMA_MS) {
      process.stderr.write('[iniciar-todo] Los servicios no respondieron a tiempo; se detiene el contenedor\n');
      detenerTodo(1);
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

const unSoloProceso = (process.env.PROCESOS || 'varios').toLowerCase() === 'uno';

/** Modo "uno": carga el servicio dentro de este mismo proceso (escucha en su puerto). */
function cargar(nombre) {
  process.stdout.write(`[iniciar-todo] Cargando ${nombre}\n`);
  require(path.join(raiz, 'services', nombre, 'src', 'index.js'));
}

(async () => {
  const arrancar = unSoloProceso ? cargar : iniciar;
  for (const nombre of Object.keys(SERVICIOS)) arrancar(nombre);
  await esperarServicios();
  if (apagando) return;
  process.stdout.write(`[iniciar-todo] Microservicios listos; iniciando el gateway\n`);
  arrancar('api-gateway');
})().catch((err) => {
  process.stderr.write(`[iniciar-todo] Error al arrancar: ${err.stack || err.message}\n`);
  process.exit(1);
});

// En modo "uno" el apagado lo manejan los propios servicios (startServer)
if (!unSoloProceso) for (const senal of ['SIGTERM', 'SIGINT']) process.on(senal, () => detenerTodo(0));
