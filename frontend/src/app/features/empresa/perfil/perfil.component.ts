import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/auth/auth.store';
import { UserApiService } from '../../../core/services/user-api.service';
import { CatalogStore } from '../../../core/stores/catalog.store';
import { ToastService } from '../../../core/services/toast.service';
import { Me, TipoDocumento } from '../../../core/models';
import { erroresPorCampo, mensajeError } from '../../../core/utils/http';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { CampoErrorComponent } from '../../../shared/components/campo-error.component';
import { SeguridadCuentaComponent } from '../../comun/cuenta/seguridad-cuenta.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';

type Pestana = 'empresa' | 'documentos' | 'seguridad';
const TIPOS: TipoDocumento[] = ['rut', 'camara_comercio'];

@Component({
  selector: 'app-empresa-perfil',
  standalone: true,
  imports: [RouterLink, DatePipe, ReactiveFormsModule, MatIconModule, AvatarComponent, CampoErrorComponent, SeguridadCuentaComponent, EstadoBadgePipe, EtiquetaPipe, UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfil.component.html',
})
export class EmpresaPerfilComponent implements OnInit {
  protected readonly auth = inject(AuthStore);
  private readonly users = inject(UserApiService);
  protected readonly catalogo = inject(CatalogStore);
  private readonly toast = inject(ToastService);

  protected readonly tipos = TIPOS;
  protected readonly me = signal<Me | null>(null);
  protected readonly pestana = signal<Pestana>('empresa');
  protected readonly guardando = signal(false);
  protected readonly subiendo = signal<string | null>(null);
  protected readonly errores = signal<Record<string, string>>({});

  /** Documento más reciente por tipo. */
  protected readonly documentos = computed(() => {
    const docs = this.me()?.constructora?.documentosEmpresa ?? [];
    return TIPOS.map((tipo) => ({
      tipo,
      actual: docs.filter((d) => d.tipo === tipo).sort((a, b) => b.fechaSubida.localeCompare(a.fechaSubida))[0] ?? null,
    }));
  });

  protected readonly form = inject(FormBuilder).nonNullable.group({
    razonSocial: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    representanteLegal: ['', Validators.maxLength(150)],
    cargoRepresentante: ['', Validators.maxLength(100)],
    numEmpleados: [null as number | null, Validators.min(1)],
    direccion: ['', Validators.maxLength(300)],
    localidadId: [null as number | null],
    descripcion: ['', Validators.maxLength(2000)],
    sitioWeb: ['', Validators.pattern(/^https?:\/\/.+/)],
  });

  ngOnInit(): void {
    this.catalogo.cargarLocalidades().subscribe({ error: () => undefined });
    this.users.me().subscribe({ next: (r) => this.establecer(r.data) });
  }

  private establecer(me: Me): void {
    this.me.set(me);
    const c = me.constructora;
    if (!c) return;
    this.form.reset({
      razonSocial: c.razonSocial, representanteLegal: c.representanteLegal ?? '', cargoRepresentante: c.cargoRepresentante ?? '',
      numEmpleados: c.numEmpleados ?? null, direccion: c.direccion ?? '', localidadId: c.localidad?.id ?? null,
      descripcion: c.descripcion ?? '', sitioWeb: c.sitioWeb ?? '',
    });
  }

  guardar(): void {
    this.form.markAllAsTouched();
    const c = this.me()?.constructora;
    if (this.form.invalid || !c) return;
    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.errores.set({});
    this.users.actualizarConstructora(c.id, {
      razonSocial: v.razonSocial.trim(), representanteLegal: v.representanteLegal.trim() || null,
      cargoRepresentante: v.cargoRepresentante.trim() || null, numEmpleados: v.numEmpleados ? Number(v.numEmpleados) : null,
      direccion: v.direccion.trim() || null, localidadId: v.localidadId ? Number(v.localidadId) : null,
      descripcion: v.descripcion.trim() || null, sitioWeb: v.sitioWeb.trim() || null,
    }).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.me.update((m) => (m ? { ...m, constructora: { ...m.constructora!, ...r.data, documentosEmpresa: m.constructora!.documentosEmpresa } } : m));
        this.auth.actualizarPerfil({ razonSocial: r.data.razonSocial });
        this.form.markAsPristine();
        this.toast.exito('Datos de la empresa actualizados');
      },
      error: (e) => { this.guardando.set(false); this.errores.set(erroresPorCampo(e)); this.toast.error(mensajeError(e)); },
    });
  }

  subirLogo(e: Event): void {
    const file = this.archivo(e, 5);
    const c = this.me()?.constructora;
    if (!file || !c) return;
    this.subiendo.set('logo');
    this.users.subirLogo(c.id, file).subscribe({
      next: (r) => {
        this.subiendo.set(null);
        this.me.update((m) => (m ? { ...m, constructora: { ...m.constructora!, logoUrl: r.data.logoUrl } } : m));
        this.auth.actualizarPerfil({ logoUrl: r.data.logoUrl });
        this.toast.exito('Logo actualizado');
      },
      error: (err) => { this.subiendo.set(null); this.toast.error(mensajeError(err)); },
    });
  }

  subirDocumento(tipo: TipoDocumento, e: Event): void {
    const file = this.archivo(e, 10);
    const c = this.me()?.constructora;
    if (!file || !c) return;
    this.subiendo.set(tipo);
    this.users.subirDocumento(c.id, file, tipo).subscribe({
      next: (r) => {
        this.subiendo.set(null);
        this.me.update((m) => (m ? { ...m, constructora: { ...m.constructora!, documentosEmpresa: [r.data, ...(m.constructora!.documentosEmpresa ?? [])] } } : m));
        this.toast.exito('Documento enviado a revisión');
      },
      error: (err) => { this.subiendo.set(null); this.toast.error(mensajeError(err)); },
    });
  }

  private archivo(e: Event, maxMb: number): File | null {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (file && file.size > maxMb * 1024 * 1024) { this.toast.error(`El archivo supera ${maxMb} MB`); return null; }
    return file;
  }

  /** Conserva el perfil (beneficiario/constructora) al actualizar los datos de la cuenta. */
  cuentaCambiada(cambios: Me): void {
    this.me.update((m) => (m ? { ...m, ...cambios, beneficiario: m.beneficiario, constructora: m.constructora } : cambios));
  }
}
