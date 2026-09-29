import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { mensajeError } from '../../../core/utils/http';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="simple-page">
      <div class="simple-card card center">
        @switch (estado()) {
          @case ('cargando') {
            <div class="status-icon neutro"><mat-icon class="spin">sync</mat-icon></div>
            <h2>Verificando tu correo…</h2>
          }
          @case ('ok') {
            <div class="status-icon ok"><mat-icon>check_circle</mat-icon></div>
            <h2 class="mb-8">¡Correo verificado!</h2>
            <p class="muted mb-24">Tu cuenta quedó confirmada.</p>
            <a [routerLink]="auth.isAuthenticated() ? auth.rutaInicio() : '/login'" class="btn btn-primary">
              {{ auth.isAuthenticated() ? 'Ir a mi panel' : 'Iniciar sesión' }}
            </a>
          }
          @default {
            <div class="status-icon err"><mat-icon>error</mat-icon></div>
            <h2 class="mb-8">Enlace inválido o expirado</h2>
            <p class="muted mb-24">{{ error() }} Puedes solicitar uno nuevo desde tu panel.</p>
            <a routerLink="/login" class="btn btn-ghost">Ir al inicio de sesión</a>
          }
        }
      </div>
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  readonly token = input.required<string>();
  protected readonly auth = inject(AuthStore);
  private readonly api = inject(AuthApiService);
  protected readonly estado = signal<'cargando' | 'ok' | 'error'>('cargando');
  protected readonly error = signal('');

  ngOnInit(): void {
    this.api.verifyEmail(this.token()).subscribe({
      next: () => {
        this.estado.set('ok');
        this.auth.actualizarUsuario({ emailVerificado: true });
      },
      error: (e) => { this.estado.set('error'); this.error.set(mensajeError(e, 'El enlace no es válido.')); },
    });
  }
}
