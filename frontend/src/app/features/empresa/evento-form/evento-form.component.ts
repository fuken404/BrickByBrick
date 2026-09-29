import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Observable, map, of, switchMap } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { DatosEvento, EventApiService } from '../../../core/services/event-api.service';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { CatalogStore } from '../../../core/stores/catalog.store';
import { ToastService } from '../../../core/services/toast.service';
import { Evento, Material, TipoEvento } from '../../../core/models';
import { erroresPorCampo, mensajeError } from '../../../core/utils/http';
import { ahoraDatetimeLocal, datetimeLocalAIso, isoADatetimeLocal } from '../../../core/utils/fechas';
import { CampoErrorComponent } from '../../../shared/components/campo-error.component';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { ETIQUETAS_TIPO_EVENTO } from '../../../shared/pipes/etiqueta.pipe';

const fechasValidas = (g: AbstractControl): ValidationErrors | null => {
  const inicio = g.get('fechaInicio')?.value as string;
  const fin = g.get('fechaFin')?.value as string;
  return inicio && fin && new Date(fin) <= new Date(inicio) ? { fechas: true } : null;
};

@Component({
  selector: 'app-evento-form',
  standalone: true,
  imports: [RouterLink, DecimalPipe, ReactiveFormsModule, MatIconModule, CampoErrorComponent, FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evento-form.component.html',
})
export class EventoFormComponent implements OnInit {
  readonly id = input<string>();
  protected readonly auth = inject(AuthStore);
  private readonly api = inject(EventApiService);
  private readonly materialesApi = inject(MaterialApiService);
  protected readonly catalogo = inject(CatalogStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly tipos = Object.entries(ETIQUETAS_TIPO_EVENTO);
  protected readonly minimo = ahoraDatetimeLocal();
  protected readonly evento = signal<Evento | null>(null);
  protected readonly materiales = signal<Material[]>([]);
  protected readonly seleccionados = signal<Set<string>>(new Set());
  protected readonly imagen = signal<File | null>(null);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly esEdicion = computed(() => !!this.id());
  protected readonly verificada = computed(() => !!this.auth.user()?.perfil?.verificada);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    tipoEvento: ['entrega_masiva' as TipoEvento, Validators.required],
    descripcion: ['', Validators.maxLength(3000)],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    direccion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
    localidadId: [null as number | null, Validators.required],
    capacidadMaxima: [null as number | null, Validators.min(1)],
  }, { validators: fechasValidas });

  ngOnInit(): void {
    this.catalogo.cargarLocalidades().subscribe({ error: () => undefined });
    this.materialesApi.misMateriales({ limit: 100 }).subscribe({
      next: (r) => this.materiales.set(r.data.items.filter((m) => ['activo', 'borrador', 'pausado'].includes(m.estadoPublicacion))),
    });
    const id = this.id();
    if (!id) return;
    this.cargando.set(true);
    this.api.obtener(id).subscribe({
      next: (r) => {
        const e = r.data;
        this.evento.set(e);
        this.form.reset({
          nombre: e.nombre, tipoEvento: e.tipoEvento, descripcion: e.descripcion ?? '',
          fechaInicio: isoADatetimeLocal(e.fechaInicio), fechaFin: isoADatetimeLocal(e.fechaFin),
          direccion: e.direccion ?? '', localidadId: e.localidadId, capacidadMaxima: e.capacidadMaxima,
        });
        this.seleccionados.set(new Set((e.materiales ?? []).map((m) => m.material.id)));
        this.cargando.set(false);
      },
      error: (err) => { this.toast.error(mensajeError(err)); this.router.navigate(['/empresa/eventos']); },
    });
  }

  alternar(id: string): void {
    this.seleccionados.update((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  private datos(): DatosEvento {
    const v = this.form.getRawValue();
    return {
      nombre: v.nombre.trim(), tipoEvento: v.tipoEvento, descripcion: v.descripcion.trim() || null,
      fechaInicio: datetimeLocalAIso(v.fechaInicio), fechaFin: datetimeLocalAIso(v.fechaFin),
      direccion: v.direccion.trim(), localidadId: Number(v.localidadId),
      capacidadMaxima: v.capacidadMaxima ? Number(v.capacidadMaxima) : null,
      materialIds: [...this.seleccionados()],
    };
  }

  guardar(publicar: boolean): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.errores.set({});
    const id = this.id();
    const peticion$: Observable<Evento> = id
      ? this.api.actualizar(id, this.datos()).pipe(map((r) => r.data))
      : this.api.crear({ ...this.datos(), estado: publicar ? 'publicado' : 'borrador' }).pipe(map((r) => r.data));
    peticion$.pipe(
      switchMap((e) => (this.imagen() ? this.api.subirImagen(e.id, this.imagen()!).pipe(map((r) => r.data)) : of(e))),
    ).subscribe({
      next: (e) => {
        this.guardando.set(false);
        this.toast.exito(id ? 'Evento actualizado. Avisamos a los inscritos.' : publicar ? 'Evento publicado' : 'Borrador guardado');
        this.router.navigate(['/empresa/eventos', e.id]);
      },
      error: (err) => { this.guardando.set(false); this.errores.set(erroresPorCampo(err)); this.toast.error(mensajeError(err)); },
    });
  }
}
