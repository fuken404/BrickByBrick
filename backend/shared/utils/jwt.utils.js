const jwt = require('jsonwebtoken');

const ACCESS_SECRET  = () => process.env.JWT_SECRET;
const REFRESH_SECRET = () => process.env.JWT_REFRESH_SECRET;

/**
 * @param {{ id: string, email: string, rol: string }} user
 * @returns {string}
 */
function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, rol: user.rol },
    ACCESS_SECRET(),
    { expiresIn: '15m' }
  );
}

/**
 * @param {{ id: string }} user
 * @returns {string}
 */
function generateRefreshToken(user) {
  return jwt.sign({ userId: user.id }, REFRESH_SECRET(), { expiresIn: '7d' });
}

/**
 * @param {string} token
 * @returns {{ userId: string, email: string, rol: string }}
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET());
}

/**
 * @param {string} token
 * @returns {{ userId: string }}
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET());
}

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
