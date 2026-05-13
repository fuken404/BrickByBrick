import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../core/services/auth-api.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="verify-page">
      <div class="verify-card card">
        @if (loading()) {
          <div class="status-icon loading"><mat-icon class="spin">sync</mat-icon></div>
          <h2>Verificando tu correo...</h2>
          <p>Por favor espera un momento.</p>
        } @else if (success()) {
          <div class="status-icon success"><mat-icon>check_circle</mat-icon></div>
          <h2>¡Correo verificado!</h2>
          <p>Tu cuenta está activa. Ya puedes iniciar sesión.</p>
          <a routerLink="/login" class="btn btn-primary">Ir al login</a>
        } @else {
          <div class="status-icon error"><mat-icon>error</mat-icon></div>
          <h2>Enlace inválido o expirado</h2>
          <p>{{ errorMsg() }}</p>
          <a routerLink="/login" class="btn btn-ghost">Volver al login</a>
        }
      </div>
    </div>
  `,
  styles: [`
    .verify-page {
      min-height: 100vh; background: var(--bg-base);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .verify-card {
      max-width: 420px; width: 100%; padding: 48px 40px;
      text-align: center;
      h2 { margin-bottom: 12px; }
      p  { color: var(--text-secondary); font-size: 15px; margin-bottom: 28px; }
    }
    .status-icon {
      width: 72px; height: 72px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
      mat-icon { font-size: 36px; }
    }
    .status-icon.loading { background: var(--bg-base); mat-icon { color: var(--text-secondary); } }
    .status-icon.success { background: rgba(39,174,96,.1); mat-icon { color: var(--accent); } }
    .status-icon.error   { background: var(--danger-light); mat-icon { color: var(--danger); } }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class VerifyEmailComponent implements OnInit {
  private readonly authApi = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly success = signal(false);
  protected readonly errorMsg = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.authApi.verifyEmail(token).subscribe({
      next: () => { this.loading.set(false); this.success.set(true); },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message ?? 'El enlace de verificación no es válido o ha expirado.');
      },
    });
  }
}
