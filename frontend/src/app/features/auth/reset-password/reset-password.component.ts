import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../core/services/auth-api.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="reset-page">
      <div class="reset-card card">
        <div class="reset-brand">
          <div class="brand-icon"><mat-icon>layers</mat-icon></div>
          <span>BrickByBrick</span>
        </div>

        <!-- Forgot mode (no token in route) -->
        @if (!token) {
          <h2>Recuperar contraseña</h2>
          <p class="reset-subtitle">Ingresa tu correo y te enviaremos un enlace de recuperación.</p>
          <div class="form-group" style="margin-bottom:20px">
            <label class="form-label">Correo electrónico</label>
            <input class="form-input" type="email" placeholder="correo@ejemplo.com" [(ngModel)]="email" name="email" />
          </div>
          @if (sentEmail()) {
            <div class="form-success-banner">
              <mat-icon>check_circle</mat-icon> Revisa tu correo. Si está registrado, recibirás el enlace en minutos.
            </div>
          }
          @if (errorMsg()) {
            <div class="form-error-banner"><mat-icon>warning</mat-icon> {{ errorMsg() }}</div>
          }
          <button class="btn btn-primary btn-block" [disabled]="loading()" (click)="sendReset()">
            @if (loading()) { <mat-icon class="spin">sync</mat-icon> }
            Enviar enlace
          </button>
        }

        <!-- Reset mode (token in route) -->
        @if (token) {
          <h2>Nueva contraseña</h2>
          <p class="reset-subtitle">Elige una contraseña segura para tu cuenta.</p>
          <div class="form-fields">
            <div class="form-group">
              <label class="form-label">Nueva contraseña</label>
              <div class="pass-wrapper">
                <input class="form-input" [type]="showPass() ? 'text' : 'password'"
                       placeholder="Mínimo 8 caracteres" [(ngModel)]="newPassword" name="pass" />
                <button type="button" class="pass-toggle" (click)="showPass.update(v => !v)">
                  <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Confirmar contraseña</label>
              <input class="form-input" type="password" placeholder="Repite la contraseña"
                     [(ngModel)]="confirmPassword" name="confirm"
                     [class.error]="passError()" />
            </div>
          </div>
          @if (success()) {
            <div class="form-success-banner" style="margin-top:16px">
              <mat-icon>check_circle</mat-icon> ¡Contraseña actualizada! Redirigiendo al login...
            </div>
          }
          @if (errorMsg()) {
            <div class="form-error-banner" style="margin-top:16px"><mat-icon>warning</mat-icon> {{ errorMsg() }}</div>
          }
          <button class="btn btn-primary btn-block" style="margin-top:20px"
                  [disabled]="loading() || passError()" (click)="resetPass()">
            @if (loading()) { <mat-icon class="spin">sync</mat-icon> }
            Actualizar contraseña
          </button>
        }

        <a routerLink="/login" class="back-link">
          <mat-icon>chevron_left</mat-icon> Volver al login
        </a>
      </div>
    </div>
  `,
  styles: [`
    .reset-page {
      min-height: 100vh; background: var(--bg-base);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .reset-card { max-width: 420px; width: 100%; padding: 40px; }
    .reset-brand {
      display: flex; align-items: center; gap: 10px; margin-bottom: 32px;
      .brand-icon {
        width: 32px; height: 32px; background: var(--primary); border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        mat-icon { color: #fff; font-size: 16px; }
      }
      span { font-family: var(--font-display); font-weight: 700; font-size: 18px; }
    }
    h2 { margin-bottom: 8px; }
    .reset-subtitle { color: var(--text-secondary); font-size: 14px; margin-bottom: 28px; }
    .form-fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 20px; }
    .pass-wrapper { position: relative; }
    .pass-toggle {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: 4px;
      mat-icon { color: var(--text-secondary); font-size: 18px; }
    }
    .btn-block { width: 100%; }
    .form-error-banner {
      display: flex; align-items: center; gap: 8px;
      background: var(--danger-light); border: 1px solid rgba(231,76,60,.3);
      border-radius: 8px; padding: 10px 14px; font-size: 13px; color: var(--danger); margin-bottom: 16px;
      mat-icon { font-size: 16px; }
    }
    .form-success-banner {
      display: flex; align-items: center; gap: 8px;
      background: rgba(39,174,96,.08); border: 1px solid rgba(39,174,96,.3);
      border-radius: 8px; padding: 10px 14px; font-size: 13px; color: var(--accent); margin-bottom: 16px;
      mat-icon { font-size: 16px; }
    }
    .back-link {
      display: inline-flex; align-items: center; gap: 4px; margin-top: 24px;
      font-size: 13px; color: var(--text-secondary); text-decoration: none;
      mat-icon { font-size: 16px; }
    }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class ResetPasswordComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly token = this.route.snapshot.paramMap.get('token');
  protected readonly loading = signal(false);
  protected readonly errorMsg = signal('');
  protected readonly success = signal(false);
  protected readonly sentEmail = signal(false);
  protected readonly showPass = signal(false);

  email = '';
  newPassword = '';
  confirmPassword = '';

  passError(): boolean {
    return !!this.confirmPassword && this.newPassword !== this.confirmPassword;
  }

  sendReset(): void {
    if (!this.email) return;
    this.loading.set(true);
    this.errorMsg.set('');
    this.authApi.forgotPassword(this.email).subscribe({
      next: () => { this.loading.set(false); this.sentEmail.set(true); },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Error al enviar el correo. Intenta nuevamente.');
      },
    });
  }

  resetPass(): void {
    if (!this.token || this.passError()) return;
    this.loading.set(true);
    this.errorMsg.set('');
    this.authApi.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Error al actualizar la contraseña.');
      },
    });
  }
}
