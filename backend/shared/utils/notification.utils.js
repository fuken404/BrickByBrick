const prisma = require('./prisma.client');
const axios = require('axios');
const logger = require('./logger');

const NOTIF_SERVICE_URL = () =>
  `http://localhost:${process.env.PORT_NOTIF || 3006}`;

/**
 * Crea una notificación en DB y dispara el evento WebSocket.
 *
 * @param {{
 *   usuarioId: string,
 *   tipo: string,
 *   titulo: string,
 *   mensaje: string,
 *   urlDestino?: string
 * }} data
 */
async function createNotification(data) {
  try {
    const notification = await prisma.notificacion.create({ data });

    // Intentar emitir en tiempo real (no bloquear si falla)
    axios
      .post(
        `${NOTIF_SERVICE_URL()}/internal/emit`,
        { usuarioId: data.usuarioId, notification },
        {
          headers: { 'x-internal-key': process.env.INTERNAL_API_KEY },
          timeout: 3000,
        }
      )
      .catch((err) =>
        logger.warn('No se pudo emitir notificación en tiempo real:', err.message)
      );

    return notification;
  } catch (err) {
    logger.error('Error creando notificación:', err);
    throw err;
  }
}

module.exports = { createNotification };
