const { sendError } = require('../utils/response.utils');

const toErrors = (zodError) =>
  zodError.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));

/**
 * Valida req.body con un schema Zod. Si pasa, deja los datos parseados
 * (y sin campos desconocidos) en req.validatedBody.
 * @param {import('zod').ZodSchema} schema
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) return sendError(res, 'Datos de entrada inválidos', 400, toErrors(result.error));
    req.validatedBody = result.data;
    return next();
  };
}

/** Valida req.query con un schema Zod → req.validatedQuery. */
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query ?? {});
    if (!result.success) return sendError(res, 'Parámetros de búsqueda inválidos', 400, toErrors(result.error));
    req.validatedQuery = result.data;
    return next();
  };
}

module.exports = { validateBody, validateQuery };
