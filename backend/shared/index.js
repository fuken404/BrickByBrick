// Barrel export de shared — importar desde '@brickbybrick/shared'

// Middleware
const authMiddleware   = require('./middleware/auth.middleware');
const requireRoles     = require('./middleware/role.middleware');
const errorHandler     = require('./middleware/error.handler');
const { generalLimiter, authLimiter, passwordLimiter } = require('./middleware/rate.limiter');
const { validateBody, validateQuery } = require('./middleware/validate.middleware');
const { upload, uploadDoc, uploadToStorage, deleteFromStorage } = require('./middleware/upload.middleware');

// Utils
const prisma              = require('./utils/prisma.client');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } = require('./utils/jwt.utils');
const { sendSuccess, sendError } = require('./utils/response.utils');
const { generateToken, hashToken } = require('./utils/crypto.utils');
const logger              = require('./utils/logger');
const { sendEmail }       = require('./utils/email.utils');
const { createNotification } = require('./utils/notification.utils');

module.exports = {
  // Middleware
  authMiddleware,
  requireRoles,
  errorHandler,
  generalLimiter,
  authLimiter,
  passwordLimiter,
  validateBody,
  validateQuery,
  upload,
  uploadDoc,
  uploadToStorage,
  deleteFromStorage,

  // Utils
  prisma,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  sendSuccess,
  sendError,
  generateToken,
  hashToken,
  logger,
  sendEmail,
  createNotification,
};
