/**
 * Variables de entorno para las pruebas. Se ejecuta antes de cada archivo de test.
 *
 * Usa TEST_DATABASE_URL si existe; si no, deriva la URL de DATABASE_URL (.env)
 * cambiando el nombre de la base a `brickbybrick_test`. Por seguridad, las
 * pruebas se niegan a correr contra una base cuyo nombre no termine en `_test`.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
const base = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};

function urlDePrueba() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const origen = process.env.DATABASE_URL || base.DATABASE_URL;
  if (!origen) throw new Error('Define TEST_DATABASE_URL o DATABASE_URL para ejecutar las pruebas');
  const url = new URL(origen);
  url.pathname = '/brickbybrick_test';
  return url.toString();
}

const databaseUrl = urlDePrueba();
const nombreBase = new URL(databaseUrl).pathname.replace(/^\//, '');
if (!nombreBase.endsWith('_test')) {
  throw new Error(`Las pruebas solo se ejecutan contra una base *_test (recibido: "${nombreBase}")`);
}

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: databaseUrl,
  MAIL_TRANSPORT: 'log',
  UPLOADS_DIR: path.join(os.tmpdir(), 'brickbybrick-test-uploads'),
  JWT_SECRET: base.JWT_SECRET || 'secreto-de-pruebas-access-0123456789abcdef',
  JWT_REFRESH_SECRET: base.JWT_REFRESH_SECRET || 'secreto-de-pruebas-refresh-0123456789abcdef',
  INTERNAL_API_KEY: base.INTERNAL_API_KEY || 'clave-interna-de-pruebas',
  FRONTEND_URL: 'http://localhost:4200',
});
