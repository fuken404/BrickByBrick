import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/auth/auth.store';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { UserApiService } from '../../../core/services/user-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Me, PreferenciasNotif } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { coinciden, passwordFuerte, telefonoColombia } from '../../../shared/validators/validadores';
import { CampoErrorComponent } from '../../../shared/components/campo-error.component';

/** Contacto, notificaciones, contraseña, MFA y eliminación de cuenta (común a los tres roles). */
@Component({
  selector: 'app-seguridad-cuenta',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, MatIconModule, CampoErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seguridad-cuenta.component.html',
})
export class SeguridadCuentaComponent {
  readonly me = input.required<Me>();
  readonly cambiado = output<Me>();

  private readonly auth = inject(AuthStore);
  private readonly authApi = inject(AuthApiService);
  private readonly users = inject(UserApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly guardando = signal<string | null>(null);
  protected readonly mfaAbierto = signal(false);
  protected readonly eliminarAbierto = signal(false);

  protected readonly telefono = this.fb.control('', [Validators.required, telefonoColombia]);
  protected readonly password = this.fb.group({
    passwordActual: ['', Validators.required],
    passwordNueva: ['', [Validators.required, passwordFuerte]],
    confirmacion: ['', Validators.required],
  }, { validators: coinciden('passwordNueva', 'confirmacion') });
  protected readonly mfaPassword = this.fb.control('', Validators.required);
  protected readonly eliminar = this.fb.group({
    password: ['', Validators.required],
    confirmacion: ['', [Validators.required, Validators.pattern(/^ELIMINAR$/)]],
  });

  editarTelefono(): void {
    this.telefono.setValue(this.me().telefono ?? '');
    this.guardando.set('editando-telefono');
  }

  guardarTelefono(): void {
    this.telefono.markAsTouched();
    if (this.telefono.invalid) return;
    this.guardando.set('telefono');
    this.users.actualizarMe({ telefono: this.telefono.value }).subscribe({
      next: (r) => { this.guardando.set(null); this.cambiado.emit(r.data); this.toast.exito('Teléfono actualizado'); },
      error: (e) => { this.guardando.set('editando-telefono'); this.toast.error(mensajeError(e)); },
    });
  }

  preferencia(clave: keyof PreferenciasNotif, e: Event): void {
    const valor = (e.target as HTMLInputElement).checked;
    const preferenciasNotif = { ...this.me().preferenciasNotif, [clave]: valor };
    this.users.actualizarMe({ preferenciasNotif }).subscribe({
      next: (r) => { this.cambiado.emit(r.data); this.toast.exito('Preferencias guardadas'); },
      error: (err) => this.toast.error(mensajeError(err)),
    });
  }

  reenviarVerificacion(): void {
    this.guardando.set('verificacion');
    this.authApi.reenviarVerificacion().subscribe({
      next: (r) => { this.guardando.set(null); this.toast.exito(r.message); },
      error: (e) => { this.guardando.set(null); this.toast.error(mensajeError(e)); },
    });
  }

  cambiarPassword(): void {
    this.password.markAllAsTouched();
    if (this.password.invalid) return;
    const v = this.password.getRawValue();
    this.guardando.set('password');
    this.authApi.cambiarPassword(v.passwordActual, v.passwordNueva).subscribe({
      next: (r) => {
        this.auth.setSesion(r.data);
        this.password.reset();
        this.guardando.set(null);
        this.toast.exito('Contraseña actualizada. Cerramos las demás sesiones abiertas.');
      },
      error: (e) => { this.guardando.set(null); this.toast.error(mensajeError(e)); },
    });
  }

  cambiarMfa(): void {
    this.mfaPassword.markAsTouched();
    if (this.mfaPassword.invalid) return;
    const habilitar = !this.me().mfaHabilitado;
    this.guardando.set('mfa');
    this.authApi.configurarMfa(habilitar, this.mfaPassword.value).subscribe({
      next: (r) => {
        this.guardando.set(null);
        this.mfaAbierto.set(false);
        this.mfaPassword.reset();
        this.auth.actualizarUsuario({ mfaHabilitado: r.data.mfaHabilitado });
        this.cambiado.emit({ ...this.me(), mfaHabilitado: r.data.mfaHabilitado });
        this.toast.exito(habilitar ? 'Verificación en dos pasos activada' : 'Verificación en dos pasos desactivada');
      },
      error: (e) => { this.guardando.set(null); this.toast.error(mensajeError(e)); },
    });
  }

  eliminarCuenta(): void {
    this.eliminar.markAllAsTouched();
    if (this.eliminar.invalid) return;
    this.guardando.set('eliminar');
    this.users.eliminarCuenta(this.eliminar.controls.password.value).subscribe({
      next: () => {
        this.auth.limpiar();
        this.toast.exito('Tu cuenta fue eliminada. Gracias por ser parte de BrickByBrick.');
        this.router.navigateByUrl('/');
      },
      error: (e) => { this.guardando.set(null); this.toast.error(mensajeError(e)); },
    });
  }
}
