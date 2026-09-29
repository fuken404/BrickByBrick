const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response.utils');

const handler = (_req, res) =>
  sendError(res, 'Demasiadas solicitudes. Intenta de nuevo más tarde.', 429);

const isProd = () => process.env.NODE_ENV === 'production';
const isTest = () => process.env.NODE_ENV === 'test';

/**
 * IP del cliente para contar peticiones. Detrás del proxy de una plataforma se
 * indica en CLIENT_IP_HEADER qué cabecera la trae; admite varias separadas por
 * coma y usa la primera presente (Railway: x-real-ip; Render:
 * cf-connecting-ip,true-client-ip,x-forwarded-for). Sin cabecera se usa req.ip.
 */
function claveCliente(req) {
  const cabeceras = (process.env.CLIENT_IP_HEADER || '').split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
  for (const cabecera of cabeceras) {
    const valor = req.headers[cabecera];
    const ip = (Array.isArray(valor) ? valor[0] : valor)?.split(',')[0].trim();
    if (ip) return ip;
  }
  return req.ip;
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
