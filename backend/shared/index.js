// Barrel export de shared — importar desde '@brickbybrick/shared'
const config = require('./config');

// Errores
const errors = require('./errors/app-error');

// Middleware
const authMiddleware     = require('./middleware/auth.middleware');
const requireRoles       = require('./middleware/role.middleware');
const requireInternalKey = require('./middleware/internal.middleware');
const errorHandler       = require('./middleware/error.handler');
const { generalLimiter, authLimiter, passwordLimiter } = require('./middleware/rate.limiter');
const { validateBody, validateQuery } = require('./middleware/validate.middleware');
const { upload, uploadDoc, uploadToStorage, deleteFromStorage, uploadsRoot } = require('./middleware/upload.middleware');

// App
const { createApp, startServer } = require('./app.factory');

// Utils
const prisma = require('./utils/prisma.client');
const logger = require('./utils/logger');
const jwtUtils = require('./utils/jwt.utils');
const { sendSuccess, sendError } = require('./utils/response.utils');
const { generateToken, hashToken, generateOtp } = require('./utils/crypto.utils');
const { sendEmail, smtpConfigurado } = require('./utils/email.utils');
const { notificar, createNotification, notificarAdmins } = require('./utils/notification.utils');
const { emitirTiempoReal } = require('./utils/realtime.utils');
const { parsePaginacion, pagina } = require('./utils/pagination');
const { USUARIO_PUBLICO_SELECT, toUsuarioPublico, nombrePublico } = require('./utils/usuario-publico');
const { rutaPara } = require('./utils/rutas');
const { escapeHtml, plantillaCorreo } = require('./utils/html');
const { registrarAuditoria } = require('./utils/audit');
const configSistema = require('./utils/config-sistema');
const { asyncHandler } = require('./utils/async-handler');

module.exports = {
  config,
  ...errors,

  authMiddleware,
  optionalAuth: authMiddleware.optionalAuth,
  requireRoles,
  requireInternalKey,
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
  uploadsRoot,

  createApp,
  startServer,

  prisma,
  logger,
  ...jwtUtils,
  sendSuccess,
  sendError,
  generateToken,
  hashToken,
  generateOtp,
  sendEmail,
  smtpConfigurado,
  notificar,
  createNotification,
  notificarAdmins,
  emitirTiempoReal,
  parsePaginacion,
  pagina,
  USUARIO_PUBLICO_SELECT,
  toUsuarioPublico,
  nombrePublico,
  rutaPara,
  escapeHtml,
  plantillaCorreo,
  registrarAuditoria,
  configSistema,
  asyncHandler,
};
