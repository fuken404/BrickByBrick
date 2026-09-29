const bcrypt = require('bcryptjs');
const {
  generateToken, hashToken, generateOtp, sendEmail, plantillaCorreo, notificarAdmins,
  uploadToStorage, registrarAuditoria, config,
  BadRequestError, UnauthorizedError, ForbiddenError, ConflictError, NotFoundError,
} = require('@brickbybrick/shared');
const usuarioRepository = require('../repositories/usuario.repository');
const tokenRepository = require('../repositories/token.repository');
const sessionService = require('./session.service');

// Costo de bcrypt: 12 por defecto; en instancias con muy poca CPU se puede bajar a 10 (mínimo recomendado por OWASP)
const BCRYPT_ROUNDS = Math.min(14, Math.max(10, Number(process.env.BCRYPT_ROUNDS) || 12));
const OTP_TTL_MIN = 10;
const OTP_MAX_INTENTOS = 5;
const HORA = 60 * 60 * 1000;

// Hash de referencia para igualar tiempos cuando el email no existe
const ENLACE_INVALIDO = 'El enlace es inválido, ya se usó o expiró. Solicita uno nuevo.';
const enmascararEmail = (email) => email.replace(/^(.{2}).*(@.*)$/, '$1•••$2');

// Hash para comparar cuando el usuario no existe (mismo tiempo de respuesta); se calcula al primer uso
let hashFicticio;
const HASH_FICTICIO = () => (hashFicticio ??= bcrypt.hashSync('usuario-inexistente', BCRYPT_ROUNDS));

const requiereMfa = (usuario) => usuario.rol === 'ADMINISTRADOR' || usuario.mfaHabilitado;

async function enviarVerificacion(usuario, nombre) {
  const raw = generateToken();
  await tokenRepository.invalidarTodos(usuario.id, 'verify_email');
  await tokenRepository.crear({
    usuarioId: usuario.id, tipo: 'verify_email', tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 24 * HORA),
  });
  sendEmail({
    to: usuario.email,
    subject: 'Verifica tu correo — BrickByBrick',
    html: plantillaCorreo({
      titulo: `Hola ${nombre}, confirma tu correo`,
      cuerpoHtml: '<p>Para activar todas las funciones de tu cuenta confirma tu correo electrónico. El enlace es válido por 24 horas.</p>',
      ctaTexto: 'Verificar correo',
      ctaUrl: `${config.FRONTEND_URL}/verificar-email/${raw}`,
    }),
  }).catch(() => {});
}

async function crearDesafioMfa(usuario) {
  await tokenRepository.invalidarTodos(usuario.id, 'mfa_otp');
  const codigo = generateOtp();
  const desafio = await tokenRepository.crear({
    usuarioId: usuario.id, tipo: 'mfa_otp', tokenHash: hashToken(codigo), expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60 * 1000),
  });
  await sendEmail({
    to: usuario.email,
    subject: `Tu código de acceso: ${codigo} — BrickByBrick`,
    html: plantillaCorreo({
      titulo: 'Código de verificación',
      cuerpoHtml: `<p>Usa este código para completar tu inicio de sesión. Vence en ${OTP_TTL_MIN} minutos.</p>
        <p style="font-size:30px;letter-spacing:8px;font-weight:700;color:#2C2C2C">${codigo}</p>
        <p style="color:#6B6B6B;font-size:13px">Si no intentaste ingresar, cambia tu contraseña de inmediato.</p>`,
    }),
  }).catch(() => {});
  return desafio.id;
}

const authService = {
  async registerBeneficiario(data) {
    const [emailExiste, cedulaExiste] = await Promise.all([
      usuarioRepository.existeEmail(data.email),
      usuarioRepository.existeCedula(data.cedula),
    ]);
    if (emailExiste) throw new ConflictError('El correo ya está registrado');
    if (cedulaExiste) throw new ConflictError('La cédula ya está registrada');

    const usuario = await usuarioRepository.crearBeneficiario({
      usuario: {
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, BCRYPT_ROUNDS),
        telefono: data.telefono,
      },
      beneficiario: {
        nombreCompleto: data.nombreCompleto,
        cedula: data.cedula,
        fechaNacimiento: new Date(data.fechaNacimiento),
        genero: data.genero ?? null,
        estrato: data.estrato ?? null,
        localidadId: data.localidadId,
      },
    });

    await enviarVerificacion(usuario, data.nombreCompleto.split(' ')[0]);
    registrarAuditoria({ usuarioId: usuario.id, accion: 'registro', entidad: 'usuario', entidadId: usuario.id });
    return sessionService.toSessionUser(usuario);
  },

  async registerConstructora(data, archivos) {
    const rut = archivos?.rut?.[0];
    const camara = archivos?.camaraComercio?.[0];
    if (!rut || !camara) throw new BadRequestError('Debes adjuntar el RUT y el certificado de Cámara de Comercio');

    const [emailExiste, nitExiste] = await Promise.all([
      usuarioRepository.existeEmail(data.email),
      usuarioRepository.existeNit(data.nit),
    ]);
    if (emailExiste) throw new ConflictError('El correo ya está registrado');
    if (nitExiste) throw new ConflictError('El NIT ya está registrado');

    const [rutUrl, camaraUrl] = await Promise.all([
      uploadToStorage(rut.buffer, 'documentos', rut.originalname, rut.mimetype),
      uploadToStorage(camara.buffer, 'documentos', camara.originalname, camara.mimetype),
    ]);

    const usuario = await usuarioRepository.crearConstructora({
      usuario: {
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, BCRYPT_ROUNDS),
        telefono: data.telefono,
      },
      constructora: {
        razonSocial: data.razonSocial,
        nit: data.nit,
        representanteLegal: data.representanteLegal,
        cargoRepresentante: data.cargoRepresentante,
        numEmpleados: data.numEmpleados ?? null,
        direccion: data.direccion,
        localidadId: data.localidadId,
        sitioWeb: data.sitioWeb ?? null,
        descripcion: data.descripcion ?? null,
      },
      documentos: [
        { tipo: 'rut', url: rutUrl },
        { tipo: 'camara_comercio', url: camaraUrl },
      ],
    });

    await enviarVerificacion(usuario, data.razonSocial);
    notificarAdmins({
      tipo: 'verificacion',
      titulo: 'Nueva constructora por verificar',
      mensaje: `${data.razonSocial} (NIT ${data.nit}) cargó sus documentos y espera verificación.`,
      recurso: 'constructora',
      recursoId: usuario.constructora.id,
    });
    registrarAuditoria({ usuarioId: usuario.id, accion: 'registro', entidad: 'usuario', entidadId: usuario.id });
    return sessionService.toSessionUser(usuario);
  },

  /**
   * Paso 1 del login. Devuelve la sesión o, si el usuario tiene MFA,
   * un desafío que se completa con verificarMfa().
   */
  async login({ email, password }, ip) {
    const usuario = await usuarioRepository.findByEmail(email);
    const valida = await bcrypt.compare(password, usuario?.passwordHash ?? HASH_FICTICIO());

    if (!usuario || !valida) {
      usuarioRepository.registrarIntento({ email, usuarioId: usuario?.id ?? null, exito: false, motivo: 'credenciales', ip }).catch(() => {});
      throw new UnauthorizedError('Correo o contraseña incorrectos');
    }
    if (usuario.estado !== 'activo') {
      usuarioRepository.registrarIntento({ email, usuarioId: usuario.id, exito: false, motivo: usuario.estado, ip }).catch(() => {});
      throw new ForbiddenError(usuario.estado === 'suspendido'
        ? 'Tu cuenta está suspendida. Contacta a soporte para más información.'
        : 'Tu cuenta está inactiva.');
    }

    if (requiereMfa(usuario)) {
      const desafioId = await crearDesafioMfa(usuario);
      usuarioRepository.registrarIntento({ email, usuarioId: usuario.id, exito: true, motivo: 'mfa_pendiente', ip }).catch(() => {});
      return { mfaRequerido: true, desafioId, emailParcial: enmascararEmail(email) };
    }

    usuarioRepository.registrarIntento({ email, usuarioId: usuario.id, exito: true, motivo: 'ok', ip }).catch(() => {});
    return { mfaRequerido: false, ...(await sessionService.emitir(usuario)) };
  },

  async verificarMfa({ desafioId, codigo }, ip) {
    const desafio = await tokenRepository.findById(desafioId);
    if (!desafio || desafio.tipo !== 'mfa_otp' || desafio.usado || desafio.expiresAt < new Date()) {
      throw new UnauthorizedError('El código expiró. Inicia sesión nuevamente.');
    }
    if (desafio.intentos >= OTP_MAX_INTENTOS) {
      await tokenRepository.marcarUsado(desafio.id);
      throw new UnauthorizedError('Demasiados intentos. Inicia sesión nuevamente.');
    }

    const usuario = await usuarioRepository.findById(desafio.usuarioId);
    if (!sessionService.hashesIguales(hashToken(codigo), desafio.tokenHash)) {
      await tokenRepository.incrementarIntentos(desafio.id);
      usuarioRepository.registrarIntento({ email: usuario.email, usuarioId: usuario.id, exito: false, motivo: 'mfa_fallido', ip }).catch(() => {});
      throw new UnauthorizedError('Código incorrecto');
    }

    await tokenRepository.marcarUsado(desafio.id);
    usuarioRepository.registrarIntento({ email: usuario.email, usuarioId: usuario.id, exito: true, motivo: 'mfa_ok', ip }).catch(() => {});
    return sessionService.emitir(usuario);
  },

  async reenviarMfa({ desafioId }) {
    const desafio = await tokenRepository.findById(desafioId);
    if (!desafio || desafio.tipo !== 'mfa_otp' || desafio.usado) {
      throw new UnauthorizedError('La verificación expiró. Inicia sesión nuevamente.');
    }
    const usuario = await usuarioRepository.findById(desafio.usuarioId);
    return { desafioId: await crearDesafioMfa(usuario) };
  },

  async configurarMfa(usuarioId, { habilitar, password }) {
    const usuario = await usuarioRepository.findById(usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    if (!(await bcrypt.compare(password, usuario.passwordHash))) throw new BadRequestError('La contraseña es incorrecta');
    if (!habilitar && usuario.rol === 'ADMINISTRADOR') {
      throw new ForbiddenError('La verificación en dos pasos es obligatoria para administradores');
    }
    const actualizado = await usuarioRepository.update(usuarioId, { mfaHabilitado: habilitar });
    registrarAuditoria({ usuarioId, accion: habilitar ? 'mfa_activado' : 'mfa_desactivado', entidad: 'usuario', entidadId: usuarioId });
    return sessionService.toSessionUser(actualizado);
  },

  refresh(refreshToken) {
    return sessionService.rotar(refreshToken);
  },

  logout(refreshToken) {
    if (refreshToken) return sessionService.revocar(refreshToken);
    return Promise.resolve();
  },

  /**
   * Genera y envía el enlace de restablecimiento. El controlador responde
   * antes de que esto termine, así el tiempo de respuesta es el mismo exista
   * o no la cuenta (no permite averiguar qué correos están registrados).
   */
  async forgotPassword(email) {
    const usuario = await usuarioRepository.findByEmail(email);
    if (!usuario || usuario.estado !== 'activo') return;

    await tokenRepository.invalidarTodos(usuario.id, 'reset_password');
    const raw = generateToken();
    await tokenRepository.crear({
      usuarioId: usuario.id, tipo: 'reset_password', tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + HORA),
    });

    await sendEmail({
      to: usuario.email,
      subject: 'Restablecer contraseña — BrickByBrick',
      html: plantillaCorreo({
        titulo: 'Restablece tu contraseña',
        cuerpoHtml: '<p>Recibimos una solicitud para restablecer tu contraseña. El enlace es válido por 1 hora y solo se puede usar una vez.</p><p style="color:#6B6B6B;font-size:13px">Si no la solicitaste, ignora este mensaje: tu contraseña actual sigue funcionando.</p>',
        ctaTexto: 'Crear nueva contraseña',
        ctaUrl: `${config.FRONTEND_URL}/restablecer-password/${raw}`,
      }),
    });
  },

  /** Comprueba el enlace antes de mostrar el formulario (no lo consume). */
  async validarTokenReset(token) {
    const registro = await tokenRepository.findVigente({ tokenHash: hashToken(token), tipo: 'reset_password' });
    const usuario = registro && await usuarioRepository.findById(registro.usuarioId);
    if (!usuario || usuario.estado !== 'activo') throw new BadRequestError(ENLACE_INVALIDO);
    return { emailParcial: enmascararEmail(usuario.email), expiraEn: registro.expiresAt };
  },

  async resetPassword(token, newPassword) {
    const registro = await tokenRepository.findVigente({ tokenHash: hashToken(token), tipo: 'reset_password' });
    const usuario = registro && await usuarioRepository.findById(registro.usuarioId);
    if (!usuario || usuario.estado !== 'activo') throw new BadRequestError(ENLACE_INVALIDO);

    // Consumo atómico: si el enlace se envía dos veces a la vez, solo una petición cambia la contraseña
    if (!(await tokenRepository.consumir(registro.id))) throw new BadRequestError(ENLACE_INVALIDO);

    await usuarioRepository.update(usuario.id, { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) });
    await sessionService.revocarTodas(usuario.id);
    registrarAuditoria({ usuarioId: usuario.id, accion: 'password_restablecida', entidad: 'usuario', entidadId: usuario.id });
    sendEmail({
      to: usuario.email,
      subject: 'Tu contraseña fue cambiada — BrickByBrick',
      html: plantillaCorreo({
        titulo: 'Tu contraseña fue cambiada',
        cuerpoHtml: '<p>La contraseña de tu cuenta se restableció y cerramos las sesiones abiertas en otros dispositivos.</p><p style="color:#6B6B6B;font-size:13px">Si no fuiste tú, solicita un nuevo enlace de inmediato y escribe a soporte.</p>',
        ctaTexto: 'Iniciar sesión',
        ctaUrl: `${config.FRONTEND_URL}/login`,
      }),
    }).catch(() => {});
  },

  async cambiarPassword(usuarioId, { passwordActual, passwordNueva }) {
    const usuario = await usuarioRepository.findById(usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    if (!(await bcrypt.compare(passwordActual, usuario.passwordHash))) {
      throw new BadRequestError('La contraseña actual es incorrecta');
    }
    const actualizado = await usuarioRepository.update(usuarioId, {
      passwordHash: await bcrypt.hash(passwordNueva, BCRYPT_ROUNDS),
    });
    await sessionService.revocarTodas(usuarioId);
    registrarAuditoria({ usuarioId, accion: 'password_cambiada', entidad: 'usuario', entidadId: usuarioId });
    // Nueva sesión para el dispositivo actual; las demás quedan cerradas
    return sessionService.emitir(actualizado);
  },

  async verifyEmail(token) {
    const registro = await tokenRepository.findVigente({ tokenHash: hashToken(token), tipo: 'verify_email' });
    if (!registro) throw new BadRequestError('El enlace de verificación es inválido o expiró');
    await usuarioRepository.update(registro.usuarioId, { emailVerificado: true });
    await tokenRepository.marcarUsado(registro.id);
  },

  async reenviarVerificacion(usuarioId) {
    const usuario = await usuarioRepository.findById(usuarioId);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    if (usuario.emailVerificado) throw new BadRequestError('Tu correo ya está verificado');
    const nombre = usuario.beneficiario?.nombreCompleto?.split(' ')[0] || usuario.constructora?.razonSocial || '';
    await enviarVerificacion(usuario, nombre);
  },
};

module.exports = authService;
