const prisma = require('./prisma.client');
const logger = require('./logger');
const { rutaPara } = require('./rutas');
const { sendEmail } = require('./email.utils');
const { plantillaCorreo, escapeHtml } = require('./html');
const { emitirTiempoReal } = require('./realtime.utils');

const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:4200';

/**
 * Crea notificaciones in-app (y opcionalmente correo) para uno o varios usuarios.
 * La URL de destino se calcula según el rol de cada destinatario.
 *
 * @param {{
 *   usuarioIds: string[],
 *   tipo: string,
 *   titulo: string,
 *   mensaje: string,
 *   recurso?: string,
 *   recursoId?: string,
 *   email?: boolean | { asunto?: string, cuerpoHtml?: string, cta?: string },
 * }} data
 */
async function notificar(data) {
  const ids = [...new Set((data.usuarioIds || []).filter(Boolean))];
  if (!ids.length) return [];

  try {
    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: ids }, estado: { not: 'suspendido' } },
      select: { id: true, rol: true, email: true, preferenciasNotif: true },
    });

    const creadas = [];
    for (const u of usuarios) {
      const urlDestino = data.recurso ? rutaPara(u.rol, data.recurso, data.recursoId) : null;
      const prefs = u.preferenciasNotif || {};

      if (prefs.inApp !== false) {
        const notificacion = await prisma.notificacion.create({
          data: { usuarioId: u.id, tipo: data.tipo, titulo: data.titulo, mensaje: data.mensaje, urlDestino },
        });
        creadas.push(notificacion);
        emitirTiempoReal({ usuarioIds: [u.id], evento: 'notification', payload: notificacion });
      }

      if (data.email && prefs.email !== false) {
        const opts = typeof data.email === 'object' ? data.email : {};
        sendEmail({
          to: u.email,
          subject: `${opts.asunto || data.titulo} — BrickByBrick`,
          html: plantillaCorreo({
            titulo: data.titulo,
            cuerpoHtml: opts.cuerpoHtml || `<p>${escapeHtml(data.mensaje)}</p>`,
            ctaTexto: opts.cta,
            ctaUrl: urlDestino ? `${frontendUrl()}${urlDestino}` : frontendUrl(),
          }),
        }).catch(() => {});
      }
    }
    return creadas;
  } catch (err) {
    logger.error(`Error creando notificaciones (${data.tipo}): ${err.message}`);
    return [];
  }
}

/** Atajo para un solo destinatario. */
function createNotification({ usuarioId, ...rest }) {
  return notificar({ usuarioIds: [usuarioId], ...rest });
}

/** Notifica a todos los administradores activos. */
async function notificarAdmins(data) {
  const admins = await prisma.usuario.findMany({
    where: { rol: 'ADMINISTRADOR', estado: 'activo' },
    select: { id: true },
  });
  return notificar({ ...data, usuarioIds: admins.map((a) => a.id) });
}

module.exports = { notificar, createNotification, notificarAdmins };
