import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { UserApiService } from '../../../core/services/user-api.service';
import { EstadisticasPublicas } from '../../../core/models';

/** Panel lateral de marca con cifras reales de la plataforma. */
@Component({
  selector: 'app-auth-panel',
  standalone: true,
  imports: [MatIconModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-left" [class.empresa]="variante() === 'empresa'">
      <div class="auth-left-inner">
        <div class="auth-brand">
          <div class="brand-icon"><mat-icon>layers</mat-icon></div>
          <h1>BrickByBrick</h1>
        </div>
        <p class="auth-tagline">{{ lema() }}</p>
        @if (stats(); as s) {
          <div class="auth-stats">
            <div class="stat-item"><mat-icon>volunteer_activism</mat-icon><span>{{ s.entregasRealizadas | number }} entregas de material realizadas</span></div>
            <div class="stat-item"><mat-icon>verified</mat-icon><span>{{ s.constructorasVerificadas | number }} constructoras verificadas</span></div>
            <div class="stat-item"><mat-icon>inventory_2</mat-icon><span>{{ s.materialesDisponibles | number }} materiales disponibles hoy</span></div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AuthPanelComponent {
  readonly variante = input<'beneficiario' | 'empresa'>('beneficiario');
  readonly lema = input('Materiales que sobran, hogares que crecen. Economía circular con propósito social.');
  protected readonly stats = signal<EstadisticasPublicas | null>(null);

  constructor() {
    inject(UserApiService).estadisticasPublicas().subscribe({ next: (r) => this.stats.set(r.data), error: () => undefined });
  }
}
