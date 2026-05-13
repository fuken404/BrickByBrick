/**
 * Respuesta exitosa estándar.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message]
 * @param {number} [statusCode]
 */
function sendSuccess(res, data = null, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
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

module.exports = { sendSuccess, sendError };
