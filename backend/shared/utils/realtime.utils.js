const axios = require('axios');
const logger = require('./logger');

const notifUrl = () => process.env.NOTIF_SERVICE_URL || `http://localhost:${process.env.PORT_NOTIF || 3006}`;

/**
 * Emite un evento Socket.io a través del notification-service.
 * @param {{ usuarioIds?: string[], room?: string, evento: string, payload: unknown }} data
 */
function emitirTiempoReal(data) {
  if (process.env.NODE_ENV === 'test') return Promise.resolve();
  return axios
    .post(`${notifUrl()}/internal/emit`, data, {
      headers: { 'x-internal-key': process.env.INTERNAL_API_KEY },
      timeout: 3000,
    })
    .catch((err) => logger.warn(`No se pudo emitir "${data.evento}" en tiempo real: ${err.message}`));
}

module.exports = { emitirTiempoReal };
