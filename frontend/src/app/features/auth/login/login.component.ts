import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { AuthStore } from '../../../core/auth/auth.store';

type Role = 'beneficiario' | 'empresa' | 'admin';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-layout">
      <!-- Left panel -->
      <div class="auth-left">
        <div class="auth-left-inner">
          <div class="auth-brand">
            <div class="brand-icon"><mat-icon>layers</mat-icon></div>
            <h1>BrickByBrick</h1>
          </div>
          <p class="auth-tagline">Materiales que sobran, hogares que crecen. Economía circular con propósito social.</p>
          <div class="auth-stats">
            @for (stat of stats; track stat.text) {
              <div class="stat-item">
                <mat-icon>{{ stat.icon }}</mat-icon>
                <span>{{ stat.text }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <div class="auth-right">
        <div class="auth-form-container">
          <h2>Bienvenido de nuevo</h2>
          <p class="auth-subtitle">Ingresa a tu cuenta para continuar</p>

          <!-- Role tabs -->
          <div class="role-tabs">
            @for (r of roles; track r.id) {
              <button class="role-tab" [class.active]="role() === r.id"
                      [style.background]="role() === r.id ? r.color : 'transparent'"
                      [style.color]="role() === r.id ? '#fff' : 'var(--text-secondary)'"
                      (click)="role.set(r.id)">
                {{ r.label }}
              </button>
            }
          </div>

          <!-- Form -->
          <form class="auth-form" (ngSubmit)="submit()" #loginForm="ngForm">
            <div class="form-group">
              <label class="form-label">Correo electrónico</label>
              <input class="form-input" type="email" name="email" placeholder="correo@ejemplo.com"
                     [(ngModel)]="email" required [class.error]="!!errorMsg()" />
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <div class="pass-wrapper">
                <input class="form-input" [type]="showPass() ? 'text' : 'password'" name="pass"
                       placeholder="Tu contraseña" [(ngModel)]="password" required
                       [class.error]="!!errorMsg()" />
                <button type="button" class="pass-toggle" (click)="showPass.update(v => !v)">
                  <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            @if (errorMsg()) {
              <div class="form-error-banner">
                <mat-icon>warning</mat-icon>
                {{ errorMsg() }}
              </div>
            }

            <div class="forgot-link">
              <a routerLink="/restablecer-password/solicitar">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-block"
                    [style.background]="activeColor()" [disabled]="loading()">
              @if (loading()) {
                <mat-icon class="spin">sync</mat-icon>
              }
              Ingresar como {{ activeLabel() }}
            </button>
          </form>

          <div class="divider"><span>o</span></div>

          <p class="auth-switch">
            ¿No tienes cuenta? <a routerLink="/registro">Regístrate aquí</a>
          </p>

          <a routerLink="/" class="back-link">
            <mat-icon>chevron_left</mat-icon> Volver al inicio
          </a>
        </div>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  email = '';
  password = '';

  protected readonly role = signal<Role>('beneficiario');
  protected readonly showPass = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMsg = signal('');

  protected readonly stats = [
    { icon: 'check_circle', text: '3.400 familias beneficiadas' },
    { icon: 'business', text: '87 constructoras activas' },
    { icon: 'volunteer_activism', text: '1.240 materiales donados' },
  ];

  protected readonly roles: { id: Role; label: string; color: string }[] = [
    { id: 'beneficiario', label: 'Beneficiario', color: 'var(--primary)' },
    { id: 'empresa',      label: 'Constructora', color: 'var(--secondary)' },
    { id: 'admin',        label: 'Administrador', color: 'var(--bg-dark)' },
  ];

  activeColor(): string {
    return this.roles.find(r => r.id === this.role())?.color ?? 'var(--primary)';
  }

  activeLabel(): string {
    return this.roles.find(r => r.id === this.role())?.label ?? 'Beneficiario';
  }

  private readonly roleMap: Record<Role, string> = {
    beneficiario: 'BENEFICIARIO',
    empresa:      'CONSTRUCTORA',
    admin:        'ADMINISTRADOR',
  };

  submit(): void {
    if (!this.email || !this.password) {
      this.errorMsg.set('Por favor completa todos los campos.');
      return;
    }
    this.loading.set(true);
    this.errorMsg.set('');

    this.authApi.login(this.email, this.password).subscribe({
      next: res => {
        const rolReal = res.data.user.rol;
        const rolEsperado = this.roleMap[this.role()];

        if (rolReal !== rolEsperado) {
          this.loading.set(false);
          this.errorMsg.set(`Esta cuenta no es de tipo "${this.activeLabel()}". Selecciona el perfil correcto.`);
          return;
        }

        this.authStore.setAuth(res.data);
        this.router.navigate([this.authStore.dashboardRoute()]);
      },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Correo o contraseña incorrectos.');
      },
    });
  }
}
