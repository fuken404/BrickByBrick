import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { EventApiService } from '../../../core/services/event-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { Evento } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';

@Component({
  selector: 'app-evento-detalle',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatIconModule, EmptyStateComponent, EstadoBadgePipe, EtiquetaPipe, UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" style="max-width:980px">
      <a class="btn-link" routerLink="/beneficiario/eventos"><mat-icon>arrow_back</mat-icon>Eventos</a>
      @if (cargando()) {
        <div class="card card-pad-lg center muted"><mat-icon class="spin">sync</mat-icon></div>
      } @else if (!evento()) {
        <div class="card"><app-empty-state icon="event_busy" title="Evento no disponible" /></div>
      } @else {
        @let e = evento()!;
        <article class="card" style="overflow:hidden">
          @if (e.imagenUrl) { <img [src]="e.imagenUrl | uploadUrl" alt="" style="width:100%;max-height:320px;object-fit:cover;display:block" /> }
          <div class="card-pad-lg stack">
            <div class="row">
              <span class="badge badge-secundario">{{ e.tipoEvento | etiqueta:'tipoEvento' }}</span>
              @if (e.estado !== 'publicado') { @let be = e.estado | estadoBadge:'evento'; <span class="badge" [class]="be.cssClass">{{ be.label }}</span> }
              @if (e.miInscripcion && e.miInscripcion !== 'cancelada') { @let bi = e.miInscripcion | estadoBadge:'inscripcion'; <span class="badge" [class]="bi.cssClass">{{ bi.label }}</span> }
            </div>
            <h1 class="page-title">{{ e.nombre }}</h1>
            @if (e.estado === 'cancelado') {
              <div class="alert danger"><mat-icon>event_busy</mat-icon><span>Este evento fue cancelado.{{ e.motivoCancelacion ? ' Motivo: ' + e.motivoCancelacion : '' }}</span></div>
            }
            <dl class="dl">
              <dt>Fecha</dt><dd>{{ e.fechaInicio | date:"EEEE d 'de' MMMM 'de' y" }}</dd>
              <dt>Horario</dt><dd>{{ e.fechaInicio | date:'h:mm a' }} – {{ e.fechaFin | date:'h:mm a' }}</dd>
              <dt>Lugar</dt><dd>{{ e.direccion ?? 'Por confirmar' }}{{ e.localidad ? ' · ' + e.localidad.nombre : '' }}</dd>
              <dt>Organiza</dt><dd><a class="btn-link" [routerLink]="['/beneficiario/usuarios', e.constructora.usuarioId]">{{ e.constructora.razonSocial }}</a></dd>
              <dt>Cupos</dt><dd>{{ e.capacidadMaxima ? (e.cuposDisponibles + ' disponibles de ' + e.capacidadMaxima) : 'Sin límite' }}</dd>
            </dl>
            @if (e.direccion) {
              <a class="btn btn-sm btn-ghost" style="align-self:flex-start" target="_blank" rel="noopener" [href]="mapa()"><mat-icon>map</mat-icon>Ver en el mapa</a>
            }
            @if (e.descripcion) { <p class="pre-line">{{ e.descripcion }}</p> }

            @if (e.materiales?.length) {
              <h3>Materiales que se entregarán</h3>
              <ul class="list-card">
                @for (m of e.materiales; track m.material.id) {
                  <li class="list-item clickable" [routerLink]="['/beneficiario/materiales', m.material.id]">
                    <mat-icon [style.color]="m.material.categoria.colorHex">{{ m.material.categoria.icono }}</mat-icon>
                    <span class="grow">{{ m.material.nombre }}</span>
                    <span class="small muted">{{ m.material.cantidad | number:'1.0-2' }} {{ m.material.unidadMedida }}</span>
                  </li>
                }
              </ul>
            }

            <div class="form-actions">
              @if (inscrito()) {
                @if (abierto()) { <button type="button" class="btn btn-danger-outline" (click)="cancelar()" [disabled]="procesando()">Cancelar inscripción</button> }
              } @else if (abierto()) {
                <button type="button" class="btn btn-primary" (click)="inscribirse()" [disabled]="procesando() || e.cuposDisponibles === 0">
                  <mat-icon>how_to_reg</mat-icon>{{ e.cuposDisponibles === 0 ? 'Sin cupos' : 'Inscribirme' }}
                </button>
              }
            </div>
          </div>
        </article>
      }
    </div>
  `,
})
export class EventoDetalleComponent {
  readonly id = input.required<string>();
  private readonly api = inject(EventApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);

  protected readonly evento = signal<Evento | null>(null);
  protected readonly cargando = signal(true);
  protected readonly procesando = signal(false);
  protected readonly inscrito = computed(() => ['inscrito', 'asistio'].includes(this.evento()?.miInscripcion ?? ''));
  protected readonly abierto = computed(() => {
    const e = this.evento();
    return !!e && ['publicado', 'en_curso'].includes(e.estado) && new Date(e.fechaFin) > new Date();
  });
  protected readonly mapa = computed(() => {
    const e = this.evento();
    const texto = [e?.direccion, e?.localidad?.nombre, 'Bogotá, Colombia'].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(texto)}`;
  });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.cargar(id));
    });
  }

  private cargar(id: string): void {
    this.cargando.set(true);
    this.api.obtener(id).subscribe({
      next: (r) => { this.evento.set(r.data); this.cargando.set(false); },
      error: () => { this.evento.set(null); this.cargando.set(false); },
    });
  }

  inscribirse(): void {
    this.procesando.set(true);
    this.api.inscribirse(this.id()).subscribe({
      next: () => { this.procesando.set(false); this.toast.exito('¡Inscripción confirmada!'); this.cargar(this.id()); },
      error: (e) => { this.procesando.set(false); this.toast.error(mensajeError(e)); },
    });
  }

  cancelar(): void {
    this.dialogo.confirmar({ titulo: 'Cancelar inscripción', mensaje: 'Liberarás tu cupo para otra persona.', confirmar: 'Cancelar inscripción', peligroso: true })
      .subscribe(() => {
        this.procesando.set(true);
        this.api.cancelarInscripcion(this.id()).subscribe({
          next: () => { this.procesando.set(false); this.toast.exito('Inscripción cancelada'); this.cargar(this.id()); },
          error: (e) => { this.procesando.set(false); this.toast.error(mensajeError(e)); },
        });
      });
  }
}
