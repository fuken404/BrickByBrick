const PDFDocument = require('pdfkit');

const COLOR_PRIMARIO = '#C0392B';
const COLOR_TEXTO = '#2C2C2C';
const COLOR_SUAVE = '#6B6B6B';

const cop = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v || 0));
const fecha = (d) => new Date(d).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: 'long', day: 'numeric' });
const cedulaParcial = (c) => (c ? `••••${String(c).slice(-4)}` : '—');

const AVISO_LEGAL =
  'Este documento es un soporte informativo generado por BrickByBrick a partir de las entregas registradas '
  + 'en la plataforma y de los valores de referencia declarados por la empresa donante. No constituye por sí '
  + 'mismo un certificado tributario. El descuento por donaciones del artículo 257 del Estatuto Tributario '
  + '(aplicado conforme al artículo 255 modificado por la Ley 1819 de 2016) procede para donaciones a entidades '
  + 'sin ánimo de lucro del Régimen Tributario Especial y a entidades no contribuyentes, y está limitado por el '
  + 'artículo 258 del mismo Estatuto (25% del impuesto sobre la renta a cargo). Verifique con su contador o '
  + 'revisor fiscal la aplicación del beneficio.';

function encabezado(doc, titulo, subtitulo) {
  doc.fillColor(COLOR_PRIMARIO).font('Helvetica-Bold').fontSize(20).text('BrickByBrick', 50, 48);
  doc.fillColor(COLOR_SUAVE).font('Helvetica').fontSize(9)
    .text('Plataforma de donación de materiales de construcción — Bogotá, Colombia', 50, 72);
  doc.moveTo(50, 92).lineTo(545, 92).strokeColor(COLOR_PRIMARIO).lineWidth(1.5).stroke();
  doc.fillColor(COLOR_TEXTO).font('Helvetica-Bold').fontSize(15).text(titulo, 50, 108);
  if (subtitulo) doc.font('Helvetica').fontSize(10).fillColor(COLOR_SUAVE).text(subtitulo, 50, 128);
  doc.moveDown(2);
}

function bloque(doc, titulo, filas) {
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLOR_PRIMARIO).text(titulo.toUpperCase(), 50, doc.y);
  doc.moveDown(0.3);
  for (const [k, v] of filas) {
    const y = doc.y;
    doc.font('Helvetica').fontSize(10).fillColor(COLOR_SUAVE).text(k, 50, y, { width: 170 });
    doc.font('Helvetica').fontSize(10).fillColor(COLOR_TEXTO).text(String(v ?? '—'), 225, y, { width: 320 });
    doc.moveDown(0.25);
  }
  doc.x = 50;
}

function pie(doc) {
  doc.moveDown(1.5);
  doc.font('Helvetica-Oblique').fontSize(8).fillColor(COLOR_SUAVE).text(AVISO_LEGAL, 50, doc.y, { width: 495, align: 'justify' });
  doc.moveDown(0.8);
  doc.font('Helvetica').fontSize(8).text(`Generado el ${fecha(new Date())}`, 50, doc.y, { width: 495, align: 'right' });
}

function aBuffer(construir) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50, info: { Producer: 'BrickByBrick' } });
    const partes = [];
    doc.on('data', (c) => partes.push(c));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);
    construir(doc);
    doc.end();
  });
}

/** Constancia de una entrega individual. */
function constanciaPdf({ solicitud, constructora }) {
  return aBuffer((doc) => {
    encabezado(doc, 'Constancia de donación de materiales', `No. ${solicitud.numeroConstancia}`);
    bloque(doc, 'Empresa donante', [
      ['Razón social', constructora.razonSocial],
      ['NIT', constructora.nit],
      ['Dirección', constructora.direccion],
      ['Localidad', constructora.localidad?.nombre],
    ]);
    bloque(doc, 'Beneficiario', [
      ['Nombre', solicitud.beneficiario.nombreCompleto],
      ['Documento', `C.C. ${cedulaParcial(solicitud.beneficiario.cedula)}`],
      ['Localidad', solicitud.beneficiario.localidad?.nombre],
    ]);
    const cantidad = Number(solicitud.cantidadSolicitada);
    bloque(doc, 'Material entregado', [
      ['Material', solicitud.material.nombre],
      ['Categoría', solicitud.material.categoria.nombre],
      ['Cantidad', `${cantidad} ${solicitud.material.unidadMedida}`],
      ['Valor unitario de referencia', cop(solicitud.material.valorUnitarioCop)],
      ['Valor total donado', cop(solicitud.valorDonadoCop)],
      ['Fecha de entrega', fecha(solicitud.fechaEntrega)],
      ['Recepción confirmada', solicitud.fechaConfirmacion ? `Sí, el ${fecha(solicitud.fechaConfirmacion)}` : 'Pendiente de confirmación del beneficiario'],
    ]);
    pie(doc);
  });
}

/** Resumen anual con todas las constancias del periodo. */
function certificadoAnualPdf({ constructora, resumen, entregas }) {
  return aBuffer((doc) => {
    encabezado(doc, `Resumen anual de donaciones ${resumen.anio}`, constructora.razonSocial);
    bloque(doc, 'Empresa donante', [
      ['Razón social', constructora.razonSocial],
      ['NIT', constructora.nit],
      ['Estado en la plataforma', constructora.verificada ? 'Verificada' : 'Pendiente de verificación'],
    ]);
    bloque(doc, 'Totales del periodo', [
      ['Entregas registradas', resumen.entregas],
      ['Valor total donado', cop(resumen.valorDonadoCop)],
      [`Descuento estimado (${resumen.porcentaje}%)`, cop(resumen.descuentoEstimadoCop)],
    ]);

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLOR_PRIMARIO).text('DETALLE DE CONSTANCIAS', 50, doc.y);
    doc.moveDown(0.4);
    const col = [50, 165, 365, 455];
    const cab = ['Constancia', 'Material', 'Fecha', 'Valor'];
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_TEXTO);
    const yCab = doc.y;
    cab.forEach((t, i) => doc.text(t, col[i], yCab, { width: i === 1 ? 190 : 90, align: i === 3 ? 'right' : 'left' }));
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(9);
    for (const e of entregas) {
      if (doc.y > 690) doc.addPage();
      const y = doc.y;
      doc.text(e.numeroConstancia ?? '—', col[0], y, { width: 110 });
      doc.text(`${e.material.nombre} (${Number(e.cantidadSolicitada)} ${e.material.unidadMedida})`, col[1], y, { width: 190 });
      doc.text(new Date(e.fechaEntrega).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }), col[2], y, { width: 90 });
      doc.text(cop(e.valorDonadoCop), col[3], y, { width: 90, align: 'right' });
      doc.moveDown(0.35);
    }
    doc.x = 50;
    pie(doc);
  });
}

module.exports = { constanciaPdf, certificadoAnualPdf };
