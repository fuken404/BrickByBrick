const crypto = require('crypto');

/** Token aleatorio de 32 bytes en hex (enlaces de verificación, reset, jti). */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/** Hash SHA-256 para guardar tokens en BD sin exponerlos. */
function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/** Código numérico de 6 dígitos para MFA. */
function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

module.exports = { generateToken, hashToken, generateOtp };
