import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-no-encontrado',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="simple-page">
      <div class="simple-card card center">
        <div class="status-icon neutro"><mat-icon>travel_explore</mat-icon></div>
        <h2 class="mb-8">No encontramos esta página</h2>
        <p class="muted mb-24">Puede que el enlace esté mal escrito o que el contenido ya no exista.</p>
        <a class="btn btn-primary" [routerLink]="auth.isAuthenticated() ? auth.rutaInicio() : '/'">Ir al inicio</a>
      </div>
    </div>
  `,
})
export class NoEncontradoComponent {
  protected readonly auth = inject(AuthStore);
}
