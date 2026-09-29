/**
 * Utilidades de fecha. Los inputs datetime-local y date trabajan en hora local
 * del navegador (Bogotá para los usuarios de la plataforma).
 */
const pad = (n: number) => String(n).padStart(2, '0');

/** ISO (UTC) → valor para <input type="datetime-local"> en hora local. */
export function isoADatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Valor de <input type="datetime-local"> → ISO con zona horaria. */
export function datetimeLocalAIso(valor: string): string {
  return new Date(valor).toISOString();
}

/** Columna DATE (medianoche UTC) → yyyy-MM-dd sin desfase de zona horaria. */
export function fechaSoloDia(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}

/** Hoy en formato yyyy-MM-dd (hora local). */
export function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Fecha mínima para datetime-local (ahora). */
export function ahoraDatetimeLocal(): string {
  return isoADatetimeLocal(new Date().toISOString());
}

/** Formatea una columna DATE para mostrar (sin desfase). */
export function formatearDia(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}
