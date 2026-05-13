const { Server } = require('socket.io');
const { verifyAccessToken, logger } = require('@brickbybrick/shared');

let ioInstance;

/**
 * Inicializa Socket.io en el servidor HTTP.
 * Los clientes se conectan enviando el JWT como query param o en el header.
 *
 * Cada usuario autenticado se une a una sala con su userId.
 * Para emitir: io.to(userId).emit('notification', data)
 *
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || 'http://localhost:4200',
      credentials: true,
    },
    path: '/ws/notificaciones',
  });

  // Middleware de autenticación JWT
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Token de autenticación requerido'));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.data.userId = decoded.userId;
      socket.data.rol    = decoded.rol;
      next();
    } catch {
      next(new Error('Token inválido o expirado'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(userId);
    logger.debug(`Socket conectado: userId=${userId}`);

    socket.on('disconnect', () => {
      logger.debug(`Socket desconectado: userId=${userId}`);
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Emite una notificación a un usuario específico.
 * @param {string} userId
 * @param {object} notification
 */
function emitToUser(userId, notification) {
  if (!ioInstance) return;
  ioInstance.to(userId).emit('notification', notification);
}

/**
 * Devuelve la instancia de Socket.io (disponible tras initSocket).
 */
function getIO() {
  return ioInstance;
}

module.exports = { initSocket, emitToUser, getIO };
