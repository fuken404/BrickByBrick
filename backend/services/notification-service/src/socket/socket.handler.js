const { Server } = require('socket.io');
const { verifyAccessToken, logger, config } = require('@brickbybrick/shared');
const repo = require('../repositories/notificacion.repository');

let io;

const salaUsuario = (id) => `usuario:${id}`;

/**
 * Socket.io autenticado con el JWT de acceso (handshake.auth.token).
 * Cada usuario entra a `usuario:<id>`; los chats de grupo usan `grupo:<id>`
 * y solo se permite entrar a miembros activos.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    path: '/ws/notificaciones',
    cors: { origin: config.FRONTEND_URL, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token de autenticación requerido'));
    try {
      const decoded = verifyAccessToken(token);
      socket.data.userId = decoded.userId;
      socket.data.rol = decoded.rol;
      return next();
    } catch {
      return next(new Error('Token inválido o expirado'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket.data;
    socket.join(salaUsuario(userId));

    socket.on('grupo:entrar', async ({ grupoId } = {}, ack) => {
      try {
        const permitido = typeof grupoId === 'string'
          && (socket.data.rol === 'ADMINISTRADOR' || await repo.esMiembroActivo(grupoId, userId));
        if (permitido) socket.join(`grupo:${grupoId}`);
        if (typeof ack === 'function') ack({ ok: permitido });
      } catch (err) {
        logger.warn(`Socket grupo:entrar falló: ${err.message}`);
        if (typeof ack === 'function') ack({ ok: false });
      }
    });

    socket.on('grupo:salir', ({ grupoId } = {}) => {
      if (typeof grupoId === 'string') socket.leave(`grupo:${grupoId}`);
    });
  });

  return io;
}

/** Emite a usuarios concretos y/o a una sala. */
function emitir({ usuarioIds = [], room, evento, payload }) {
  if (!io) return;
  if (room) io.to(room).emit(evento, payload);
  if (usuarioIds.length) io.to(usuarioIds.map(salaUsuario)).emit(evento, payload);
}

module.exports = { initSocket, emitir };
