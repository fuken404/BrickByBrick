const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Envía un correo electrónico.
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 * @returns {Promise<void>}
 */
async function sendEmail({ to, subject, html, text }) {
  if (process.env.NODE_ENV === 'test') return;

  try {
    const t = getTransporter();
    await t.sendMail({
      from: process.env.EMAIL_FROM || 'BrickByBrick <noreply@brickbybrick.co>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });
    logger.debug(`Email enviado a ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Error enviando email a ${to}:`, err);
    throw err;
  }
}

module.exports = { sendEmail };
