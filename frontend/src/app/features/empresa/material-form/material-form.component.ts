import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of, switchMap, map } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { DatosMaterial, MaterialApiService } from '../../../core/services/material-api.service';
import { CatalogStore } from '../../../core/stores/catalog.store';
import { ToastService } from '../../../core/services/toast.service';
import { EstadoMaterial, FotoMaterial, Material } from '../../../core/models';
import { erroresPorCampo, mensajeError } from '../../../core/utils/http';
import { fechaSoloDia, hoyIso } from '../../../core/utils/fechas';
import { CampoErrorComponent } from '../../../shared/components/campo-error.component';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';

const UNIDADES = ['unidades', 'm²', 'm³', 'm', 'kg', 'toneladas', 'sacos', 'galones', 'litros', 'rollos', 'láminas', 'bultos'];
const MAX_FOTOS = 5;

@Component({
  selector: 'app-material-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, MatIconModule, CampoErrorComponent, FileUploadComponent, UploadUrlPipe, CopCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './material-form.component.html',
  styles: [`
    .fotos { display: flex; gap: 10px; flex-wrap: wrap; }
    .foto { position: relative; width: 96px; height: 96px; border-radius: 10px; overflow: hidden; }
    .foto img { width: 100%; height: 100%; object-fit: cover; }
    .foto button { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,.6); color: #fff; border: none; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .foto button mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
})
export class MaterialFormComponent implements OnInit {
  /** Presente en /materiales/:id/editar. */
  readonly id = input<string>();
  protected readonly auth = inject(AuthStore);
  private readonly api = inject(MaterialApiService);
  protected readonly catalogo = inject(CatalogStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly upload = viewChild(FileUploadComponent);

  protected readonly unidades = UNIDADES;
  protected readonly hoy = hoyIso();
  protected readonly material = signal<Material | null>(null);
  protected readonly fotosExistentes = signal<FotoMaterial[]>([]);
  protected readonly nuevasFotos = signal<File[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly verificada = computed(() => !!this.auth.user()?.perfil?.verificada);
  protected readonly cupoFotos = computed(() => MAX_FOTOS - this.fotosExistentes().length);
  protected readonly esEdicion = computed(() => !!this.id());

  protected readonly form = inject(FormBuilder).nonNullable.group({
    categoriaId: [null as number | null, Validators.required],
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    descripcion: ['', Validators.maxLength(2000)],
    estadoMaterial: ['buen_estado' as EstadoMaterial, Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
    unidadMedida: ['unidades', [Validators.required, Validators.maxLength(30)]],
    valorUnitarioCop: [null as number | null, Validators.min(0)],
    condicionesRetiro: ['', Validators.maxLength(1000)],
    fechaLimite: [''],
    maxSolicitudes: [null as number | null, Validators.min(1)],
  });

  ngOnInit(): void {
    this.catalogo.cargarCategorias().subscribe({ error: () => undefined });
    const id = this.id();
    if (!id) return;
    this.cargando.set(true);
    this.api.obtener(id).subscribe({
      next: (r) => {
        const m = r.data;
        this.material.set(m);
        this.fotosExistentes.set(m.fotos);
        this.form.reset({
          categoriaId: m.categoriaId, nombre: m.nombre, descripcion: m.descripcion ?? '', estadoMaterial: m.estadoMaterial,
          cantidad: m.cantidad, unidadMedida: m.unidadMedida, valorUnitarioCop: m.valorUnitarioCop,
          condicionesRetiro: m.condicionesRetiro ?? '', fechaLimite: fechaSoloDia(m.fechaLimite), maxSolicitudes: m.maxSolicitudes,
        });
        this.cargando.set(false);
      },
      error: (e) => { this.toast.error(mensajeError(e)); this.router.navigate(['/empresa/materiales']); },
    });
  }

  total(): number {
    const { cantidad, valorUnitarioCop } = this.form.getRawValue();
    return cantidad && valorUnitarioCop ? Number(cantidad) * Number(valorUnitarioCop) : 0;
  }

  private datos(): DatosMaterial {
    const v = this.form.getRawValue();
    return {
      categoriaId: Number(v.categoriaId), nombre: v.nombre.trim(), descripcion: v.descripcion.trim() || null,
      estadoMaterial: v.estadoMaterial, cantidad: Number(v.cantidad), unidadMedida: v.unidadMedida.trim(),
      valorUnitarioCop: v.valorUnitarioCop === null || (v.valorUnitarioCop as unknown) === '' ? null : Number(v.valorUnitarioCop),
      condicionesRetiro: v.condicionesRetiro.trim() || null, fechaLimite: v.fechaLimite || null,
      maxSolicitudes: v.maxSolicitudes ? Number(v.maxSolicitudes) : null,
    };
  }

  guardar(publicar: boolean): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const datos = this.datos();
    if (publicar && datos.valorUnitarioCop === null) {
      this.errores.set({ valorUnitarioCop: 'Indica el valor unitario para publicar (se usa en tus constancias de donación)' });
      return;
    }
    this.guardando.set(true);
    this.errores.set({});
    const id = this.id();
    let peticion$: Observable<Material>;
    if (id) {
      peticion$ = this.api.actualizar(id, datos).pipe(
        switchMap((r) => (publicar && r.data.estadoPublicacion !== 'activo'
          ? this.api.cambiarEstado(id, 'activo').pipe(map((x) => x.data)) : of(r.data))),
      );
    } else {
      peticion$ = this.api.crear({ ...datos, estadoPublicacion: publicar ? 'activo' : 'borrador' }).pipe(map((r) => r.data));
    }
    peticion$.pipe(
      switchMap((m) => (this.nuevasFotos().length ? this.api.subirFotos(m.id, this.nuevasFotos()).pipe(map(() => m)) : of(m))),
    ).subscribe({
      next: (m) => {
        this.guardando.set(false);
        this.upload()?.reset();
        this.toast.exito(id ? 'Material actualizado' : publicar ? 'Material publicado en el catálogo' : 'Borrador guardado');
        this.router.navigate(['/empresa/materiales'], { queryParams: { nuevo: m.id } });
      },
      error: (e) => {
        this.guardando.set(false);
        this.errores.set(erroresPorCampo(e));
        this.toast.error(mensajeError(e));
      },
    });
  }

  eliminarFoto(f: FotoMaterial): void {
    const id = this.id();
    if (!id) return;
    this.api.eliminarFoto(id, f.id).subscribe({
      next: (r) => this.fotosExistentes.set(r.data),
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }
}
