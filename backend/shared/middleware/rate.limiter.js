const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response.utils');

const handler = (_req, res) =>
  sendError(res, 'Demasiadas solicitudes. Intenta de nuevo más tarde.', 429);

const isProd = () => process.env.NODE_ENV === 'production';
const isTest = () => process.env.NODE_ENV === 'test';

/**
 * IP del cliente para contar peticiones. Detrás de un proxy de plataforma
 * (Railway envía X-Real-IP) se configura CLIENT_IP_HEADER=x-real-ip; si no,
 * se usa req.ip según la configuración de "trust proxy".
 */
function claveCliente(req) {
  const cabecera = process.env.CLIENT_IP_HEADER;
  const valor = cabecera && req.headers[cabecera.toLowerCase()];
  return (Array.isArray(valor) ? valor[0] : valor)?.split(',')[0].trim() || req.ip;
}

const base = {
  standardHeaders: true, legacyHeaders: false, handler, skip: isTest, keyGenerator: claveCliente,
  // La IP ya se resuelve en claveCliente; se desactivan las advertencias sobre X-Forwarded-For
  validate: { xForwardedForHeader: false },
};

/** Límite general por IP (la SPA hace varias peticiones por vista). */
const generalLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: () => (isProd() ? 600 : 5000) });

/** Rutas de autenticación: login, registro, MFA. */
const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: () => (isProd() ? 20 : 200) });

/** Restablecimiento de contraseña y reenvío de correos. */
const passwordLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, max: () => (isProd() ? 5 : 50) });

module.exports = { generalLimiter, authLimiter, passwordLimiter };
