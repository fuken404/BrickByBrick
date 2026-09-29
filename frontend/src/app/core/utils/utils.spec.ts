import { HttpErrorResponse } from '@angular/common/http';
import { datetimeLocalAIso, fechaSoloDia, formatearDia, isoADatetimeLocal } from './fechas';
import { erroresPorCampo, mensajeError, nombreArchivo, toParams } from './http';

describe('utilidades de fecha', () => {
  it('datetime-local ↔ ISO es un viaje de ida y vuelta sin desfase', () => {
    const local = '2026-10-20T09:00';
    expect(isoADatetimeLocal(datetimeLocalAIso(local))).toBe(local);
  });

  it('las columnas DATE no se corren un día por la zona horaria', () => {
    expect(fechaSoloDia('2026-11-13T00:00:00.000Z')).toBe('2026-11-13');
    expect(formatearDia('2026-11-13T00:00:00.000Z')).toContain('13');
    expect(formatearDia(null)).toBe('—');
  });
});

describe('utilidades HTTP', () => {
  it('toParams omite vacíos', () => {
    const p = toParams({ q: 'ladrillo', page: 2, vacio: '', nulo: null, indef: undefined, activo: false });
    expect(p.keys().sort()).toEqual(['activo', 'page', 'q']);
    expect(p.get('page')).toBe('2');
  });

  it('mensajeError prioriza errores de validación y maneja la falta de red', () => {
    const validacion = new HttpErrorResponse({ status: 400, error: { message: 'Datos inválidos', errors: [{ field: 'nombre', message: 'Mínimo 3' }] } });
    expect(mensajeError(validacion)).toBe('Mínimo 3');
    expect(erroresPorCampo(validacion)).toEqual({ nombre: 'Mínimo 3' });
    expect(mensajeError(new HttpErrorResponse({ status: 0 }))).toMatch(/conexión/);
    expect(mensajeError(new Error('x'), 'Por defecto')).toBe('Por defecto');
  });

  it('nombreArchivo lee Content-Disposition', () => {
    expect(nombreArchivo('attachment; filename="constancia-BBB-2026-000001.pdf"', 'x.pdf')).toBe('constancia-BBB-2026-000001.pdf');
    expect(nombreArchivo(null, 'x.pdf')).toBe('x.pdf');
  });
});
