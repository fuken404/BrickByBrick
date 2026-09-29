/**
 * Convierte filas a CSV (RFC 4180) con BOM para que Excel respete tildes.
 * Neutraliza fórmulas para evitar inyección CSV (=, +, -, @).
 */
function celda(valor) {
  let s = valor === null || valor === undefined ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r;]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(filas) {
  if (!filas.length) return '﻿';
  const columnas = Object.keys(filas[0]);
  const lineas = [columnas.join(','), ...filas.map((f) => columnas.map((c) => celda(f[c])).join(','))];
  return `﻿${lineas.join('\r\n')}`;
}

module.exports = { toCsv, celda };
