import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';

import { AuthApiService } from '../../../core/services/auth-api.service';
import { CatalogStore } from '../../../core/stores/catalog.store';
import { ToastService } from '../../../core/services/toast.service';
import { erroresPorCampo, mensajeError } from '../../../core/utils/http';
import { hoyIso } from '../../../core/utils/fechas';
import { CampoErrorComponent } from '../../../shared/components/campo-error.component';
import { coinciden, mayorDeEdad, nivelPassword, passwordFuerte, telefonoColombia } from '../../../shared/validators/validadores';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';

const PASOS = ['Datos personales', 'Cuenta y contacto', 'Confirmación'];

@Component({
  selector: 'app-register-beneficiario',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, CampoErrorComponent, EtiquetaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register-beneficiario.component.html',
})
export class RegisterBeneficiarioComponent {
  private readonly api = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly catalogo = inject(CatalogStore);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly pasos = PASOS;
  protected readonly paso = signal(0);
  protected readonly enviando = signal(false);
  protected readonly error = signal('');
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly mostrarPass = signal(false);
  protected readonly hoy = hoyIso();

  protected readonly datos = this.fb.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    cedula: ['', [Validators.required, Validators.pattern(/^\d{6,10}$/)]],
    fechaNacimiento: ['', [Validators.required, mayorDeEdad]],
    genero: [''],
    estrato: [''],
    localidadId: ['', Validators.required],
  });

  protected readonly cuenta = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, telefonoColombia]],
    password: ['', [Validators.required, passwordFuerte]],
    confirmar: ['', Validators.required],
  }, { validators: coinciden('password', 'confirmar') });

  protected readonly acepta = this.fb.control(false, Validators.requiredTrue);

  private readonly passwordValor = toSignal(this.cuenta.controls.password.valueChanges, { initialValue: '' });
  protected readonly nivel = computed(() => nivelPassword(this.passwordValor()));
  protected readonly localidadNombre = computed(() => {
    const id = Number(this.datos.controls.localidadId.value);
    return this.catalogo.localidades().find((l) => l.id === id)?.nombre ?? '';
  });

  siguiente(): void {
    const grupo = this.paso() === 0 ? this.datos : this.cuenta;
    grupo.markAllAsTouched();
    if (grupo.invalid) return;
    this.paso.update((p) => p + 1);
  }

  anterior(): void {
    if (this.paso() === 0) this.router.navigate(['/registro']);
    else this.paso.update((p) => p - 1);
  }

  crear(): void {
    this.acepta.markAsTouched();
    if (this.acepta.invalid || this.datos.invalid || this.cuenta.invalid) return;
    const d = this.datos.getRawValue();
    const c = this.cuenta.getRawValue();
    this.enviando.set(true);
    this.error.set('');
    this.api.registerBeneficiario({
      email: c.email.trim().toLowerCase(),
      password: c.password,
      telefono: c.telefono,
      nombreCompleto: d.nombreCompleto.trim(),
      cedula: d.cedula,
      fechaNacimiento: d.fechaNacimiento,
      genero: d.genero || undefined,
      estrato: d.estrato ? Number(d.estrato) : undefined,
      localidadId: Number(d.localidadId),
      aceptaTerminos: true,
    }).subscribe({
      next: (r) => {
        this.toast.exito(r.message);
        this.router.navigate(['/login'], { queryParams: { registrado: '1' } });
      },
      error: (e) => {
        this.enviando.set(false);
        this.error.set(mensajeError(e));
        const campos = erroresPorCampo(e);
        this.erroresServidor.set(campos);
        if (campos['email'] || campos['password'] || campos['telefono'] || /correo/i.test(this.error())) this.paso.set(1);
        else if (Object.keys(campos).length || /cédula/i.test(this.error())) this.paso.set(0);
      },
    });
  }
}
