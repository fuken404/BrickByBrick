import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TributarioApiService } from '../../../core/services/tributario-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Constancia, ResumenTributario } from '../../../core/models';
import { descargarArchivo, mensajeError, nombreArchivo } from '../../../core/utils/http';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
  selector: 'app-tributario',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, FormsModule, MatIconModule, BaseChartDirective, KpiCardComponent, EmptyStateComponent, SkeletonLoaderComponent, CopCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tributario.component.html',
  styles: [`
    .req { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); }
    .req:last-child { border-bottom: none; }
    .req mat-icon.ok { color: var(--accent); } .req mat-icon.no { color: #996923; }
    .chart { position: relative; height: 260px; }
  `],
})
export class TributarioComponent implements OnInit {
  private readonly api = inject(TributarioApiService);
  private readonly toast = inject(ToastService);

  protected readonly anios = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);
  protected readonly anio = signal(new Date().getFullYear());
  protected readonly resumen = signal<ResumenTributario | null>(null);
  protected readonly constancias = signal<Constancia[]>([]);
  protected readonly cargando = signal(true);
  protected readonly descargando = signal<string | null>(null);
  protected impuesto: number | null = null;
  private readonly impuesto$ = new Subject<void>();

  protected readonly grafica = computed<ChartConfiguration<'bar'>['data']>(() => {
    const r = this.resumen();
    const porMes = new Map((r?.porMes ?? []).map((m) => [m.mes, m.valorDonadoCop]));
    return {
      labels: MESES,
      datasets: [{ label: 'Valor donado (COP)', data: MESES.map((_, i) => porMes.get(i + 1) ?? 0), backgroundColor: '#AD5138', borderRadius: 6 }],
    };
  });
  protected readonly opciones: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { ticks: { callback: (v) => `$${Number(v).toLocaleString('es-CO')}` } } },
  };
  protected readonly requisitosOk = computed(() => {
    const q = this.resumen()?.requisitos;
    return !!q && q.empresaVerificada && q.rutAprobado && q.camaraComercioAprobada && q.tieneEntregas && q.materialesSinValor === 0;
  });

  constructor() {
    this.impuesto$.pipe(debounceTime(500), takeUntilDestroyed()).subscribe(() => this.cargarResumen());
  }

  ngOnInit(): void { this.cargar(); }

  cambiarAnio(anio: number): void { this.anio.set(Number(anio)); this.cargar(); }

  impuestoCambiado(): void { this.impuesto$.next(); }

  private cargar(): void {
    this.cargando.set(true);
    this.cargarResumen();
    this.api.constancias(this.anio()).subscribe({ next: (r) => this.constancias.set(r.data), error: () => this.constancias.set([]) });
  }

  private cargarResumen(): void {
    const impuesto = this.impuesto && this.impuesto > 0 ? this.impuesto : null;
    this.api.resumen(this.anio(), impuesto).subscribe({
      next: (r) => { this.resumen.set(r.data); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.toast.error(mensajeError(e)); },
    });
  }

  constancia(c: Constancia): void {
    this.descargando.set(c.id);
    this.api.constanciaPdf(c.id).subscribe({
      next: (r) => { this.descargando.set(null); descargarArchivo(r.body!, nombreArchivo(r.headers.get('Content-Disposition'), `constancia-${c.numeroConstancia}.pdf`)); },
      error: (e) => { this.descargando.set(null); this.toast.error(mensajeError(e)); },
    });
  }

  certificado(): void {
    this.descargando.set('certificado');
    this.api.certificadoPdf(this.anio()).subscribe({
      next: (r) => { this.descargando.set(null); descargarArchivo(r.body!, nombreArchivo(r.headers.get('Content-Disposition'), `resumen-donaciones-${this.anio()}.pdf`)); },
      error: (e) => { this.descargando.set(null); this.toast.error(mensajeError(e)); },
    });
  }
}
