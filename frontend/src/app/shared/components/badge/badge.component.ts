import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

type BadgeType =
  | 'disponible' | 'pendiente' | 'aprobado' | 'entregado'
  | 'rechazado' | 'verificado' | 'pendiente-verificacion'
  | 'secundario' | 'primary' | 'warning' | 'danger';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [ngClass]="cssClass"><ng-content /></span>`,
  styles: [``],
})
export class BadgeComponent {
  @Input() type: BadgeType = 'disponible';

  get cssClass(): string {
    const map: Record<BadgeType, string> = {
      disponible:              'badge-disponible',
      pendiente:               'badge-pendiente',
      aprobado:                'badge-aprobado',
      entregado:               'badge-entregado',
      rechazado:               'badge-rechazado',
      verificado:              'badge-verificado',
      'pendiente-verificacion':'badge-pendiente-verificacion',
      secundario:              'badge-secundario',
      primary:                 'badge-primary',
      warning:                 'badge-warning',
      danger:                  'badge-rechazado',
    };
    return map[this.type] ?? 'badge-secundario';
  }
}
