/**
 * Arranca el gateway y los seis microservicios en un solo contenedor.
 *
 * - Cada línea de log se prefija con el nombre del servicio.
 * - Si cualquier proceso termina, se detienen los demás y el contenedor sale
 *   con error para que la plataforma (Railway, Docker) lo reinicie.
 * - SIGTERM/SIGINT se reenvían para un apagado ordenado.
 */
const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

const SERVICIOS = [
  'auth-service', 'user-service', 'material-service', 'event-service',
  'publication-service', 'notification-service', 'api-gateway',
];

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

for (const nombre of SERVICIOS) {
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

for (const senal of ['SIGTERM', 'SIGINT']) process.on(senal, () => detenerTodo(0));
