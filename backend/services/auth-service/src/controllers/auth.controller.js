const authService = require('../services/auth.service');
const { sendSuccess, sendError, config, logger } = require('@brickbybrick/shared');

const COOKIE = 'refreshToken';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function responderSesion(res, sesion, mensaje, extra = {}) {
  res.cookie(COOKIE, sesion.refreshToken, COOKIE_OPTS);
  return sendSuccess(res, { ...extra, accessToken: sesion.accessToken, user: sesion.user }, mensaje);
}

const authController = {
  async registerBeneficiario(req, res, next) {
    try {
      const user = await authService.registerBeneficiario(req.validatedBody);
      sendSuccess(res, user, 'Cuenta creada. Revisa tu correo para verificarla.', 201);
    } catch (err) { next(err); }
  },

  async registerConstructora(req, res, next) {
    try {
      const user = await authService.registerConstructora(req.validatedBody, req.files);
      sendSuccess(res, user, 'Registro enviado. Verificaremos tu empresa en 1 a 2 días hábiles.', 201);
    } catch (err) { next(err); }
  },

  async login(req, res, next) {
    try {
      const resultado = await authService.login(req.validatedBody, req.ip);
      if (resultado.mfaRequerido) {
        const { mfaRequerido, desafioId, emailParcial } = resultado;
        return sendSuccess(res, { mfaRequerido, desafioId, emailParcial }, 'Te enviamos un código de verificación');
      }
      return responderSesion(res, resultado, 'Inicio de sesión exitoso', { mfaRequerido: false });
    } catch (err) { return next(err); }
  },

  async verificarMfa(req, res, next) {
    try {
      responderSesion(res, await authService.verificarMfa(req.validatedBody, req.ip), 'Inicio de sesión exitoso');
    } catch (err) { next(err); }
  },

  async reenviarMfa(req, res, next) {
    try {
      sendSuccess(res, await authService.reenviarMfa(req.validatedBody), 'Te enviamos un nuevo código');
    } catch (err) { next(err); }
  },

  async configurarMfa(req, res, next) {
    try {
      const user = await authService.configurarMfa(req.user.userId, req.validatedBody);
      sendSuccess(res, user, user.mfaHabilitado ? 'Verificación en dos pasos activada' : 'Verificación en dos pasos desactivada');
    } catch (err) { next(err); }
  },

  async refreshToken(req, res, next) {
    try {
      const token = req.cookies?.[COOKIE];
      if (!token) return sendError(res, 'No hay una sesión activa', 401);
      return responderSesion(res, await authService.refresh(token), 'Sesión renovada');
    } catch (err) {
      res.clearCookie(COOKIE, { ...COOKIE_OPTS, maxAge: undefined });
      return next(err);
    }
  },

  async logout(req, res, next) {
    try {
      await authService.logout(req.cookies?.[COOKIE]);
      res.clearCookie(COOKIE, { ...COOKIE_OPTS, maxAge: undefined });
      sendSuccess(res, null, 'Sesión cerrada');
    } catch (err) { next(err); }
  },

  forgotPassword(req, res) {
    // Se responde de inmediato y el envío sigue en segundo plano (misma respuesta y tiempo exista o no la cuenta)
    authService.forgotPassword(req.validatedBody.email)
      .catch((err) => logger.error(`forgot-password: ${err.message}`));
    sendSuccess(res, null, 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.');
  },

  async validarTokenReset(req, res, next) {
    try {
      sendSuccess(res, await authService.validarTokenReset(req.params.token), 'Enlace válido');
    } catch (err) { next(err); }
  },

  async resetPassword(req, res, next) {
    try {
      await authService.resetPassword(req.params.token, req.validatedBody.password);
      res.clearCookie(COOKIE, { ...COOKIE_OPTS, maxAge: undefined });
      sendSuccess(res, null, 'Contraseña restablecida. Ya puedes iniciar sesión.');
    } catch (err) { next(err); }
  },

  async cambiarPassword(req, res, next) {
    try {
      responderSesion(res, await authService.cambiarPassword(req.user.userId, req.validatedBody),
        'Contraseña actualizada. Cerramos tus otras sesiones.');
    } catch (err) { next(err); }
  },

  async verifyEmail(req, res, next) {
    try {
      await authService.verifyEmail(req.params.token);
      sendSuccess(res, null, 'Correo verificado correctamente');
    } catch (err) { next(err); }
  },

  async reenviarVerificacion(req, res, next) {
    try {
      await authService.reenviarVerificacion(req.user.userId);
      sendSuccess(res, null, 'Te enviamos un nuevo enlace de verificación');
    } catch (err) { next(err); }
  },
};

module.exports = authController;
