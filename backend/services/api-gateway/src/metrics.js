/**
 * Métrica TRP (Tiempo de Respuesta de la Plataforma) medida en el gateway:
 * latencia de cada petición proxificada, agregada por servicio.
 * Se conservan las últimas N muestras por servicio en memoria.
 */
const MAX_MUESTRAS = 2000;
const muestras = new Map(); // servicio -> number[] (ms)
const errores = new Map();  // servicio -> nº respuestas 5xx
const desde = new Date();

function registrar(servicio, ms, status) {
  const lista = muestras.get(servicio) || [];
  lista.push(ms);
  if (lista.length > MAX_MUESTRAS) lista.shift();
  muestras.set(servicio, lista);
  if (status >= 500) errores.set(servicio, (errores.get(servicio) || 0) + 1);
}

function percentil(ordenado, p) {
  if (!ordenado.length) return 0;
  const idx = Math.min(ordenado.length - 1, Math.ceil((p / 100) * ordenado.length) - 1);
  return ordenado[Math.max(0, idx)];
}

function resumen() {
  const porServicio = [];
  let todas = [];
  for (const [servicio, lista] of muestras) {
    const ordenado = [...lista].sort((a, b) => a - b);
    todas = todas.concat(lista);
    porServicio.push({
      servicio,
      peticiones: lista.length,
      promedioMs: Math.round(lista.reduce((s, v) => s + v, 0) / lista.length),
      p95Ms: Math.round(percentil(ordenado, 95)),
      errores5xx: errores.get(servicio) || 0,
      bajo3sPct: Math.round((lista.filter((v) => v < 3000).length / lista.length) * 1000) / 10,
    });
  }
  const ordenadoTotal = todas.sort((a, b) => a - b);
  return {
    desde,
    trpPromedioMs: todas.length ? Math.round(todas.reduce((s, v) => s + v, 0) / todas.length) : 0,
    trpP95Ms: Math.round(percentil(ordenadoTotal, 95)),
    peticiones: todas.length,
    porServicio: porServicio.sort((a, b) => a.servicio.localeCompare(b.servicio)),
  };
}

/** Middleware Express que mide la latencia de la respuesta. */
function medir(servicio) {
  return (req, res, next) => {
    const inicio = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
      registrar(servicio, ms, res.statusCode);
    });
    next();
  };
}

module.exports = { medir, resumen };
