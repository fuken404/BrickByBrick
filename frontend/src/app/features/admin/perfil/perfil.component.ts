import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthStore } from '../../../core/auth/auth.store';
import { AuthApiService } from '../../../core/services/auth-api.service';

@Component({
  selector: 'app-admin-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1 class="page-title">Mi perfil</h1>
      <p class="page-subtitle">Gestiona tu cuenta de administrador.</p>

      <div class="perfil-layout">

        <!-- Info de cuenta -->
        <section class="card section-card">
          <div class="section-header">
            <div class="avatar-circle">
              <mat-icon>admin_panel_settings</mat-icon>
            </div>
            <div>
              <div class="section-title">Cuenta de administrador</div>
              <div class="section-sub">Acceso total a la plataforma BrickByBrick</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">{{ email() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Rol</span>
              <span class="role-badge">Administrador</span>
            </div>
            <div class="info-row">
              <span class="info-label">Estado</span>
              <span class="estado-pill activo">Activo</span>
            </div>
          </div>
        </section>

        <!-- Cambiar contraseña -->
        <section class="card section-card">
          <div class="section-header-simple">
            <div class="section-icon">
              <mat-icon>lock</mat-icon>
            </div>
            <div>
              <div class="section-title">Cambiar contraseña</div>
              <div class="section-sub">Usa una contraseña de al menos 8 caracteres</div>
            </div>
          </div>

          <div class="form-stack">
            <div class="field">
              <label>Contraseña actual</label>
              <div class="input-wrap">
                <input
                  class="inp"
                  [type]="showActual() ? 'text' : 'password'"
                  [(ngModel)]="passwordActual"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button class="eye-btn" type="button" (click)="showActual.set(!showActual())">
                  <mat-icon>{{ showActual() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            <div class="field">
              <label>Nueva contraseña</label>
              <div class="input-wrap">
                <input
                  class="inp"
                  [type]="showNueva() ? 'text' : 'password'"
                  [(ngModel)]="passwordNueva"
                  placeholder="••••••••"
                  autocomplete="new-password"
                />
                <button class="eye-btn" type="button" (click)="showNueva.set(!showNueva())">
                  <mat-icon>{{ showNueva() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            <div class="field">
              <label>Confirmar nueva contraseña</label>
              <div class="input-wrap">
                <input
                  class="inp"
                  [type]="showConfirm() ? 'text' : 'password'"
                  [(ngModel)]="passwordConfirm"
                  placeholder="••••••••"
                  autocomplete="new-password"
                />
                <button class="eye-btn" type="button" (click)="showConfirm.set(!showConfirm())">
                  <mat-icon>{{ showConfirm() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
              @if (passwordNueva && passwordConfirm && passwordNueva !== passwordConfirm) {
                <span class="field-error">Las contraseñas no coinciden</span>
              }
            </div>

            <div class="form-actions">
              <button
                class="btn btn-primary"
                (click)="cambiarPassword()"
                [disabled]="saving() || !puedeGuardar()"
              >
                @if (saving()) { Guardando… } @else { Actualizar contraseña }
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  `,
  styleUrl: './perfil.component.scss',
})
export class AdminPerfilComponent {
  private readonly auth    = inject(AuthStore);
  private readonly authSvc = inject(AuthApiService);
  private readonly snack   = inject(MatSnackBar);

  readonly saving      = signal(false);
  readonly showActual  = signal(false);
  readonly showNueva   = signal(false);
  readonly showConfirm = signal(false);

  passwordActual  = '';
  passwordNueva   = '';
  passwordConfirm = '';

  email() { return this.auth.userEmail(); }

  puedeGuardar() {
    return this.passwordActual.length > 0
      && this.passwordNueva.length >= 8
      && this.passwordNueva === this.passwordConfirm;
  }

  cambiarPassword() {
    if (!this.puedeGuardar()) return;
    this.saving.set(true);
    this.authSvc.cambiarPassword(this.passwordActual, this.passwordNueva).subscribe({
      next: () => {
        this.saving.set(false);
        this.passwordActual = '';
        this.passwordNueva  = '';
        this.passwordConfirm = '';
        this.snack.open('Contraseña actualizada correctamente', 'Cerrar', { duration: 4000 });
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message ?? 'Error al cambiar la contraseña';
        this.snack.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }
}
