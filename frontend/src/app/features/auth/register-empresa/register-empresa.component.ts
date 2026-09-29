import { AuthHeaderComponent } from '../auth-header/auth-header.component';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';

import { AuthApiService } from '../../../core/services/auth-api.service';
import { CatalogStore } from '../../../core/stores/catalog.store';
import { ToastService } from '../../../core/services/toast.service';
import { erroresPorCampo, mensajeError } from '../../../core/utils/http';
import { CampoErrorComponent } from '../../../shared/components/campo-error.component';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { coinciden, nitValido, nivelPassword, passwordFuerte, telefonoColombia } from '../../../shared/validators/validadores';

const PASOS = ['Empresa', 'Cuenta y contacto', 'Documentos'];
const DOCS = 'application/pdf,image/jpeg,image/png,image/webp';

@Component({
  selector: 'app-register-empresa',
  standalone: true,
  imports: [AuthHeaderComponent, ReactiveFormsModule, RouterLink, MatIconModule, CampoErrorComponent, FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register-empresa.component.html',
})
export class RegisterEmpresaComponent {
  private readonly api = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly catalogo = inject(CatalogStore);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly pasos = PASOS;
  protected readonly tiposDoc = DOCS;
  protected readonly paso = signal(0);
  protected readonly enviando = signal(false);
  protected readonly error = signal('');
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly mostrarPass = signal(false);
  protected readonly rut = signal<File | null>(null);
  protected readonly camara = signal<File | null>(null);
  protected readonly intentoDocs = signal(false);

  protected readonly empresa = this.fb.group({
    razonSocial: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    nit: ['', [Validators.required, nitValido]],
    numEmpleados: [''],
    representanteLegal: ['', [Validators.required, Validators.minLength(3)]],
    cargoRepresentante: ['', [Validators.required, Validators.minLength(2)]],
    direccion: ['', [Validators.required, Validators.minLength(5)]],
    localidadId: ['', Validators.required],
    descripcion: ['', Validators.maxLength(2000)],
  });

  protected readonly cuenta = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, telefonoColombia]],
    sitioWeb: ['', Validators.pattern(/^https?:\/\/.+\..+/)],
    password: ['', [Validators.required, passwordFuerte]],
    confirmar: ['', Validators.required],
  }, { validators: coinciden('password', 'confirmar') });

  protected readonly acepta = this.fb.control(false, Validators.requiredTrue);
  private readonly passwordValor = toSignal(this.cuenta.controls.password.valueChanges, { initialValue: '' });
  protected readonly nivel = computed(() => nivelPassword(this.passwordValor()));

  siguiente(): void {
    const grupo = this.paso() === 0 ? this.empresa : this.cuenta;
    grupo.markAllAsTouched();
    if (grupo.invalid) return;
    this.paso.update((p) => p + 1);
  }

  anterior(): void {
    if (this.paso() === 0) this.router.navigate(['/registro']);
    else this.paso.update((p) => p - 1);
  }

  registrar(): void {
    this.intentoDocs.set(true);
    this.acepta.markAsTouched();
    if (!this.rut() || !this.camara() || this.acepta.invalid || this.empresa.invalid || this.cuenta.invalid) return;

    const e = this.empresa.getRawValue();
    const c = this.cuenta.getRawValue();
    const form = new FormData();
    const campos: Record<string, string> = {
      email: c.email.trim().toLowerCase(), password: c.password, telefono: c.telefono, sitioWeb: c.sitioWeb.trim(),
      razonSocial: e.razonSocial.trim(), nit: e.nit.trim(), numEmpleados: e.numEmpleados,
      representanteLegal: e.representanteLegal.trim(), cargoRepresentante: e.cargoRepresentante.trim(),
      direccion: e.direccion.trim(), localidadId: e.localidadId, descripcion: e.descripcion.trim(), aceptaTerminos: 'true',
    };
    for (const [k, v] of Object.entries(campos)) if (v) form.append(k, v);
    form.append('rut', this.rut()!);
    form.append('camaraComercio', this.camara()!);

    this.enviando.set(true);
    this.error.set('');
    this.api.registerConstructora(form).subscribe({
      next: (r) => {
        this.toast.exito(r.message);
        this.router.navigate(['/login'], { queryParams: { registrado: '1' } });
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(mensajeError(err));
        const errores = erroresPorCampo(err);
        this.erroresServidor.set(errores);
        if (errores['email'] || errores['password'] || errores['telefono'] || errores['sitioWeb'] || /correo/i.test(this.error())) this.paso.set(1);
        else if (Object.keys(errores).length || /NIT/i.test(this.error())) this.paso.set(0);
      },
    });
  }
}
