import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MaterialApiService } from '../../../core/services/material-api.service';
import { SolicitudMaterial } from '../../../core/models';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-admin-donaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, KpiCardComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Solicitudes de materiales</h1>
          <p class="page-subtitle">{{ total() }} solicitudes en total</p>
        </div>
        <div class="filter-wrap">
          <button class="chip" [class.active]="!filtroEstado" (click)="setFiltro('')">Todas</button>
          <button class="chip" [class.active]="filtroEstado==='pendiente'"  (click)="setFiltro('pendiente')">Pendientes</button>
          <button class="chip" [class.active]="filtroEstado==='aprobada'"   (click)="setFiltro('aprobada')">Aprobadas</button>
          <button class="chip" [class.active]="filtroEstado==='entregada'"  (click)="setFiltro('entregada')">Entregadas</button>
          <button class="chip" [class.active]="filtroEstado==='rechazada'"  (click)="setFiltro('rechazada')">Rechazadas</button>
        </div>
      </div>

      <div class="kpi-grid">
        <app-kpi-card label="Pendientes" [value]="stats().pendientes" icon="pending_actions" iconColor="#E67E22" iconBg="rgba(230,126,34,.1)" />
        <app-kpi-card label="Aprobadas"  [value]="stats().aprobadas"  icon="check_circle"    iconColor="#27AE60" iconBg="rgba(39,174,96,.1)"  />
        <app-kpi-card label="Entregadas" [value]="stats().entregadas" icon="local_shipping"  iconColor="#2E86AB" iconBg="rgba(46,134,171,.1)" />
        <app-kpi-card label="Rechazadas" [value]="stats().rechazadas" icon="cancel"          iconColor="#E74C3C" iconBg="rgba(231,76,60,.1)"  />
      </div>

      @if (loading()) {
        <app-skeleton-loader type="list" [count]="8" />
      } @else if (solicitudes().length === 0) {
        <div class="empty-msg">No hay solicitudes que mostrar.</div>
      } @else {
        <div class="table-card card">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Constructora</th>
                <th>Beneficiario</th>
                <th>Cantidad</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (s of solicitudes(); track s.id) {
                <tr>
                  <td>{{ s.material?.nombre ?? '—' }}</td>
                  <td>{{ s.material?.constructora?.razonSocial ?? '—' }}</td>
                  <td>
                    <div class="ben-cell">
                      <span>{{ s.beneficiario?.nombreCompleto ?? '—' }}</span>
                      @if (s.beneficiario?.cedula) {
                        <span class="cedula">{{ s.beneficiario!.cedula }}</span>
                      }
                    </div>
                  </td>
                  <td>{{ s.cantidadSolicitada }} {{ s.material?.unidadMedida }}</td>
                  <td>{{ s.fechaSolicitud | date:'dd/MM/yyyy' }}</td>
                  <td><span class="estado-pill estado-{{ s.estado }}">{{ s.estado }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (hasMore()) {
          <div class="load-more">
            <button class="btn btn-ghost" (click)="loadMore()">Cargar más</button>
          </div>
        }
      }
    </div>
  `,
  styleUrl: './donaciones.component.scss',
})
export class AdminDonacionesComponent implements OnInit {
  private readonly matSvc = inject(MaterialApiService);

  readonly solicitudes = signal<SolicitudMaterial[]>([]);
  readonly loading     = signal(true);
  readonly total       = signal(0);
  readonly stats       = signal({ pendientes: 0, aprobadas: 0, entregadas: 0, rechazadas: 0 });

  filtroEstado = '';
  private page = 1;

  hasMore() { return this.solicitudes().length < this.total(); }

  ngOnInit() { this.load(); }

  setFiltro(estado: string) {
    this.filtroEstado = estado;
    this.page = 1;
    this.load();
  }

  loadMore() { this.page++; this.load(true); }

  private load(append = false) {
    if (!append) this.loading.set(true);
    const params: Record<string, string | number> = { page: this.page, limit: 20 };
    if (this.filtroEstado) params['estado'] = this.filtroEstado;

    this.matSvc.getAllSolicitudes(params as any).subscribe({
      next: r => {
        this.solicitudes.update(prev => append ? [...prev, ...r.data.items] : r.data.items);
        this.total.set(r.data.total);
        this.stats.set(r.data.stats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
