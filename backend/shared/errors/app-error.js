/**
 * Errores de negocio con código HTTP. Los servicios lanzan estas clases
 * y el errorHandler global las traduce a la respuesta estándar.
 */
class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} [status]
   * @param {Array<{field:string,message:string}>} [errors]
   */
  constructor(message, status = 400, errors = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.errors = errors;
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Solicitud inválida', errors = null) { super(message, 400, errors); }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') { super(message, 401); }
}

class ForbiddenError extends AppError {
  constructor(message = 'No tienes permiso para realizar esta acción') { super(message, 403); }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') { super(message, 404); }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso') { super(message, 409); }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
