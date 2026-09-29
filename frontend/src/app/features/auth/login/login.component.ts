import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { interval, takeWhile } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthApiService } from '../../../core/services/auth-api.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { Sesion } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { AuthPanelComponent } from '../auth-panel/auth-panel.component';
import { CampoErrorComponent } from '../../../shared/components/campo-error.component';

type Rol = 'beneficiario' | 'empresa' | 'admin';

const ROLES: { id: Rol; label: string; color: string; prefijo: string }[] = [
  { id: 'beneficiario', label: 'Beneficiario', color: 'var(--primary)', prefijo: '/beneficiario' },
  { id: 'empresa', label: 'Constructora', color: 'var(--secondary)', prefijo: '/empresa' },
  { id: 'admin', label: 'Administrador', color: 'var(--bg-dark)', prefijo: '/admin' },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, AuthPanelComponent, CampoErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly api = inject(AuthApiService);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly roles = ROLES;
  protected readonly rol = signal<Rol>('beneficiario');
  protected readonly rolActual = computed(() => ROLES.find((r) => r.id === this.rol())!);
  protected readonly mostrarPass = signal(false);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly aviso = signal(
    this.route.snapshot.queryParamMap.get('sesion') === 'expirada' ? 'Tu sesión expiró. Ingresa de nuevo para continuar.'
      : this.route.snapshot.queryParamMap.get('registrado') ? '¡Cuenta creada! Te enviamos un correo para verificarla. Ya puedes ingresar.' : '');

  // Paso MFA
  protected readonly desafio = signal<{ id: string; email: string } | null>(null);
  protected readonly espera = signal(0);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly codigo = this.fb.control('', [Validators.required, Validators.pattern(/^\d{6}$/)]);

  ingresar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.cargando.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.api.login(email.trim().toLowerCase(), password).subscribe({
      next: (r) => {
        this.cargando.set(false);
        if (r.data.mfaRequerido) {
          this.desafio.set({ id: r.data.desafioId, email: r.data.emailParcial });
          this.iniciarEspera();
        } else {
          this.completar(r.data);
        }
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(mensajeError(e, 'Correo o contraseña incorrectos'));
      },
    });
  }

  verificar(): void {
    const d = this.desafio();
    this.codigo.markAsTouched();
    if (!d || this.codigo.invalid) return;
    this.cargando.set(true);
    this.error.set('');
    this.api.verificarMfa(d.id, this.codigo.value).subscribe({
      next: (r) => { this.cargando.set(false); this.completar(r.data); },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(mensajeError(e));
        this.codigo.reset();
        if (/expir|intentos/i.test(this.error())) this.desafio.set(null);
      },
    });
  }

  reenviar(): void {
    const d = this.desafio();
    if (!d || this.espera() > 0) return;
    this.api.reenviarMfa(d.id).subscribe({
      next: (r) => { this.desafio.set({ ...d, id: r.data.desafioId }); this.iniciarEspera(); this.error.set(''); },
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  volver(): void {
    this.desafio.set(null);
    this.codigo.reset();
    this.error.set('');
  }

  private iniciarEspera(): void {
    this.espera.set(60);
    interval(1000).pipe(takeWhile(() => this.espera() > 0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.espera.update((v) => v - 1));
  }

  private completar(sesion: Sesion): void {
    this.auth.setSesion(sesion);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const prefijo = this.auth.prefijo();
    const destino = returnUrl && returnUrl.startsWith(prefijo) ? returnUrl : this.auth.rutaInicio();
    this.router.navigateByUrl(destino);
  }
}
