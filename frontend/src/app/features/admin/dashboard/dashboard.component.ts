import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { DashboardAdmin, EstadoSolicitud } from '../../../core/models';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

const COLORES_ESTADO: Record<EstadoSolicitud, string> = {
  pendiente: '#E67E22', aprobada: '#27AE60', entregada: '#2E86AB', rechazada: '#E74C3C', cancelada: '#95A5A6',
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, MatIconModule, BaseChartDirective, KpiCardComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div><h1 class="page-title">Panel de administración</h1><p class="page-subtitle">Estado general de la plataforma.</p></div>
        <div class="actions"><a class="btn btn-secondary" routerLink="/admin/metricas"><mat-icon>insights</mat-icon>Métricas de la tesis</a></div>
      </header>

      @if (!d()) {
        <app-skeleton-loader type="kpi" [count]="8" />
      } @else {
        @let x = d()!;
        @if (x.constructorasPendientes || x.reportesPendientes || x.solicitudesPendientes) {
          <div class="grid-kpi">
            @if (x.constructorasPendientes) {
              <a class="alert warning" routerLink="/admin/constructoras" [queryParams]="{ verificada: 'false' }"><mat-icon>business</mat-icon><span><strong>{{ x.constructorasPendientes }}</strong> constructora(s) por verificar</span></a>
            }
            @if (x.reportesPendientes) {
              <a class="alert danger" routerLink="/admin/moderacion"><mat-icon>flag</mat-icon><span><strong>{{ x.reportesPendientes }}</strong> reporte(s) por revisar</span></a>
            }
            @if (x.solicitudesPendientes) {
              <a class="alert info" routerLink="/admin/donaciones"><mat-icon>pending_actions</mat-icon><span><strong>{{ x.solicitudesPendientes }}</strong> solicitud(es) sin respuesta</span></a>
            }
          </div>
        }

        <div class="grid-kpi">
          <app-kpi-card label="Beneficiarios" [value]="x.beneficiarios" icon="people" color="#2E86AB" [sub]="x.beneficiariosAtendidos + ' atendidos con entregas'" />
          <app-kpi-card label="Constructoras" [value]="x.constructoras" icon="business" color="#C0392B" [sub]="x.constructorasVerificadas + ' verificadas · ' + x.constructorasActivasMes + ' activas este mes'" />
          <app-kpi-card label="Materiales activos" [value]="x.materialesActivos" icon="inventory_2" color="#E67E22" [sub]="x.totalMateriales + ' publicados en total'" />
          <app-kpi-card label="Entregas" [value]="x.solicitudesEntregadas" icon="local_shipping" color="#27AE60" [sub]="x.totalSolicitudes + ' solicitudes en total'" />
          <app-kpi-card label="Valor donado" [value]="x.valorDonadoCop" formato="cop" icon="savings" color="#8E44AD" />
          <app-kpi-card label="Eventos activos" [value]="x.eventosActivos" icon="event" color="#16A085" [sub]="x.totalEventos + ' eventos creados'" />
          <app-kpi-card label="Satisfacción" [value]="x.calificacionPromedio !== null ? x.calificacionPromedio.toFixed(1) + ' / 5' : null" formato="texto" icon="star" color="#F1C40F" [sub]="x.calificaciones + ' calificaciones'" />
          <app-kpi-card label="Publicaciones" [value]="x.publicaciones" icon="forum" color="#6D4C41" [sub]="x.usuariosSuspendidos + ' usuarios suspendidos'" />
        </div>

        <div class="split">
          <section class="card card-pad-lg">
            <h2 class="section-title mb-16"><mat-icon>show_chart</mat-icon>Actividad de los últimos meses</h2>
            <div style="position:relative;height:280px"><canvas baseChart type="line" [data]="serie()" [options]="opcionesLinea"></canvas></div>
          </section>
          <aside class="card card-pad-lg">
            <h2 class="section-title mb-16"><mat-icon>donut_large</mat-icon>Solicitudes por estado</h2>
            <div style="position:relative;height:280px"><canvas baseChart type="doughnut" [data]="estados()" [options]="opcionesDona"></canvas></div>
          </aside>
        </div>
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  protected readonly d = signal<DashboardAdmin | null>(null);

  protected readonly serie = computed<ChartConfiguration<'line'>['data']>(() => {
    const s = this.d()?.series ?? [];
    return {
      labels: s.map((x) => x.mes),
      datasets: [
        { label: 'Solicitudes', data: s.map((x) => x.solicitudes), borderColor: '#E67E22', backgroundColor: '#E67E2222', tension: .3, fill: true },
        { label: 'Entregas', data: s.map((x) => x.entregas), borderColor: '#27AE60', backgroundColor: '#27AE6022', tension: .3, fill: true },
        { label: 'Materiales', data: s.map((x) => x.materiales), borderColor: '#C0392B', tension: .3 },
        { label: 'Usuarios nuevos', data: s.map((x) => x.usuarios), borderColor: '#2E86AB', tension: .3 },
      ],
    };
  });

  protected readonly estados = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const e = this.d()?.solicitudesPorEstado ?? {};
    const claves = Object.keys(COLORES_ESTADO) as EstadoSolicitud[];
    return {
      labels: claves.map((c) => c[0].toUpperCase() + c.slice(1)),
      datasets: [{ data: claves.map((c) => e[c] ?? 0), backgroundColor: claves.map((c) => COLORES_ESTADO[c]) }],
    };
  });

  protected readonly opcionesLinea: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };
  protected readonly opcionesDona: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } },
  };

  ngOnInit(): void {
    this.api.dashboard().subscribe({ next: (r) => this.d.set(r.data) });
  }
}
