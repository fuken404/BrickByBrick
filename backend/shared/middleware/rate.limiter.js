const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response.utils');

const handler = (_req, res) =>
  sendError(res, 'Demasiadas solicitudes. Intenta de nuevo más tarde.', 429);

const isProd = () => process.env.NODE_ENV === 'production';
const isTest = () => process.env.NODE_ENV === 'test';

const base = { standardHeaders: true, legacyHeaders: false, handler, skip: isTest };

/** Límite general por IP (la SPA hace varias peticiones por vista). */
const generalLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: () => (isProd() ? 600 : 5000) });

/** Rutas de autenticación: login, registro, MFA. */
const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: () => (isProd() ? 20 : 200) });

/** Restablecimiento de contraseña y reenvío de correos. */
const passwordLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, max: () => (isProd() ? 5 : 50) });

module.exports = { generalLimiter, authLimiter, passwordLimiter };
