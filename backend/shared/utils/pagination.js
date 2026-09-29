/**
 * Normaliza page/limit de un query string con tope máximo.
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePaginacion(query = {}, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page  = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

/** Respuesta paginada estándar. */
function pagina(items, total, { page, limit }) {
  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

module.exports = { parsePaginacion, pagina };
