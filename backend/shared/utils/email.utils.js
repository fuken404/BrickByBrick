const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter;

function smtpConfigurado() {
  if (process.env.MAIL_TRANSPORT === 'log') return false;
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

const registrarEnLog = (to, subject, plain) =>
  logger.warn(`[email:log] Para: ${to} | Asunto: ${subject} | ${plain}`);

const ENTIDADES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
const decodificar = (t) => t.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (e) => ENTIDADES[e]);

/**
 * Versión en texto plano del correo. Conserva la URL de cada enlace
 * ("Texto: https://…"): sin ella los botones de acción quedarían inservibles
 * en clientes de solo texto y en el log de desarrollo.
 */
function aTextoPlano(html) {
  const texto = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, url, etiqueta) => {
      const nombre = etiqueta.replace(/<[^>]+>/g, '').trim();
      return nombre ? `${nombre}: ${url}` : url;
    })
    .replace(/<\/(p|div|h[1-6]|li|tr)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decodificar(texto).replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Envía un correo. Con MAIL_TRANSPORT=log o sin SMTP configurado se escribe
 * en el log (útil en desarrollo para ver códigos OTP y enlaces).
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 */
async function sendEmail({ to, subject, html, text }) {
  if (process.env.NODE_ENV === 'test') return;

  const plain = text || aTextoPlano(html);

  if (!smtpConfigurado()) {
    registrarEnLog(to, subject, plain);
    return;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || 'BrickByBrick <noreply@brickbybrick.co>',
      to,
      subject,
      html,
      text: plain,
    });
    logger.debug(`Email enviado a ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Error enviando email a ${to}: ${err.message}`);
    // En desarrollo dejamos el contenido en el log para no bloquear flujos (OTP, verificación)
    if (process.env.NODE_ENV !== 'production') {
      registrarEnLog(to, subject, plain);
      return;
    }
    throw err;
  }
}

module.exports = { sendEmail, smtpConfigurado, aTextoPlano };
