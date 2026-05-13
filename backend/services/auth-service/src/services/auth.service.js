const bcrypt    = require('bcryptjs');
const {
  prisma,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateToken,
  hashToken,
  sendEmail,
  createNotification,
  logger,
} = require('@brickbybrick/shared');

const BCRYPT_ROUNDS = 12;

class AuthService {
  // ------------------------------------------------------------------
  // Registro de beneficiario
  // ------------------------------------------------------------------
  async registerBeneficiario(data) {
    const [emailExists, cedulaExists] = await Promise.all([
      prisma.usuario.findUnique({ where: { email: data.email } }),
      prisma.beneficiario.findUnique({ where: { cedula: data.cedula } }),
    ]);
    if (emailExists) throw { status: 409, message: 'El email ya está en uso' };
    if (cedulaExists) throw { status: 409, message: 'La cédula ya está registrada' };

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const rawToken     = generateToken();
    const tokenHash    = hashToken(rawToken);

    const { usuario, beneficiario } = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: { email: data.email, passwordHash, rol: 'BENEFICIARIO', estado: 'activo' },
      });

      const beneficiario = await tx.beneficiario.create({
        data: {
          usuarioId:       usuario.id,
          nombreCompleto:  data.nombreCompleto,
          cedula:          data.cedula,
          fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
          genero:          data.genero  || null,
          estrato:         data.estrato || null,
          localidadId:     data.localidadId || null,
        },
      });

      await tx.tokenUsuario.create({
        data: {
          usuarioId: usuario.id,
          tipo:      'verify_email',
          tokenHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return { usuario, beneficiario };
    });

    // Email (non-blocking)
    sendEmail({
      to:      data.email,
      subject: 'Verifica tu correo — BrickByBrick',
      html:    `<p>Hola ${data.nombreCompleto},</p>
                <p>Haz clic en el enlace para verificar tu correo (válido 24 h):</p>
                <a href="${process.env.FRONTEND_URL}/verificar-email/${rawToken}">Verificar correo</a>`,
    }).catch((e) => logger.warn('Email verificación no enviado:', e.message));

    return {
      id:             usuario.id,
      email:          usuario.email,
      rol:            usuario.rol,
      nombreCompleto: beneficiario.nombreCompleto,
    };
  }

  // ------------------------------------------------------------------
  // Registro de constructora
  // ------------------------------------------------------------------
  async registerConstructora(data) {
    const [emailExists, nitExists] = await Promise.all([
      prisma.usuario.findUnique({ where: { email: data.email } }),
      prisma.constructora.findUnique({ where: { nit: data.nit } }),
    ]);
    if (emailExists) throw { status: 409, message: 'El email ya está en uso' };
    if (nitExists)   throw { status: 409, message: 'El NIT ya está registrado' };

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const { usuario, constructora } = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: { email: data.email, passwordHash, rol: 'CONSTRUCTORA', estado: 'activo' },
      });

      const constructora = await tx.constructora.create({
        data: {
          usuarioId:          usuario.id,
          razonSocial:        data.razonSocial,
          nit:                data.nit,
          representanteLegal: data.representanteLegal || null,
          cargoRepresentante: data.cargoRepresentante || null,
          numEmpleados:       data.numEmpleados || null,
          direccion:          data.direccion    || null,
          localidadId:        data.localidadId  || null,
          descripcion:        data.descripcion  || null,
          verificada:         false,
        },
      });

      return { usuario, constructora };
    });

    // Notificar al admin
    const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMINISTRADOR' } });
    if (admin) {
      createNotification({
        usuarioId:  admin.id,
        tipo:       'verificacion',
        titulo:     'Nueva constructora pendiente de verificación',
        mensaje:    `${constructora.razonSocial} (NIT: ${constructora.nit}) requiere verificación.`,
        urlDestino: `/admin/constructoras/${constructora.id}`,
      }).catch(() => {});
    }

    return {
      id:          usuario.id,
      email:       usuario.email,
      rol:         usuario.rol,
      razonSocial: constructora.razonSocial,
      verificada:  false,
    };
  }

  // ------------------------------------------------------------------
  // Login
  // ------------------------------------------------------------------
  async login(data) {
    const usuario = await prisma.usuario.findUnique({
      where:   { email: data.email },
      include: {
        beneficiario: { select: { id: true, nombreCompleto: true, esAlimentadorWeb: true } },
        constructora: { select: { id: true, razonSocial: true, verificada: true } },
      },
    });

    if (!usuario) throw { status: 401, message: 'Credenciales inválidas' };
    if (usuario.estado !== 'activo') throw { status: 403, message: 'Cuenta suspendida o inactiva' };

    const valid = await bcrypt.compare(data.password, usuario.passwordHash);
    if (!valid) throw { status: 401, message: 'Credenciales inválidas' };

    const accessToken  = generateAccessToken(usuario);
    const refreshToken = generateRefreshToken(usuario);

    return {
      accessToken,
      refreshToken,
      user: {
        id:             usuario.id,
        email:          usuario.email,
        rol:            usuario.rol,
        emailVerificado: usuario.emailVerificado,
        perfil:         usuario.beneficiario || usuario.constructora,
      },
    };
  }

  // ------------------------------------------------------------------
  // Refresh token
  // ------------------------------------------------------------------
  async refresh(token) {
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw { status: 401, message: 'Refresh token inválido o expirado' };
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: decoded.userId } });
    if (!usuario || usuario.estado !== 'activo') {
      throw { status: 401, message: 'Usuario no encontrado o inactivo' };
    }

    return { accessToken: generateAccessToken(usuario) };
  }

  // ------------------------------------------------------------------
  // Forgot password
  // ------------------------------------------------------------------
  async forgotPassword(email) {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return; // No revelar si el email existe

    // Invalidar tokens anteriores
    await prisma.tokenUsuario.updateMany({
      where: { usuarioId: usuario.id, tipo: 'reset_password', usado: false },
      data:  { usado: true },
    });

    const rawToken  = generateToken();
    const tokenHash = hashToken(rawToken);

    await prisma.tokenUsuario.create({
      data: {
        usuarioId: usuario.id,
        tipo:      'reset_password',
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    });

    await sendEmail({
      to:      email,
      subject: 'Restablecer contraseña — BrickByBrick',
      html:    `<p>Para restablecer tu contraseña (válido 1 hora):</p>
                <a href="${process.env.FRONTEND_URL}/restablecer-password/${rawToken}">Restablecer contraseña</a>
                <p>Si no solicitaste esto, ignora este mensaje.</p>`,
    });
  }

  // ------------------------------------------------------------------
  // Reset password
  // ------------------------------------------------------------------
  async resetPassword(token, newPassword) {
    const tokenHash   = hashToken(token);
    const tokenRecord = await prisma.tokenUsuario.findFirst({
      where: { tokenHash, tipo: 'reset_password', usado: false, expiresAt: { gt: new Date() } },
    });
    if (!tokenRecord) throw { status: 400, message: 'Token inválido o expirado' };

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.usuario.update({ where: { id: tokenRecord.usuarioId }, data: { passwordHash } }),
      prisma.tokenUsuario.update({ where: { id: tokenRecord.id },    data: { usado: true } }),
    ]);
  }

  // ------------------------------------------------------------------
  // Verify email
  // ------------------------------------------------------------------
  async verifyEmail(token) {
    const tokenHash   = hashToken(token);
    const tokenRecord = await prisma.tokenUsuario.findFirst({
      where: { tokenHash, tipo: 'verify_email', usado: false, expiresAt: { gt: new Date() } },
    });
    if (!tokenRecord) throw { status: 400, message: 'Token inválido o expirado' };

    await prisma.$transaction([
      prisma.usuario.update({ where: { id: tokenRecord.usuarioId }, data: { emailVerificado: true } }),
      prisma.tokenUsuario.update({ where: { id: tokenRecord.id },    data: { usado: true } }),
    ]);
  }
}

module.exports = new AuthService();
