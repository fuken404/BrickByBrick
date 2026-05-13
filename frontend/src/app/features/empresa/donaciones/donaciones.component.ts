import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MaterialApiService } from '../../../core/services/material-api.service';
import { SolicitudMaterial, EstadoSolicitud } from '../../../core/models';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type BadgeType = 'disponible'|'pendiente'|'aprobado'|'entregado'|'rechazado'|'verificado'|'pendiente-verificacion'|'secundario'|'primary'|'warning'|'danger';

@Component({
  selector: 'app-donaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, SkeletonLoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1 class="page-title">Solicitudes recibidas</h1>
      <p class="page-subtitle">Gestiona las solicitudes de materiales de los beneficiarios.</p>

      <!-- Filtros -->
      <div class="filter-chips">
        <button class="chip" [class.active]="!estadoFiltro" (click)="estadoFiltro = undefined; filtrar()">Todas</button>
        @for (e of estados; track e.value) {
          <button class="chip" [class.active]="estadoFiltro === e.value" (click)="estadoFiltro = e.value; filtrar()">{{ e.label }}</button>
        }
      </div>

      @if (loading()) {
        <app-skeleton-loader type="list" [count]="6" />
      } @else if (solicitudesFiltradas().length === 0) {
        <app-empty-state
          icon="inbox"
          title="Sin solicitudes"
          description="No tienes solicitudes en este estado."
        />
      } @else {
        <div class="solicitudes-list">
          @for (s of solicitudesFiltradas(); track s.id) {
            <div class="solicitud-card card">
              <div class="sol-header">
                <div class="sol-title">
                  <span class="mat-nombre">{{ s.material?.nombre }}</span>
                  <span class="beneficiario-info">
                    <mat-icon>person</mat-icon>
                    {{ s.beneficiario?.nombreCompleto ?? '—' }}
                    · CC {{ s.beneficiario?.cedula }}
                  </span>
                </div>
                <span class="estado-pill estado-{{ s.estado }}">{{ estadoLabel(s.estado) }}</span>
              </div>

              <div class="sol-body">
                <div class="detail-item">
                  <span class="lbl">Cantidad</span>
                  <span>{{ s.cantidadSolicitada }} {{ s.material?.unidadMedida }}</span>
                </div>
                <div class="detail-item">
                  <span class="lbl">Propósito</span>
                  <span>{{ s.propositoUso }}</span>
                </div>
                @if (s.descripcionProyecto) {
                  <div class="detail-item">
                    <span class="lbl">Proyecto</span>
                    <span>{{ s.descripcionProyecto }}</span>
                  </div>
                }
                <div class="detail-item">
                  <span class="lbl">Fecha solicitud</span>
                  <span>{{ s.fechaSolicitud | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>

              @if (s.estado === 'pendiente') {
                <div class="sol-actions">
                  @if (instruccionesEdit()[s.id] !== undefined) {
                    <div class="instrucciones-form">
                      <textarea class="form-control" rows="2"
                                [value]="instruccionesEdit()[s.id]"
                                (input)="setInstrucciones(s.id, $any($event.target).value)"
                                placeholder="Instrucciones de retiro para el beneficiario..."></textarea>
                      <div class="instrucciones-actions">
                        <button class="btn btn-sm btn-ghost" (click)="cancelarInstrucciones(s.id)">Cancelar</button>
                        <button class="btn btn-sm btn-primary" (click)="aprobar(s)">Confirmar aprobación</button>
                      </div>
                    </div>
                  } @else {
                    <button class="btn btn-sm btn-success" (click)="iniciarAprobacion(s.id)">
                      <mat-icon>check</mat-icon> Aprobar
                    </button>
                    <button class="btn btn-sm btn-danger-outline" (click)="rechazar(s)">
                      <mat-icon>close</mat-icon> Rechazar
                    </button>
                  }
                </div>
              }

              @if (s.estado === 'aprobada') {
                <div class="sol-actions">
                  <button class="btn btn-sm btn-secondary" (click)="marcarEntregada(s)">
                    <mat-icon>local_shipping</mat-icon> Marcar como entregada
                  </button>
                </div>
              }

              @if (s.instruccionesRetiro) {
                <div class="instrucciones-display">
                  <mat-icon>info</mat-icon>
                  <span>{{ s.instruccionesRetiro }}</span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './donaciones.component.scss',
})
export class DonacionesComponent implements OnInit {
  private readonly matSvc = inject(MaterialApiService);

  readonly solicitudes         = signal<SolicitudMaterial[]>([]);
  readonly solicitudesFiltradas= signal<SolicitudMaterial[]>([]);
  readonly loading             = signal(true);
  readonly instruccionesEdit   = signal<Record<string, string>>({});

  estadoFiltro: EstadoSolicitud | undefined;

  readonly estados = [
    { value: 'pendiente' as EstadoSolicitud,  label: 'Pendientes' },
    { value: 'aprobada'  as EstadoSolicitud,  label: 'Aprobadas' },
    { value: 'entregada' as EstadoSolicitud,  label: 'Entregadas' },
    { value: 'rechazada' as EstadoSolicitud,  label: 'Rechazadas' },
  ];

  estadoLabel(e: EstadoSolicitud) {
    return this.estados.find(x => x.value === e)?.label ?? e;
  }

  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    this.matSvc.getSolicitudesRecibidas({ limit: 100 }).subscribe({
      next: r => {
        this.solicitudes.set(r.data.items);
        this.solicitudesFiltradas.set(r.data.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filtrar() {
    const all = this.solicitudes();
    this.solicitudesFiltradas.set(
      this.estadoFiltro ? all.filter(s => s.estado === this.estadoFiltro) : all
    );
  }

  iniciarAprobacion(id: string) {
    this.instruccionesEdit.update(e => ({ ...e, [id]: '' }));
  }

  cancelarInstrucciones(id: string) {
    this.instruccionesEdit.update(e => { const n = { ...e }; delete n[id]; return n; });
  }

  setInstrucciones(id: string, val: string) {
    this.instruccionesEdit.update(e => ({ ...e, [id]: val }));
  }

  aprobar(s: SolicitudMaterial) {
    const instrucciones = this.instruccionesEdit()[s.id];
    this.matSvc.cambiarEstadoSolicitud(s.id, 'aprobada', instrucciones).subscribe({
      next: () => {
        this.solicitudes.update(list => list.map(x => x.id === s.id ? { ...x, estado: 'aprobada', instruccionesRetiro: instrucciones } : x));
        this.cancelarInstrucciones(s.id);
        this.filtrar();
      },
    });
  }

  rechazar(s: SolicitudMaterial) {
    this.matSvc.cambiarEstadoSolicitud(s.id, 'rechazada').subscribe({
      next: () => {
        this.solicitudes.update(list => list.map(x => x.id === s.id ? { ...x, estado: 'rechazada' } : x));
        this.filtrar();
      },
    });
  }

  marcarEntregada(s: SolicitudMaterial) {
    this.matSvc.cambiarEstadoSolicitud(s.id, 'entregada').subscribe({
      next: () => {
        this.solicitudes.update(list => list.map(x => x.id === s.id ? { ...x, estado: 'entregada' } : x));
        this.filtrar();
      },
    });
  }
}
