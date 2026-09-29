const crypto = require('crypto');
const {
  generateAccessToken, generateRefreshToken, verifyRefreshToken, generateToken, hashToken,
  REFRESH_TTL_DAYS, UnauthorizedError, logger,
} = require('@brickbybrick/shared');
const tokenRepository = require('../repositories/token.repository');
const usuarioRepository = require('../repositories/usuario.repository');

/** Datos del usuario que recibe el frontend al iniciar sesión. */
function toSessionUser(usuario) {
  const perfil = usuario.beneficiario
    ? { tipo: 'beneficiario', ...usuario.beneficiario }
    : usuario.constructora
      ? { tipo: 'constructora', ...usuario.constructora }
      : null;
  return {
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    emailVerificado: usuario.emailVerificado,
    mfaHabilitado: usuario.mfaHabilitado,
    avatarUrl: usuario.avatarUrl,
    perfil,
  };
}

const sessionService = {
  toSessionUser,

  /** Emite access + refresh (rotativo) y registra el jti hasheado. */
  async emitir(usuario) {
    const jti = generateToken();
    await tokenRepository.crear({
      usuarioId: usuario.id,
      tipo: 'refresh',
      tokenHash: hashToken(jti),
      expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
    });
    await usuarioRepository.update(usuario.id, { ultimoLogin: new Date() });
    tokenRepository.purgarExpirados().catch(() => {});
    return {
      accessToken: generateAccessToken(usuario),
      refreshToken: generateRefreshToken(usuario, jti),
      user: toSessionUser(usuario),
    };
  },

  /**
   * Rota el refresh token. Si se presenta uno ya usado (posible robo),
   * se revocan todas las sesiones del usuario.
   */
  async rotar(refreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Sesión expirada. Inicia sesión nuevamente.');
    }
    if (!decoded.jti) throw new UnauthorizedError('Sesión inválida. Inicia sesión nuevamente.');

    const tokenHash = hashToken(decoded.jti);
    const registro = await tokenRepository.findPorHash({ tokenHash, tipo: 'refresh' });
    if (!registro || registro.usuarioId !== decoded.userId) {
      throw new UnauthorizedError('Sesión inválida. Inicia sesión nuevamente.');
    }
    if (registro.usado || registro.expiresAt < new Date()) {
      if (registro.usado) {
        logger.warn(`Reutilización de refresh token detectada para usuario ${registro.usuarioId}; se revocan sus sesiones`);
        await tokenRepository.invalidarTodos(registro.usuarioId, 'refresh');
      }
      throw new UnauthorizedError('Sesión expirada. Inicia sesión nuevamente.');
    }

    const usuario = await usuarioRepository.findById(decoded.userId);
    if (!usuario || usuario.estado !== 'activo') {
      await tokenRepository.invalidarTodos(decoded.userId, 'refresh');
      throw new UnauthorizedError('Tu cuenta no está activa.');
    }

    await tokenRepository.marcarUsado(registro.id);
    return this.emitir(usuario);
  },

  async revocar(refreshToken) {
    try {
      const { jti } = verifyRefreshToken(refreshToken);
      const registro = await tokenRepository.findPorHash({ tokenHash: hashToken(jti), tipo: 'refresh' });
      if (registro && !registro.usado) await tokenRepository.marcarUsado(registro.id);
    } catch {
      // token inválido o expirado: no hay nada que revocar
    }
  },

  revocarTodas(usuarioId) {
    return tokenRepository.invalidarTodos(usuarioId, 'refresh');
  },

  /** Comparación en tiempo constante de hashes hex. */
  hashesIguales(a, b) {
    const ba = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
  },
};

module.exports = sessionService;
