const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter;

function smtpConfigurado() {
  if (['log', 'resend'].includes((process.env.MAIL_TRANSPORT || '').toLowerCase())) return false;
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Transporte de correo según MAIL_TRANSPORT:
 *   log    → se escribe en el log (desarrollo, o plataformas sin correo configurado)
 *   resend → API HTTPS de Resend (RESEND_API_KEY); útil donde el SMTP está bloqueado, como Railway
 *   smtp   → nodemailer con SMTP_* (valor por defecto si hay credenciales SMTP)
 */
function transporte() {
  const elegido = (process.env.MAIL_TRANSPORT || '').toLowerCase();
  if (elegido === 'log') return 'log';
  if (elegido === 'resend') return process.env.RESEND_API_KEY ? 'resend' : 'log';
  return smtpConfigurado() ? 'smtp' : 'log';
}

async function enviarPorResend(correo) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...correo, to: [correo.to] }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
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
 * Envía un correo con el transporte configurado (ver transporte()). Sin
 * transporte real se escribe en el log (útil para ver códigos OTP y enlaces).
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 */
async function sendEmail({ to, subject, html, text }) {
  if (process.env.NODE_ENV === 'test') return;

  const plain = text || aTextoPlano(html);

  const via = transporte();
  if (via === 'log') {
    registrarEnLog(to, subject, plain);
    return;
  }

  const correo = { from: process.env.EMAIL_FROM || 'BrickByBrick <noreply@brickbybrick.co>', to, subject, html, text: plain };
  try {
    if (via === 'resend') await enviarPorResend(correo);
    else await getTransporter().sendMail(correo);
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
