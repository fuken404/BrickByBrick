const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('@brickbybrick/shared');

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 días
};

const authController = {
  async registerBeneficiario(req, res, next) {
    try {
      const result = await authService.registerBeneficiario(req.validatedBody);
      sendSuccess(res, result, 'Registro exitoso. Revisa tu correo para verificar tu cuenta.', 201);
    } catch (err) {
      next(err);
    }
  },

  async registerConstructora(req, res, next) {
    try {
      const result = await authService.registerConstructora(req.validatedBody);
      sendSuccess(res, result, 'Registro exitoso. Tu cuenta será verificada por el equipo BrickByBrick.', 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { accessToken, refreshToken, user } = await authService.login(req.validatedBody);
      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
      sendSuccess(res, { accessToken, user }, 'Inicio de sesión exitoso');
    } catch (err) {
      next(err);
    }
  },

  logout(_req, res) {
    res.clearCookie('refreshToken');
    sendSuccess(res, null, 'Sesión cerrada');
  },

  async refreshToken(req, res, next) {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) return sendError(res, 'Refresh token no encontrado', 401);
      const { accessToken } = await authService.refresh(token);
      sendSuccess(res, { accessToken }, 'Token renovado');
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      await authService.forgotPassword(req.validatedBody.email);
      // Siempre responder OK para no revelar si el email existe
      sendSuccess(res, null, 'Si el correo está registrado, recibirás un enlace de restablecimiento.');
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      await authService.resetPassword(req.params.token, req.validatedBody.password);
      res.clearCookie('refreshToken');
      sendSuccess(res, null, 'Contraseña restablecida correctamente');
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req, res, next) {
    try {
      await authService.verifyEmail(req.params.token);
      sendSuccess(res, null, 'Correo verificado correctamente');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
