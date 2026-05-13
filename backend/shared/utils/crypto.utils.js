const crypto = require('crypto');

/** Genera un token URL-safe de 32 bytes */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/** Hash SHA-256 del token para almacenar en DB */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { generateToken, hashToken };
