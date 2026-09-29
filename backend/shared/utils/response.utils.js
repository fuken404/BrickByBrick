const { Prisma } = require('@prisma/client');

/**
 * Convierte recursivamente los Decimal de Prisma a number para que el
 * frontend reciba valores numéricos (cantidades, valores COP).
 */
function normalizar(valor) {
  if (valor === null || valor === undefined) return valor;
  if (valor instanceof Prisma.Decimal) return valor.toNumber();
  if (valor instanceof Date || Buffer.isBuffer(valor)) return valor;
  if (Array.isArray(valor)) return valor.map(normalizar);
  if (typeof valor === 'bigint') return Number(valor);
  if (typeof valor === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(valor)) out[k] = normalizar(v);
    return out;
  }
  return valor;
}

/**
 * Respuesta exitosa estándar.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message]
 * @param {number} [statusCode]
 */
function sendSuccess(res, data = null, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data: normalizar(data) });
}

/**
 * Respuesta de error estándar.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode]
 * @param {Array<{field:string,message:string}>} [errors]
 */
function sendError(res, message, statusCode = 400, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess, sendError, normalizar };
