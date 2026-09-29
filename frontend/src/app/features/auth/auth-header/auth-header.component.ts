import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The same brand asset and wordmark proportions as the public landing page. */
@Component({
  selector: 'app-auth-header',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="auth-header">
      <a routerLink="/" class="auth-wordmark" aria-label="BrickByBrick · Inicio">
        <img src="favicon.svg" width="34" height="34" alt="" />
        <span>BrickByBrick<span class="wordmark-dot">.</span></span>
      </a>
      <a class="auth-header-link" [routerLink]="login() ? '/registro' : '/login'">
        {{ login() ? 'Crear una cuenta' : 'Iniciar sesión' }} <span aria-hidden="true">↗</span>
      </a>
    </header>
  `,
})
export class AuthHeaderComponent {
  readonly login = input(false);
}
