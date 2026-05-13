import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { EventApiService } from '../../../core/services/event-api.service';
import { Evento } from '../../../core/models';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-empresa-eventos',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, SkeletonLoaderComponent, EmptyStateComponent, ConfirmationModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Mis eventos</h1>
          <p class="page-subtitle">{{ total() }} eventos creados</p>
        </div>
        <a routerLink="/empresa/eventos/nuevo" class="btn btn-primary">
          <mat-icon>add</mat-icon> Nuevo evento
        </a>
      </div>

      @if (loading()) {
        <app-skeleton-loader type="list" [count]="5" />
      } @else if (eventos().length === 0) {
        <app-empty-state
          icon="event_busy"
          title="Sin eventos"
          description="Crea eventos para conectar con beneficiarios."
          actionLabel="Crear evento"
          [actionFn]="irANuevo.bind(this)"
        />
      } @else {
        <div class="eventos-list">
          @for (e of eventos(); track e.id) {
            <div class="evento-card card">
              <div class="evento-img-wrap">
                @if (e.imagenUrl) {
                  <img [src]="e.imagenUrl" [alt]="e.nombre" class="evento-img" />
                } @else {
                  <div class="evento-img-ph"><mat-icon>event</mat-icon></div>
                }
              </div>
              <div class="evento-info">
                <div class="evento-tipo">{{ tipoLabel(e.tipoEvento) }}</div>
                <h3 class="evento-nombre">{{ e.nombre }}</h3>
                <div class="evento-meta">
                  <span><mat-icon>calendar_today</mat-icon> {{ e.fechaInicio | date:'dd/MM/yyyy HH:mm' }}</span>
                  @if (e.direccion) {
                    <span><mat-icon>location_on</mat-icon> {{ e.direccion }}</span>
                  }
                  <span><mat-icon>people</mat-icon> {{ e._count.inscripciones }} inscritos
                    @if (e.capacidadMaxima) { / {{ e.capacidadMaxima }} max }
                  </span>
                </div>
              </div>
              <div class="evento-actions">
                <span class="estado-pill estado-{{ e.estado }}">{{ e.estado }}</span>
                <a [routerLink]="['/empresa/eventos', e.id, 'editar']" class="action-btn" title="Editar">
                  <mat-icon>edit</mat-icon>
                </a>
                @if (e.estado === 'borrador') {
                  <button class="action-btn success" (click)="publicar(e)" title="Publicar">
                    <mat-icon>publish</mat-icon>
                  </button>
                }
                @if (e.estado === 'publicado') {
                  <button class="action-btn warning" (click)="cambiarEstado(e, 'cancelado')" title="Cancelar evento">
                    <mat-icon>cancel</mat-icon>
                  </button>
                }
                <button class="action-btn danger" (click)="eventoAEliminar.set(e)" title="Eliminar">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }

      @if (eventoAEliminar()) {
        <app-confirmation-modal
          title="Eliminar evento"
          [message]="'¿Eliminar ' + eventoAEliminar()!.nombre + '? Esta acción no se puede deshacer.'"
          confirmLabel="Eliminar"
          [dangerous]="true"
          (confirmed)="eliminar()"
          (cancelled)="eventoAEliminar.set(null)"
        />
      }
    </div>
  `,
  styleUrl: './eventos.component.scss',
})
export class EmpresaEventosComponent implements OnInit {
  private readonly eventSvc = inject(EventApiService);
  private readonly router   = inject(Router);

  readonly eventos         = signal<Evento[]>([]);
  readonly loading         = signal(true);
  readonly total           = signal(0);
  readonly eventoAEliminar = signal<Evento | null>(null);

  readonly tipoLabels: Record<string, string> = {
    entrega_masiva: 'Entrega masiva',
    taller:         'Taller',
    feria:          'Feria',
    otro:           'Otro',
  };

  tipoLabel(t: string) { return this.tipoLabels[t] ?? t; }

  ngOnInit() {
    this.eventSvc.getMisEventos({ limit: 50 }).subscribe({
      next: r => { this.eventos.set(r.data.items); this.total.set(r.data.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  irANuevo() { this.router.navigate(['/empresa/eventos/nuevo']); }

  publicar(e: Evento) { this.cambiarEstado(e, 'publicado'); }

  cambiarEstado(e: Evento, estado: string) {
    this.eventSvc.update(e.id, { estado: estado as Evento['estado'] }).subscribe({
      next: () => {
        this.eventos.update(list =>
          list.map(x => x.id === e.id ? { ...x, estado: estado as Evento['estado'] } : x)
        );
      },
    });
  }

  eliminar() {
    const e = this.eventoAEliminar();
    if (!e) return;
    this.eventSvc.delete(e.id).subscribe({
      next: () => {
        this.eventos.update(list => list.filter(x => x.id !== e.id));
        this.eventoAEliminar.set(null);
      },
    });
  }
}
