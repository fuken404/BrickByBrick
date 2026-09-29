const prisma = require('./prisma.client');

/** Parámetros operativos editables por el administrador. */
const DEFAULTS = {
  maxSolicitudesActivasBeneficiario: 5,
  maxFotosMaterial: 5,
  diasRecordatorioVencimiento: 3,
  umbralReportesOcultar: 5,
  porcentajeDescuentoTributario: 25,
  topeDescuentoSobreImpuesto: 25,
  emailSoporte: 'soporte@brickbybrick.co',
  modoMantenimiento: false,
};

const TTL_MS = 60 * 1000;
let cache = null;
let cacheAt = 0;

async function obtenerConfiguracion() {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache;
  const filas = await prisma.configuracionSistema.findMany();
  const valores = { ...DEFAULTS };
  for (const f of filas) if (f.clave in DEFAULTS) valores[f.clave] = f.valor;
  cache = valores;
  cacheAt = Date.now();
  return valores;
}

async function obtenerParametro(clave) {
  const cfg = await obtenerConfiguracion();
  return cfg[clave];
}

function invalidarConfiguracion() {
  cache = null;
}

module.exports = { DEFAULTS, obtenerConfiguracion, obtenerParametro, invalidarConfiguracion };
