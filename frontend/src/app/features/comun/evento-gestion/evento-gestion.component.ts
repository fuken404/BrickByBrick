import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/auth/auth.store';
import { EventApiService } from '../../../core/services/event-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { EstadoEvento, Evento, Inscripcion } from '../../../core/models';
import { descargarArchivo, mensajeError, nombreArchivo } from '../../../core/utils/http';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';

/** Gestión de un evento (constructora dueña o administrador): estado, inscritos y asistencia. */
@Component({
  selector: 'app-evento-gestion',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatIconModule, EmptyStateComponent, FileUploadComponent, KpiCardComponent, EstadoBadgePipe, EtiquetaPipe, UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evento-gestion.component.html',
})
export class EventoGestionComponent {
  readonly id = input.required<string>();
  protected readonly auth = inject(AuthStore);
  private readonly api = inject(EventApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);
  private readonly router = inject(Router);

  protected readonly evento = signal<Evento | null>(null);
  protected readonly inscritos = signal<Inscripcion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly asistencia = signal<Record<string, boolean>>({});
  protected readonly guardandoAsistencia = signal(false);

  protected readonly asistieron = computed(() => this.inscritos().filter((i) => i.estado === 'asistio').length);
  protected readonly ipe = computed(() => {
    const e = this.evento();
    return e?.capacidadMaxima ? Math.round((e.inscritos / e.capacidadMaxima) * 1000) / 10 : null;
  });
  protected readonly puedeAsistencia = computed(() => {
    const e = this.evento();
    return !!e && ['publicado', 'en_curso', 'finalizado'].includes(e.estado) && new Date(e.fechaInicio).getTime() - Date.now() <= 24 * 3600 * 1000;
  });
  protected readonly cambiosAsistencia = computed(() => Object.keys(this.asistencia()).length > 0);

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.cargar(id));
    });
  }

  private cargar(id: string): void {
    this.cargando.set(true);
    this.api.obtener(id).subscribe({
      next: (r) => { this.evento.set(r.data); this.cargando.set(false); this.cargarInscritos(); },
      error: () => { this.evento.set(null); this.cargando.set(false); },
    });
  }

  cargarInscritos(): void {
    this.api.inscritos(this.id()).subscribe({ next: (r) => { this.inscritos.set(r.data); this.asistencia.set({}); } });
  }

  marcar(i: Inscripcion, e: Event): void {
    const valor = (e.target as HTMLInputElement).checked;
    this.asistencia.update((a) => ({ ...a, [i.id]: valor }));
  }

  asistio(i: Inscripcion): boolean {
    return this.asistencia()[i.id] ?? i.estado === 'asistio';
  }

  guardarAsistencia(): void {
    const cambios = Object.entries(this.asistencia()).map(([id, asistio]) => ({ id, asistio }));
    if (!cambios.length) return;
    this.guardandoAsistencia.set(true);
    this.api.registrarAsistencia(this.id(), cambios).subscribe({
      next: (r) => { this.inscritos.set(r.data); this.asistencia.set({}); this.guardandoAsistencia.set(false); this.toast.exito('Asistencia registrada'); },
      error: (e) => { this.guardandoAsistencia.set(false); this.toast.error(mensajeError(e)); },
    });
  }

  cambiarEstado(estado: Exclude<EstadoEvento, 'borrador'>): void {
    const e = this.evento();
    if (!e) return;
    if (estado === 'cancelado') {
      this.dialogo.pedirTexto({
        titulo: 'Cancelar evento', mensaje: `Se notificará a los ${e.inscritos} inscritos por la app y por correo.`,
        confirmar: 'Cancelar evento', peligroso: true, campo: { etiqueta: 'Motivo de la cancelación', minimo: 5 },
      }).subscribe((motivo) => this.aplicarEstado(estado, motivo));
      return;
    }
    const textos: Record<string, string> = {
      publicado: 'El evento será visible y se avisará a los beneficiarios de la localidad.',
      en_curso: 'Marcarás el evento como en curso.',
      finalizado: 'Los inscritos sin asistencia registrada quedarán como “no asistió” si ya tomaste asistencia.',
    };
    this.dialogo.confirmar({ titulo: 'Cambiar estado', mensaje: textos[estado], confirmar: 'Confirmar' })
      .subscribe(() => this.aplicarEstado(estado));
  }

  private aplicarEstado(estado: Exclude<EstadoEvento, 'borrador'>, motivo?: string): void {
    this.api.cambiarEstado(this.id(), estado, motivo).subscribe({
      next: (r) => { this.evento.set(r.data); this.toast.exito(r.message); this.cargarInscritos(); },
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }

  eliminar(): void {
    this.dialogo.confirmar({ titulo: 'Eliminar borrador', mensaje: 'Esta acción no se puede deshacer.', confirmar: 'Eliminar', peligroso: true })
      .subscribe(() => this.api.eliminar(this.id()).subscribe({
        next: () => { this.toast.exito('Borrador eliminado'); this.router.navigate([this.auth.prefijo(), 'eventos']); },
        error: (e) => this.toast.error(mensajeError(e)),
      }));
  }

  subirImagen(files: File[]): void {
    if (!files[0]) return;
    this.api.subirImagen(this.id(), files[0]).subscribe({
      next: (r) => { this.evento.set(r.data); this.toast.exito('Imagen actualizada'); },
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }

  exportar(): void {
    this.api.exportarInscritos(this.id()).subscribe({
      next: (r) => descargarArchivo(r.body!, nombreArchivo(r.headers.get('Content-Disposition'), 'inscritos.csv')),
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }
}
