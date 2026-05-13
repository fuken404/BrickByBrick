import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formatea un número como moneda colombiana: $1.250.000 COP
 */
@Pipe({ name: 'copCurrency', standalone: true })
export class CopCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined, showSuffix = true): string {
    if (value === null || value === undefined) return showSuffix ? '$0 COP' : '$0';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return showSuffix ? '$0 COP' : '$0';

    const formatted = new Intl.NumberFormat('es-CO', {
      style:    'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);

    return showSuffix ? formatted : formatted.replace(' COP', '');
  }
}
