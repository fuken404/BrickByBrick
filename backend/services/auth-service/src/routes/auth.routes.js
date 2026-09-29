const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const {
  validateBody, authMiddleware, authLimiter, passwordLimiter, uploadDoc,
} = require('@brickbybrick/shared');
const v = require('../validators/auth.validators');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registro, inicio de sesión (con MFA), sesiones y contraseñas
 */

/**
 * @swagger
 * /api/v1/auth/register/beneficiario:
 *   post:
 *     tags: [Auth]
 *     summary: Registra un beneficiario (mayor de edad)
 *     security: []
 */
router.post('/register/beneficiario', authLimiter, validateBody(v.registerBeneficiarioSchema), ctrl.registerBeneficiario);

/**
 * @swagger
 * /api/v1/auth/register/constructora:
 *   post:
 *     tags: [Auth]
 *     summary: Registra una constructora (multipart con archivos `rut` y `camaraComercio`)
 *     security: []
 */
router.post(
  '/register/constructora',
  authLimiter,
  uploadDoc.fields([{ name: 'rut', maxCount: 1 }, { name: 'camaraComercio', maxCount: 1 }]),
  validateBody(v.registerConstructoraSchema),
  ctrl.registerConstructora,
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Inicia sesión. Si el usuario tiene MFA responde `mfaRequerido` y un `desafioId`
 *     security: []
 */
router.post('/login', authLimiter, validateBody(v.loginSchema), ctrl.login);

/**
 * @swagger
 * /api/v1/auth/mfa/verificar:
 *   post:
 *     tags: [Auth]
 *     summary: Completa el inicio de sesión con el código OTP enviado al correo
 *     security: []
 */
router.post('/mfa/verificar', authLimiter, validateBody(v.mfaVerifySchema), ctrl.verificarMfa);
router.post('/mfa/reenviar', passwordLimiter, validateBody(v.mfaResendSchema), ctrl.reenviarMfa);
router.patch('/mfa', authMiddleware, validateBody(v.mfaToggleSchema), ctrl.configurarMfa);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Rota el refresh token (cookie httpOnly) y devuelve un nuevo access token
 *     security: []
 */
router.post('/refresh-token', ctrl.refreshToken);
router.post('/logout', ctrl.logout);

router.post('/forgot-password', passwordLimiter, validateBody(v.forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password/:token', passwordLimiter, validateBody(v.resetPasswordSchema), ctrl.resetPassword);
router.patch('/password', authMiddleware, validateBody(v.cambiarPasswordSchema), ctrl.cambiarPassword);

router.get('/verify-email/:token', ctrl.verifyEmail);
router.post('/verify-email/reenviar', authMiddleware, passwordLimiter, ctrl.reenviarVerificacion);

module.exports = router;
