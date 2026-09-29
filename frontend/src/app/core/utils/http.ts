import { HttpErrorResponse, HttpParams } from '@angular/common/http';

type Primitivo = string | number | boolean | null | undefined;

/** Convierte un objeto de filtros en HttpParams, omitiendo vacíos. */
export function toParams(filtros: object = {}): HttpParams {
  let params = new HttpParams();
  for (const [k, v] of Object.entries(filtros) as [string, Primitivo][]) {
    if (v === undefined || v === null || v === '') continue;
    params = params.set(k, String(v));
  }
  return params;
}

/** Mensaje legible de un error HTTP de la API. */
export function mensajeError(err: unknown, porDefecto = 'Ocurrió un error. Intenta de nuevo.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No hay conexión con el servidor. Revisa tu red e intenta de nuevo.';
    const body = err.error as { message?: string; errors?: { field: string; message: string }[] } | null;
    if (body?.errors?.length) return body.errors.map((e) => e.message).join('. ');
    if (body?.message) return body.message;
  }
  return porDefecto;
}

/** Errores de validación por campo devueltos por la API. */
export function erroresPorCampo(err: unknown): Record<string, string> {
  if (!(err instanceof HttpErrorResponse)) return {};
  const body = err.error as { errors?: { field: string; message: string }[] } | null;
  return Object.fromEntries((body?.errors ?? []).map((e) => [e.field, e.message]));
}

/** Descarga un Blob con el nombre indicado. */
export function descargarArchivo(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Extrae el nombre de archivo de Content-Disposition. */
export function nombreArchivo(disposition: string | null, porDefecto: string): string {
  const match = disposition?.match(/filename="?([^";]+)"?/);
  return match?.[1] ?? porDefecto;
}
