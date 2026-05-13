const { sendError } = require('../utils/response.utils');

/**
 * Factory que valida req.body con un schema Zod.
 * Si la validación falla, responde 400 con los errores por campo.
 * Si pasa, adjunta req.validatedBody con los datos parseados.
 *
 * @param {import('zod').ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'Datos de entrada inválidos', 400, errors);
    }
    req.validatedBody = result.data;
    next();
  };
}

/**
 * Factory que valida req.query con un schema Zod.
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'Parámetros de búsqueda inválidos', 400, errors);
    }
    req.validatedQuery = result.data;
    next();
  };
}

module.exports = { validateBody, validateQuery };
