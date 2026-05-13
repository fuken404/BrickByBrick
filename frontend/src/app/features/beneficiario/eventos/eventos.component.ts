import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EventApiService } from '../../../core/services/event-api.service';
import { Evento, FiltrosEvento, TipoEvento } from '../../../core/models';
import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, EventCardComponent, SkeletonLoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Eventos</h1>
        <p class="page-subtitle">{{ total() }} eventos disponibles</p>
      </div>

      <div class="filters-bar card">
        <div class="tipo-chips">
          <button class="chip" [class.active]="!tipoSeleccionado" (click)="setTipo(undefined)">Todos</button>
          @for (t of tipos; track t.value) {
            <button class="chip" [class.active]="tipoSeleccionado === t.value" (click)="setTipo(t.value)">
              <mat-icon>{{ t.icon }}</mat-icon> {{ t.label }}
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <app-skeleton-loader type="card" [count]="6" />
      } @else if (eventos().length === 0) {
        <app-empty-state
          icon="event_busy"
          title="Sin eventos disponibles"
          description="No hay eventos publicados en este momento. Vuelve pronto."
        />
      } @else {
        <div class="grid">
          @for (e of eventos(); track e.id) {
            <app-event-card
              [evento]="e"
              [inscrito]="inscritoIds().has(e.id)"
              (clicked)="abrirDetalle($event)"
              (inscribirse)="toggleInscripcion($event)"
            />
          }
        </div>

        @if (hasMore()) {
          <div class="load-more">
            <button class="btn btn-ghost" (click)="loadMore()" [disabled]="loadingMore()">
              {{ loadingMore() ? 'Cargando...' : 'Cargar más' }}
            </button>
          </div>
        }
      }

      <!-- Evento modal -->
      @if (eventoDetalle()) {
        <div class="modal-overlay" (click)="eventoDetalle.set(null)">
          <div class="modal" (click)="$event.stopPropagation()">
            <button class="modal-close icon-btn" (click)="eventoDetalle.set(null)"><mat-icon>close</mat-icon></button>

            @if (eventoDetalle()!.imagenUrl) {
              <img [src]="eventoDetalle()!.imagenUrl!" [alt]="eventoDetalle()!.nombre" class="modal-img" />
            }

            <div class="modal-body">
              <div class="tipo-pill tipo-{{ eventoDetalle()!.tipoEvento }}">{{ tipoLabel(eventoDetalle()!.tipoEvento) }}</div>
              <h2 class="modal-title">{{ eventoDetalle()!.nombre }}</h2>

              <div class="info-list">
                <div class="info-item">
                  <mat-icon>event</mat-icon>
                  <span>{{ eventoDetalle()!.fechaInicio | date:'dd/MM/yyyy HH:mm' }} — {{ eventoDetalle()!.fechaFin | date:'HH:mm' }}</span>
                </div>
                @if (eventoDetalle()!.direccion) {
                  <div class="info-item">
                    <mat-icon>location_on</mat-icon>
                    <span>{{ eventoDetalle()!.direccion }}</span>
                  </div>
                }
                @if (eventoDetalle()!.capacidadMaxima) {
                  <div class="info-item">
                    <mat-icon>group</mat-icon>
                    <span>{{ eventoDetalle()!._count.inscripciones }} / {{ eventoDetalle()!.capacidadMaxima }} inscritos</span>
                  </div>
                }
              </div>

              @if (eventoDetalle()!.descripcion) {
                <p class="modal-desc">{{ eventoDetalle()!.descripcion }}</p>
              }

              <div class="modal-actions">
                <button class="btn btn-ghost" (click)="eventoDetalle.set(null)">Cerrar</button>
                @if (!inscritoIds().has(eventoDetalle()!.id)) {
                  <button class="btn btn-primary" (click)="toggleInscripcion(eventoDetalle()!)"
                          [disabled]="procesandoId() === eventoDetalle()!.id">
                    {{ procesandoId() === eventoDetalle()!.id ? 'Inscribiendo...' : 'Inscribirme' }}
                  </button>
                } @else {
                  <button class="btn btn-danger-outline" (click)="toggleInscripcion(eventoDetalle()!)"
                          [disabled]="procesandoId() === eventoDetalle()!.id">
                    Cancelar inscripción
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './eventos.component.scss',
})
export class EventosComponent implements OnInit {
  private readonly eventSvc = inject(EventApiService);
  private readonly snack    = inject(MatSnackBar);

  readonly eventos       = signal<Evento[]>([]);
  readonly loading       = signal(true);
  readonly loadingMore   = signal(false);
  readonly total         = signal(0);
  readonly inscritoIds   = signal<Set<string>>(new Set());
  readonly procesandoId  = signal<string | null>(null);
  readonly eventoDetalle = signal<Evento | null>(null);

  private page = 1;
  tipoSeleccionado: TipoEvento | undefined;

  readonly tipos = [
    { value: 'entrega_masiva' as TipoEvento, label: 'Entrega masiva', icon: 'inventory' },
    { value: 'taller'        as TipoEvento, label: 'Taller',          icon: 'build' },
    { value: 'feria'         as TipoEvento, label: 'Feria',           icon: 'storefront' },
    { value: 'otro'          as TipoEvento, label: 'Otro',            icon: 'event' },
  ];

  hasMore() { return this.eventos().length < this.total(); }

  tipoLabel(t: TipoEvento) {
    return this.tipos.find(x => x.value === t)?.label ?? t;
  }

  ngOnInit() { this.load(); }

  private load(append = false) {
    if (append) this.loadingMore.set(true);
    else        this.loading.set(true);

    const filtros: FiltrosEvento = { estado: 'publicado', limit: 9, page: this.page };
    if (this.tipoSeleccionado) filtros.tipoEvento = this.tipoSeleccionado;

    this.eventSvc.getAll(filtros).subscribe({
      next: r => {
        this.eventos.update(prev => append ? [...prev, ...r.data.items] : r.data.items);
        this.total.set(r.data.total);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); },
    });
  }

  setTipo(t: TipoEvento | undefined) {
    this.tipoSeleccionado = t;
    this.page = 1;
    this.load();
  }

  loadMore() {
    this.page++;
    this.load(true);
  }

  abrirDetalle(e: Evento) { this.eventoDetalle.set(e); }

  toggleInscripcion(e: Evento) {
    this.procesandoId.set(e.id);
    const isInscrito = this.inscritoIds().has(e.id);

    const doAction = isInscrito
      ? this.eventSvc.cancelarInscripcion(e.id).subscribe({
          next: () => {
            this.inscritoIds.update(ids => { const s = new Set(ids); s.delete(e.id); return s; });
            this.procesandoId.set(null);
            if (this.eventoDetalle()?.id === e.id) this.eventoDetalle.set(null);
          },
          error: () => this.procesandoId.set(null),
        })
      : this.eventSvc.inscribirse(e.id).subscribe({
          next: () => {
            this.inscritoIds.update(ids => { const s = new Set(ids); s.add(e.id); return s; });
            this.procesandoId.set(null);
            if (this.eventoDetalle()?.id === e.id) this.eventoDetalle.set(null);
          },
          error: (err) => {
            this.procesandoId.set(null);
            const msg = err?.error?.message ?? 'No se pudo completar la inscripción';
            this.snack.open(msg, 'Cerrar', { duration: 4000 });
          },
        });

    void doAction;
  }
}
