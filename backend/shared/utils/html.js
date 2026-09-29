/** Escapa texto para interpolarlo en HTML de correos/PDF. */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Plantilla base de los correos transaccionales. */
function plantillaCorreo({ titulo, cuerpoHtml, ctaTexto, ctaUrl }) {
  const boton = ctaUrl
    ? `<p style="margin:28px 0"><a href="${escapeHtml(ctaUrl)}" style="background:#C0392B;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(ctaTexto || 'Ver en BrickByBrick')}</a></p>`
    : '';
  return `<!doctype html><html lang="es"><body style="margin:0;background:#F5F0EB;font-family:'DM Sans',Arial,sans-serif;color:#2C2C2C">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#C0392B;margin-bottom:20px">BrickByBrick</div>
    <div style="background:#fff;border-radius:12px;padding:28px">
      <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(titulo)}</h1>
      ${cuerpoHtml}
      ${boton}
    </div>
    <p style="font-size:12px;color:#6B6B6B;margin-top:20px">Recibes este correo porque tienes una cuenta en BrickByBrick. Puedes ajustar tus preferencias de notificación desde tu perfil.</p>
  </div></body></html>`;
}

module.exports = { escapeHtml, plantillaCorreo };
