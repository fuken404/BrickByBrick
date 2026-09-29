import { CopCurrencyPipe } from './cop-currency.pipe';
import { EstadoBadgePipe } from './estado-badge.pipe';
import { EtiquetaPipe } from './etiqueta.pipe';
import { FechaRelativaPipe } from './fecha-relativa.pipe';

describe('pipes', () => {
  it('copCurrency formatea pesos colombianos sin decimales', () => {
    const p = new CopCurrencyPipe();
    expect(p.transform(1250000).replace(/\s/g, ' ')).toMatch(/^\$ ?1\.250\.000/);
    expect(p.transform(null)).toBe('$0 COP');
    expect(p.transform('abc')).toBe('$0 COP');
  });

  it('estadoBadge traduce estados por contexto y tolera valores desconocidos', () => {
    const p = new EstadoBadgePipe();
    expect(p.transform('pendiente', 'solicitud')).toEqual({ label: 'Pendiente', cssClass: 'badge-pendiente' });
    expect(p.transform('activo', 'material').label).toBe('Disponible');
    expect(p.transform('raro', 'evento').label).toBe('raro');
    expect(p.transform(null, 'evento').label).toBe('—');
  });

  it('etiqueta traduce enums', () => {
    const p = new EtiquetaPipe();
    expect(p.transform('entrega_masiva', 'tipoEvento')).toBe('Entrega masiva');
    expect(p.transform('camara_comercio', 'documento')).toBe('Cámara de Comercio');
  });

  it('fechaRelativa usa singular y plural correctos', () => {
    const p = new FechaRelativaPipe();
    const hace = (dias: number) => new Date(Date.now() - dias * 86400000).toISOString();
    expect(p.transform(new Date().toISOString())).toBe('hace un momento');
    expect(p.transform(hace(1))).toBe('ayer');
    expect(p.transform(hace(8))).toBe('hace 1 semana');
    expect(p.transform(hace(15))).toBe('hace 2 semanas');
    expect(p.transform(hace(40))).toBe('hace 1 mes');
    expect(p.transform(hace(400))).toBe('hace 1 año');
  });
});
