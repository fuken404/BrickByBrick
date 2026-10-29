/** Une los resultados en resultados/RESUMEN.md para copiarlos al capítulo 4. */
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || path.join(__dirname, 'resultados');
const leer = (f) => { try { return JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); } catch { return null; } };
const l = [];
l.push(`# Evidencias capítulo 4 — ${new Date().toLocaleString('es-CO')}`, '');
l.push(`Equipo: ${require('os').cpus()[0]?.model} · ${require('os').cpus().length} núcleos · ${Math.round(require('os').totalmem() / 1e9)} GB RAM · Node ${process.version} · ${process.platform}`, '');

const jest = leer('jest.json');
if (jest) {
  l.push('## Pruebas de integración backend (Jest)', '');
  l.push(`Suites: ${jest.numPassedTestSuites}/${jest.numTotalTestSuites} · Pruebas: ${jest.numPassedTests} aprobadas, ${jest.numFailedTests} fallidas, ${jest.numTotalTests} en total · Duración: ${(Math.max(...jest.testResults.map((t) => t.endTime)) - jest.startTime) / 1000} s`, '');
  l.push('| Archivo | Aprobadas | Fallidas |', '|---|---|---|');
  for (const s of jest.testResults) {
    const ok = s.assertionResults.filter((a) => a.status === 'passed').length;
    const ko = s.assertionResults.filter((a) => a.status === 'failed').length;
    l.push(`| ${path.relative(path.resolve(__dirname, '../backend'), s.name)} | ${ok} | ${ko} |`);
  }
  const fallidas = jest.testResults.flatMap((s) => s.assertionResults.filter((a) => a.status === 'failed').map((a) => a.fullName));
  if (fallidas.length) l.push('', 'Fallidas:', ...fallidas.map((f) => `- ${f}`));
  l.push('');
}
const cob = leer('cobertura-backend.json');
if (cob) {
  const t = cob.total;
  l.push('## Cobertura backend', '', `Líneas ${t.lines.pct}% · Sentencias ${t.statements.pct}% · Funciones ${t.functions.pct}% · Ramas ${t.branches.pct}%`, '');
}
for (const [f, n] of [['audit-backend.json', 'backend'], ['audit-frontend.json', 'frontend']]) {
  const a = leer(f);
  if (a?.metadata) l.push(`## npm audit ${n} (producción)`, '', JSON.stringify(a.metadata.vulnerabilities), '');
}
const seg = leer('seguridad.json');
if (seg) {
  l.push('## Pruebas de seguridad', '', '| ID | Prueba | Esperado | Obtenido | Resultado |', '|---|---|---|---|---|');
  for (const r of seg.resultados) l.push(`| ${r.id} | ${r.prueba} | ${r.esperado} | ${r.obtenido.replace(/\|/g, '/')} | ${r.cumple ? 'Cumple' : 'No cumple'} |`);
  l.push('');
}
const carga = leer('carga.json');
if (carga) {
  l.push('## Pruebas de desempeño', '', '| Escenario | Conexiones | Peticiones | Req/s | Prom. ms | p50 | p90 | p97,5 | p99 | Máx | No 2xx | Errores | Timeouts |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of carga.filas) l.push(`| ${r.escenario} | ${r.conexiones} | ${r.peticiones} | ${r.rps} | ${r.promedioMs} | ${r.p50Ms} | ${r.p90Ms} | ${r.p97_5Ms} | ${r.p99Ms} | ${r.maxMs} | ${r.no2xx} | ${r.errores} | ${r.timeouts} |`);
  l.push('');
}
fs.writeFileSync(path.join(OUT, 'RESUMEN.md'), l.join('\n'));
console.log(`\nResumen en ${path.join(OUT, 'RESUMEN.md')}`);
