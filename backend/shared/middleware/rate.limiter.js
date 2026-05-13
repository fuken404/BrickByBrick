const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response.utils');

const handler = (req, res) =>
  sendError(res, 'Demasiadas solicitudes. Intenta de nuevo más tarde.', 429);

/** 100 peticiones cada 15 minutos — límite general */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/** 10 intentos cada 15 minutos — rutas de autenticación (100 en desarrollo) */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/** 5 intentos cada hora — restablecimiento de contraseña (50 en desarrollo) */
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

module.exports = { generalLimiter, authLimiter, passwordLimiter };
