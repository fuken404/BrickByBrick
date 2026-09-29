import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { catchError, forkJoin, of } from 'rxjs';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { MetricasAdmin, MetricasRendimiento } from '../../../core/models';
import { descargarArchivo, mensajeError, nombreArchivo } from '../../../core/utils/http';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';

@Component({
  selector: 'app-admin-metricas',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, MatIconModule, BaseChartDirective, KpiCardComponent, SkeletonLoaderComponent, CopCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './metricas.component.html',
})
export class AdminMetricasComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastService);

  protected readonly dias = signal(30);
  protected readonly m = signal<MetricasAdmin | null>(null);
  protected readonly trp = signal<MetricasRendimiento | null>(null);
  protected readonly cargando = signal(true);

  protected readonly serie = computed<ChartConfiguration<'bar'>['data']>(() => {
    const s = this.m()?.series ?? [];
    return {
      labels: s.map((x) => x.mes),
      datasets: [
        { label: 'Solicitudes', data: s.map((x) => x.solicitudes), backgroundColor: '#E67E22', borderRadius: 4 },
        { label: 'Entregas', data: s.map((x) => x.entregas), backgroundColor: '#27AE60', borderRadius: 4 },
      ],
    };
  });
  protected readonly valor = computed<ChartConfiguration<'line'>['data']>(() => {
    const s = this.m()?.series ?? [];
    return {
      labels: s.map((x) => x.mes),
      datasets: [{ label: 'Valor donado (COP)', data: s.map((x) => x.valorDonadoCop), borderColor: '#C0392B', backgroundColor: '#C0392B22', fill: true, tension: .3 }],
    };
  });
  protected readonly categorias = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const c = this.m()?.topCategorias ?? [];
    return { labels: c.map((x) => x.nombre), datasets: [{ data: c.map((x) => x.entregas), backgroundColor: c.map((x) => x.colorHex) }] };
  });

  protected readonly opcionesBarras: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };
  protected readonly opcionesLinea: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => `$${Number(v).toLocaleString('es-CO')}` } } },
  };
  protected readonly opcionesDona: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } },
  };

  ngOnInit(): void { this.cargar(); }

  cambiarDias(d: number): void { this.dias.set(Number(d)); this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    forkJoin({
      metricas: this.api.metricas(this.dias()).pipe(catchError(() => of(null))),
      rendimiento: this.api.rendimiento().pipe(catchError(() => of(null))),
    }).subscribe(({ metricas, rendimiento }) => {
      this.m.set(metricas?.data ?? null);
      this.trp.set(rendimiento?.data ?? null);
      this.cargando.set(false);
    });
  }

  exportar(tipo: 'solicitudes' | 'usuarios' | 'eventos'): void {
    this.api.exportar(tipo).subscribe({
      next: (r) => descargarArchivo(r.body!, nombreArchivo(r.headers.get('Content-Disposition'), `${tipo}.csv`)),
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }
}
