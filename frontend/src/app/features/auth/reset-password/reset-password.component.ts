import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { mensajeError } from '../../../core/utils/http';
import { CampoErrorComponent } from '../../../shared/components/campo-error.component';
import { coinciden, nivelPassword, passwordFuerte } from '../../../shared/validators/validadores';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, CampoErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="simple-page">
      <div class="simple-card card">
        <div class="status-icon neutro"><mat-icon>password</mat-icon></div>
        <h2 class="center mb-8">Crea una nueva contraseña</h2>
        <p class="muted center mb-24">Al cambiarla se cerrarán las sesiones abiertas en otros dispositivos.</p>
        <form class="stack" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
          <div class="form-group">
            <label class="form-label" for="pass">Nueva contraseña</label>
            <input id="pass" class="form-input" type="password" formControlName="password" autocomplete="new-password" />
            <div [class]="'password-meter n' + nivel()" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
            <app-campo-error [control]="form.controls.password" />
          </div>
          <div class="form-group">
            <label class="form-label" for="confirmar">Confirmar contraseña</label>
            <input id="confirmar" class="form-input" type="password" formControlName="confirmar" autocomplete="new-password" />
            @if (form.hasError('noCoinciden') && form.controls.confirmar.touched) {
              <span class="form-error"><mat-icon>error_outline</mat-icon>Las contraseñas no coinciden</span>
            }
          </div>
          @if (error()) {
            <div class="alert danger" role="alert"><mat-icon>warning</mat-icon>
              <span>{{ error() }} <a routerLink="/recuperar-password">Solicitar un nuevo enlace</a></span>
            </div>
          }
          <button type="submit" class="btn btn-primary btn-block" [disabled]="cargando()">
            @if (cargando()) { <mat-icon class="spin">sync</mat-icon> } Guardar contraseña
          </button>
        </form>
        <div class="center"><a routerLink="/login" class="back-link"><mat-icon>chevron_left</mat-icon> Volver al inicio de sesión</a></div>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent {
  readonly token = input.required<string>();
  private readonly api = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    password: ['', [Validators.required, passwordFuerte]],
    confirmar: ['', Validators.required],
  }, { validators: coinciden('password', 'confirmar') });
  private readonly pass = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  protected readonly nivel = computed(() => nivelPassword(this.pass()));
  protected readonly cargando = signal(false);
  protected readonly error = signal('');

  guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.cargando.set(true);
    this.error.set('');
    this.api.resetPassword(this.token(), this.form.controls.password.value).subscribe({
      next: (r) => { this.toast.exito(r.message); this.router.navigate(['/login']); },
      error: (e) => { this.cargando.set(false); this.error.set(mensajeError(e)); },
    });
  }
}
