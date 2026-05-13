import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { EventApiService } from '../../../core/services/event-api.service';
import { Evento } from '../../../core/models';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-eventos',
  standalone: true,
  imports: [CommonModule, MatIconModule, SkeletonLoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1 class="page-title">Eventos</h1>
      <p class="page-subtitle">{{ total() }} eventos en la plataforma</p>

      @if (loading()) {
        <app-skeleton-loader type="list" [count]="6" />
      } @else if (eventos().length === 0) {
        <app-empty-state icon="event_busy" title="Sin eventos" description="No hay eventos registrados." />
      } @else {
        <div class="table-card card">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Empresa</th>
                <th>Tipo</th>
                <th>Fecha inicio</th>
                <th>Inscritos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (e of eventos(); track e.id) {
                <tr>
                  <td><div class="evento-nombre">{{ e.nombre }}</div></td>
                  <td>{{ e.constructora?.razonSocial }}</td>
                  <td><span class="tipo-pill">{{ tipoLabel(e.tipoEvento) }}</span></td>
                  <td>{{ e.fechaInicio | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ e._count.inscripciones }}{{ e.capacidadMaxima ? ' / ' + e.capacidadMaxima : '' }}</td>
                  <td><span class="estado-pill estado-{{ e.estado }}">{{ e.estado }}</span></td>
                  <td>
                    @if (e.estado === 'publicado') {
                      <button class="action-btn warning" (click)="cancelar(e)" title="Cancelar">
                        <mat-icon>cancel</mat-icon>
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styleUrl: './eventos.component.scss',
})
export class AdminEventosComponent implements OnInit {
  private readonly eventSvc = inject(EventApiService);

  readonly eventos = signal<Evento[]>([]);
  readonly loading = signal(true);
  readonly total   = signal(0);

  readonly tipoLabels: Record<string, string> = {
    entrega_masiva: 'Entrega masiva', taller: 'Taller', feria: 'Feria', otro: 'Otro',
  };
  tipoLabel(t: string) { return this.tipoLabels[t] ?? t; }

  ngOnInit() {
    this.eventSvc.getAll({ limit: 50 }).subscribe({
      next: r => { this.eventos.set(r.data.items); this.total.set(r.data.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  cancelar(e: Evento) {
    this.eventSvc.update(e.id, { estado: 'cancelado' }).subscribe({
      next: () => this.eventos.update(list => list.map(x => x.id === e.id ? { ...x, estado: 'cancelado' } : x)),
    });
  }
}
