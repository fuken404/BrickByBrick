import { ChangeDetectionStrategy, Component, ElementRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { EstadoSolicitud, ResumenSolicitudes, SolicitudMaterial } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';

const PESTANAS: { estado: EstadoSolicitud | undefined; label: string }[] = [
  { estado: undefined, label: 'Todas' },
  { estado: 'pendiente', label: 'Pendientes' },
  { estado: 'aprobada', label: 'Aprobadas' },
  { estado: 'entregada', label: 'Entregadas' },
  { estado: 'rechazada', label: 'Rechazadas' },
  { estado: 'cancelada', label: 'Canceladas' },
];

@Component({
  selector: 'app-mis-solicitudes',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, FormsModule, MatIconModule, EmptyStateComponent, SkeletonLoaderComponent, EstadoBadgePipe, UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mis-solicitudes.component.html',
  styles: [`
    .sol { display: grid; grid-template-columns: 72px 1fr; gap: 16px; padding: 18px; }
    .sol.resaltada { outline: 2px solid var(--secondary); }
    .thumb { width: 72px; height: 72px; border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }
    .estrellas { display: flex; gap: 2px; }
    .estrellas button { background: none; border: none; padding: 2px; cursor: pointer; color: #d6ccc2; }
    .estrellas button.on, .estrellas mat-icon.on { color: #F1C40F; }
    .timeline { display: flex; gap: 6px; flex-wrap: wrap; font-size: 12px; color: var(--text-secondary); }
    .timeline span::after { content: '›'; margin-left: 6px; }
    .timeline span:last-child::after { content: ''; }
    @media (max-width: 600px) { .sol { grid-template-columns: 1fr; } }
  `],
})
export class MisSolicitudesComponent implements OnInit {
  private readonly api = inject(MaterialApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly pestanas = PESTANAS;
  protected readonly estado = signal<EstadoSolicitud | undefined>(undefined);
  protected readonly items = signal<SolicitudMaterial[]>([]);
  protected readonly resumen = signal<ResumenSolicitudes | null>(null);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  protected readonly procesando = signal<string | null>(null);
  protected readonly resaltada = signal<string | null>(null);
  protected readonly calificando = signal<string | null>(null);
  protected readonly estrellas = signal(0);
  protected comentario = '';
  private pagina = 1;

  ngOnInit(): void {
    this.resaltada.set(this.route.snapshot.queryParamMap.get('id'));
    this.cargar();
  }

  cambiar(estado: EstadoSolicitud | undefined): void { this.estado.set(estado); this.cargar(); }

  conteo(estado: EstadoSolicitud | undefined): number | null {
    const r = this.resumen();
    if (!r) return null;
    return estado ? r[estado] : Object.values(r).reduce((a, b) => a + b, 0);
  }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    this.api.misSolicitudes({ estado: this.estado(), page: this.pagina, limit: 10 }).subscribe({
      next: (r) => {
        this.items.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.resumen.set(r.data.resumen);
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
        const id = this.resaltada();
        if (id && !mas) setTimeout(() => this.host.nativeElement.querySelector(`#sol-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      },
      error: () => this.cargando.set(false),
    });
  }

  private reemplazar(s: SolicitudMaterial): void {
    this.items.update((l) => l.map((x) => (x.id === s.id ? { ...x, ...s, material: s.material ?? x.material } : x)));
  }

  cancelar(s: SolicitudMaterial): void {
    this.dialogo.pedirTexto({
      titulo: 'Cancelar solicitud', mensaje: `¿Seguro que ya no necesitas "${s.material?.nombre}"?`, confirmar: 'Cancelar solicitud', peligroso: true,
      campo: { etiqueta: 'Motivo (opcional)', requerido: false },
    }).subscribe((motivo) => {
      this.procesando.set(s.id);
      this.api.cancelarSolicitud(s.id, motivo.trim() || undefined).subscribe({
        next: (r) => { this.procesando.set(null); this.reemplazar(r.data); this.toast.exito('Solicitud cancelada'); this.recargarResumen(); },
        error: (e) => { this.procesando.set(null); this.toast.error(mensajeError(e)); },
      });
    });
  }

  abrirCalificacion(s: SolicitudMaterial): void {
    this.calificando.set(s.id);
    this.estrellas.set(s.calificacion ?? 0);
    this.comentario = s.comentarioCalificacion ?? '';
  }

  /** Confirma la recepción (si falta) y guarda la calificación opcional. */
  enviarCalificacion(s: SolicitudMaterial): void {
    const calificacion = this.estrellas() || undefined;
    const comentarioCalificacion = this.comentario.trim() || undefined;
    this.procesando.set(s.id);
    const peticion = s.fechaConfirmacion
      ? this.api.calificar(s.id, calificacion ?? 0, comentarioCalificacion)
      : this.api.confirmarRecepcion(s.id, calificacion ? { calificacion, comentarioCalificacion } : {});
    peticion.subscribe({
      next: (r) => {
        this.procesando.set(null);
        this.calificando.set(null);
        this.reemplazar(r.data);
        this.toast.exito(s.fechaConfirmacion ? 'Gracias por tu calificación' : 'Recepción confirmada. ¡Gracias!');
      },
      error: (e) => { this.procesando.set(null); this.toast.error(mensajeError(e)); },
    });
  }

  private recargarResumen(): void {
    this.api.misSolicitudes({ limit: 1 }).subscribe({ next: (r) => this.resumen.set(r.data.resumen) });
  }
}
