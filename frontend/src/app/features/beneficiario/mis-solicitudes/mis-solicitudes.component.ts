import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MaterialApiService } from '../../../core/services/material-api.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { SolicitudMaterial, EstadoSolicitud, Beneficiario } from '../../../core/models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

type BadgeType = 'disponible' | 'pendiente' | 'aprobado' | 'entregado' | 'rechazado' | 'verificado' | 'pendiente-verificacion' | 'secundario' | 'primary' | 'warning' | 'danger';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-mis-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, BadgeComponent, SkeletonLoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Mis solicitudes</h1>
        <p class="page-subtitle">Historial de solicitudes de materiales</p>
      </div>

      <!-- Filtro por estado -->
      <div class="filters-bar card">
        <div class="estado-chips">
          <button class="chip" [class.active]="!estadoFiltro" (click)="setEstado(undefined)">Todas</button>
          @for (e of estados; track e.value) {
            <button class="chip chip-{{ e.value }}" [class.active]="estadoFiltro === e.value" (click)="setEstado(e.value)">
              {{ e.label }}
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <app-skeleton-loader type="list" [count]="5" />
      } @else if (solicitudes().length === 0) {
        <app-empty-state
          icon="pending_actions"
          title="Sin solicitudes"
          [description]="estadoFiltro ? 'No tienes solicitudes en este estado.' : 'Aún no has solicitado ningún material. Explora el catálogo.'"
          actionLabel="Ver materiales"
          [actionFn]="irAMateriales.bind(this)"
        />
      } @else {
        <div class="solicitudes-list">
          @for (s of solicitudes(); track s.id) {
            <div class="solicitud-card card" [class.card-aprobada]="s.estado === 'aprobada'"
                                             [class.card-rechazada]="s.estado === 'rechazada'"
                                             [class.card-entregada]="s.estado === 'entregada'">

              <!-- Banner aprobación -->
              @if (s.estado === 'aprobada') {
                <div class="estado-banner banner-aprobada">
                  <mat-icon>check_circle</mat-icon>
                  <div>
                    <strong>¡Solicitud aprobada!</strong>
                    <span>La constructora ha aprobado tu solicitud.</span>
                  </div>
                </div>
              }
              @if (s.estado === 'rechazada') {
                <div class="estado-banner banner-rechazada">
                  <mat-icon>cancel</mat-icon>
                  <div>
                    <strong>Solicitud rechazada</strong>
                    <span>La constructora no pudo aprobar esta solicitud.</span>
                  </div>
                </div>
              }
              @if (s.estado === 'entregada') {
                <div class="estado-banner banner-entregada">
                  <mat-icon>inventory</mat-icon>
                  <div>
                    <strong>¡Material entregado!</strong>
                    <span>Gracias por ser parte de BrickByBrick.</span>
                  </div>
                </div>
              }

              <div class="solicitud-header">
                <div class="mat-info">
                  <span class="mat-nombre">{{ s.material?.nombre ?? 'Material eliminado' }}</span>
                  <span class="mat-cat">{{ s.material?.categoria?.nombre }}</span>
                </div>
                <app-badge [type]="estadoBadge(s.estado)" />
              </div>

              <div class="solicitud-body">
                <div class="detail-row">
                  <span class="label">Cantidad</span>
                  <span>{{ s.cantidadSolicitada }} {{ s.material?.unidadMedida }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Propósito</span>
                  <span>{{ s.propositoUso }}</span>
                </div>
                @if (s.instruccionesRetiro) {
                  <div class="detail-row">
                    <span class="label">Instrucciones de retiro</span>
                    <span class="instrucciones">{{ s.instruccionesRetiro }}</span>
                  </div>
                }
                <div class="detail-row">
                  <span class="label">Fecha solicitud</span>
                  <span>{{ s.fechaSolicitud | date:'dd/MM/yyyy' }}</span>
                </div>
                @if (s.fechaRespuesta) {
                  <div class="detail-row">
                    <span class="label">Fecha respuesta</span>
                    <span>{{ s.fechaRespuesta | date:'dd/MM/yyyy' }}</span>
                  </div>
                }
                @if (s.fechaEntrega) {
                  <div class="detail-row">
                    <span class="label">Fecha entrega</span>
                    <span>{{ s.fechaEntrega | date:'dd/MM/yyyy' }}</span>
                  </div>
                }
              </div>

              @if (s.estado === 'entregada' && !s.calificacion) {
                <div class="calificar-section">
                  <p class="calificar-prompt">¿Cómo fue tu experiencia? Califica esta donación:</p>
                  <div class="stars">
                    @for (star of [1,2,3,4,5]; track star) {
                      <button class="star-btn" [class.active]="(calificaciones()[s.id] ?? 0) >= star"
                              (click)="setCalificacion(s.id, star)">
                        <mat-icon>star</mat-icon>
                      </button>
                    }
                  </div>
                  @if (calificaciones()[s.id]) {
                    <button class="btn btn-sm btn-primary" (click)="enviarCalificacion(s)">
                      Enviar calificación
                    </button>
                  }
                </div>
              }

              @if (s.calificacion) {
                <div class="calificacion-display">
                  @for (star of [1,2,3,4,5]; track star) {
                    <mat-icon class="star-icon" [class.filled]="s.calificacion >= star">star</mat-icon>
                  }
                  @if (s.comentarioCalificacion) {
                    <span class="cal-comment">{{ s.comentarioCalificacion }}</span>
                  }
                </div>
              }

              @if (s.estado === 'pendiente') {
                <div class="solicitud-actions">
                  <button class="btn btn-sm btn-danger-outline" (click)="cancelarSolicitud(s)">
                    Cancelar solicitud
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './mis-solicitudes.component.scss',
})
export class MisSolicitudesComponent implements OnInit {
  private readonly matSvc  = inject(MaterialApiService);
  private readonly auth    = inject(AuthStore);

  readonly solicitudes  = signal<SolicitudMaterial[]>([]);
  readonly loading      = signal(true);
  readonly calificaciones = signal<Record<string, number>>({});

  estadoFiltro: EstadoSolicitud | undefined;

  readonly estados = [
    { value: 'pendiente'  as EstadoSolicitud, label: 'Pendientes' },
    { value: 'aprobada'   as EstadoSolicitud, label: 'Aprobadas' },
    { value: 'entregada'  as EstadoSolicitud, label: 'Entregadas' },
    { value: 'rechazada'  as EstadoSolicitud, label: 'Rechazadas' },
    { value: 'cancelada'  as EstadoSolicitud, label: 'Canceladas' },
  ];

  estadoBadge(e: EstadoSolicitud): BadgeType {
    const map: Record<EstadoSolicitud, BadgeType> = {
      pendiente: 'pendiente',
      aprobada:  'aprobado',
      rechazada: 'rechazado',
      entregada: 'entregado',
      cancelada: 'danger',
    };
    return map[e] ?? 'secundario';
  }

  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    const params = this.estadoFiltro ? { estado: this.estadoFiltro, limit: 50 } : { limit: 50 };
    this.matSvc.getMisSolicitudes(params).subscribe({
      next: r => { this.solicitudes.set(r.data.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setEstado(e: EstadoSolicitud | undefined) {
    this.estadoFiltro = e;
    this.load();
  }

  setCalificacion(id: string, val: number) {
    this.calificaciones.update(c => ({ ...c, [id]: val }));
  }

  enviarCalificacion(s: SolicitudMaterial) {
    const cal = this.calificaciones()[s.id];
    if (!cal) return;
    this.matSvc.calificarSolicitud(s.id, cal).subscribe({
      next: r => {
        this.solicitudes.update(list =>
          list.map(x => x.id === s.id ? { ...x, calificacion: cal } : x)
        );
      },
    });
  }

  cancelarSolicitud(s: SolicitudMaterial) {
    this.matSvc.cambiarEstadoSolicitud(s.id, 'cancelada').subscribe({
      next: () => {
        this.solicitudes.update(list =>
          list.map(x => x.id === s.id ? { ...x, estado: 'cancelada' } : x)
        );
      },
    });
  }

  irAMateriales() {
    window.location.href = '/beneficiario/materiales';
  }
}
