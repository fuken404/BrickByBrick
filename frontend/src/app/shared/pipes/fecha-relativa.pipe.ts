import { Pipe, PipeTransform } from '@angular/core';

/**
 * Transforma una fecha ISO en texto relativo: "hace 2 horas", "ayer", "hace 3 días"
 * Locale: es-CO
 */
const plural = (n: number, uno: string, varios: string) => `hace ${n} ${n === 1 ? uno : varios}`;

@Pipe({ name: 'fechaRelativa', standalone: true, pure: false })
export class FechaRelativaPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;
    const now   = new Date();
    const diffMs  = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr  = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr  / 24);

    if (diffSec < 60)   return 'hace un momento';
    if (diffMin < 60)   return `hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
    if (diffHr  < 24)   return `hace ${diffHr} ${diffHr  === 1 ? 'hora'   : 'horas'}`;
    if (diffDay === 1)  return 'ayer';
    if (diffDay < 7)    return `hace ${diffDay} días`;
    if (diffDay < 30)   return plural(Math.floor(diffDay / 7), 'semana', 'semanas');
    if (diffDay < 365)  return plural(Math.floor(diffDay / 30), 'mes', 'meses');
    return plural(Math.floor(diffDay / 365), 'año', 'años');
  }
}
