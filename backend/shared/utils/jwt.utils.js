const jwt = require('jsonwebtoken');

const ACCESS_TTL  = '15m';
const REFRESH_TTL_DAYS = 7;

/**
 * @param {{ id: string, email: string, rol: string }} user
 * @returns {string}
 */
function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL },
  );
}

/**
 * El refresh token lleva un `jti` aleatorio que se guarda hasheado en BD
 * para poder rotarlo y revocarlo.
 * @param {{ id: string }} user
 * @param {string} jti
 */
function generateRefreshToken(user, jti) {
  return jwt.sign({ userId: user.id, jti }, process.env.JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TTL_DAYS}d` });
}

/** @returns {{ userId: string, email: string, rol: string }} */
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/** @returns {{ userId: string, jti: string }} */
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = {
  ACCESS_TTL,
  REFRESH_TTL_DAYS,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
