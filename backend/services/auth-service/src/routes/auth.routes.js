const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { validateBody, authMiddleware, prisma, sendSuccess, sendError } = require('@brickbybrick/shared');
const { authLimiter, passwordLimiter } = require('@brickbybrick/shared');
const bcrypt = require('bcryptjs');
const {
  registerBeneficiarioSchema,
  registerConstructoraSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validators');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y gestión de cuentas
 */

/**
 * @swagger
 * /api/v1/auth/register/beneficiario:
 *   post:
 *     summary: Registra un nuevo beneficiario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBeneficiario'
 *     responses:
 *       201: { description: Registro exitoso }
 *       409: { description: Email o cédula ya en uso }
 */
router.post(
  '/register/beneficiario',
  authLimiter,
  validateBody(registerBeneficiarioSchema),
  authController.registerBeneficiario
);

/**
 * @swagger
 * /api/v1/auth/register/constructora:
 *   post:
 *     summary: Registra una nueva constructora
 *     tags: [Auth]
 */
router.post(
  '/register/constructora',
  authLimiter,
  validateBody(registerConstructoraSchema),
  authController.registerConstructora
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Inicia sesión y devuelve access token
 *     tags: [Auth]
 */
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

/** POST /logout */
router.post('/logout', authController.logout);

/** POST /refresh-token */
router.post('/refresh-token', authController.refreshToken);

/** POST /forgot-password */
router.post(
  '/forgot-password',
  passwordLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

/** POST /reset-password/:token */
router.post(
  '/reset-password/:token',
  passwordLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

/** GET /verify-email/:token */
router.get('/verify-email/:token', authController.verifyEmail);

/** PATCH /cambiar-password — usuario autenticado */
router.patch('/cambiar-password', authMiddleware, async (req, res, next) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva || passwordNueva.length < 8) {
      return sendError(res, 'La nueva contraseña debe tener al menos 8 caracteres', 400);
    }
    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.userId } });
    if (!usuario) return sendError(res, 'Usuario no encontrado', 404);

    const valida = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!valida) return sendError(res, 'La contraseña actual es incorrecta', 400);

    const hash = await bcrypt.hash(passwordNueva, 10);
    await prisma.usuario.update({ where: { id: req.user.userId }, data: { passwordHash: hash } });
    sendSuccess(res, null, 'Contraseña actualizada');
  } catch (err) { next(err); }
});

module.exports = router;
