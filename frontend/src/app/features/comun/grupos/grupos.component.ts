import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/auth/auth.store';
import { GrupoApiService } from '../../../core/services/grupo-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Grupo, PrivacidadGrupo } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { CampoErrorComponent } from '../../../shared/components/campo-error.component';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [RouterLink, FormsModule, ReactiveFormsModule, MatIconModule, EmptyStateComponent, SkeletonLoaderComponent, CampoErrorComponent, UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grupos.component.html',
  styleUrl: './grupos.component.scss',
})
export class GruposComponent implements OnInit {
  protected readonly auth = inject(AuthStore);
  private readonly api = inject(GrupoApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly grupos = signal<Grupo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  protected readonly vista = signal<'explorar' | 'mios'>('explorar');
  protected readonly creando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly procesando = signal<string | null>(null);
  protected texto = '';
  private pagina = 1;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    descripcion: ['', Validators.maxLength(1000)],
    privacidad: ['publico' as PrivacidadGrupo],
    temas: [''],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    this.api.listar({ q: this.texto.trim() || undefined, mios: this.vista() === 'mios' || undefined, page: this.pagina }).subscribe({
      next: (r) => {
        this.grupos.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  cambiarVista(v: 'explorar' | 'mios'): void { this.vista.set(v); this.cargar(); }

  unirse(g: Grupo, e: Event): void {
    e.stopPropagation();
    this.procesando.set(g.id);
    this.api.unirse(g.id).subscribe({
      next: (r) => {
        this.grupos.update((l) => l.map((x) => (x.id === g.id
          ? { ...x, miMembresia: r.data, miembros: x.miembros + (r.data.estado === 'activo' ? 1 : 0) } : x)));
        this.toast.exito(r.message);
        this.procesando.set(null);
      },
      error: (err) => { this.procesando.set(null); this.toast.error(mensajeError(err)); },
    });
  }

  crear(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.api.crear({
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim() || undefined,
      privacidad: v.privacidad,
      temas: v.temas.split(',').map((t) => t.trim()).filter((t) => t.length >= 2).slice(0, 10),
    }).subscribe({
      next: (r) => {
        this.toast.exito('Grupo creado');
        this.router.navigate([this.auth.prefijo(), 'grupos', r.data.id]);
      },
      error: (err) => { this.guardando.set(false); this.toast.error(mensajeError(err)); },
    });
  }
}
