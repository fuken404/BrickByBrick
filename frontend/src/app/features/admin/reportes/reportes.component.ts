import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

interface ReporteData {
  totalMaterialesDonados: number;
  familiasBeneficiadas:   number;
  tasaAprobacion:         number;
  constructorasActivasMes: number;
  valorTotalCop:          number;
  impactoTributario:      number;
}

@Component({
  selector: 'app-admin-reportes',
  standalone: true,
  imports: [CommonModule, MatIconModule, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1 class="page-title">Reportes e indicadores</h1>
      <p class="page-subtitle">Análisis del impacto social y operativo de la plataforma.</p>

      @if (loading()) {
        <app-skeleton-loader type="card" [count]="6" />
      } @else {
        <div class="reports-grid">
          <div class="report-card card">
            <div class="report-icon" style="background:rgba(192,57,43,.1)">
              <mat-icon style="color:#C0392B">inventory_2</mat-icon>
            </div>
            <div class="report-title">Total materiales donados</div>
            <div class="report-desc">Acumulado histórico de solicitudes entregadas</div>
            <div class="report-value">{{ data().totalMaterialesDonados | number:'1.0-0' }} <span class="report-unit">unidades</span></div>
          </div>

          <div class="report-card card">
            <div class="report-icon" style="background:rgba(39,174,96,.1)">
              <mat-icon style="color:#27AE60">attach_money</mat-icon>
            </div>
            <div class="report-title">Valor total estimado COP</div>
            <div class="report-desc">Estimado comercial de todas las donaciones</div>
            <div class="report-value">{{ data().valorTotalCop | number:'1.0-0' }} <span class="report-unit">COP</span></div>
            <div class="report-badge">Próximamente</div>
          </div>

          <div class="report-card card">
            <div class="report-icon" style="background:rgba(46,134,171,.1)">
              <mat-icon style="color:#2E86AB">family_restroom</mat-icon>
            </div>
            <div class="report-title">Familias beneficiadas</div>
            <div class="report-desc">Beneficiarios con al menos una solicitud entregada</div>
            <div class="report-value">{{ data().familiasBeneficiadas | number:'1.0-0' }} <span class="report-unit">familias</span></div>
          </div>

          <div class="report-card card">
            <div class="report-icon" style="background:rgba(230,126,34,.1)">
              <mat-icon style="color:#E67E22">percent</mat-icon>
            </div>
            <div class="report-title">Tasa de aprobación</div>
            <div class="report-desc">Solicitudes aprobadas o entregadas vs total</div>
            <div class="report-value">{{ data().tasaAprobacion }}<span class="report-unit"> %</span></div>
          </div>

          <div class="report-card card">
            <div class="report-icon" style="background:rgba(46,134,171,.1)">
              <mat-icon style="color:#2E86AB">business</mat-icon>
            </div>
            <div class="report-title">Constructoras activas este mes</div>
            <div class="report-desc">Con al menos un material publicado este mes</div>
            <div class="report-value">{{ data().constructorasActivasMes | number:'1.0-0' }} <span class="report-unit">empresas</span></div>
          </div>

          <div class="report-card card">
            <div class="report-icon" style="background:rgba(142,68,173,.1)">
              <mat-icon style="color:#8E44AD">gavel</mat-icon>
            </div>
            <div class="report-title">Impacto tributario total</div>
            <div class="report-desc">Suma de deducciones Art. 255 generadas</div>
            <div class="report-value">{{ data().impactoTributario | number:'1.0-0' }} <span class="report-unit">COP</span></div>
            <div class="report-badge">Próximamente</div>
          </div>
        </div>
      }

      <div class="export-card card">
        <mat-icon>download</mat-icon>
        <div>
          <div class="export-title">Exportación de datos</div>
          <div class="export-desc">Exporta en formato CSV o PDF los datos de beneficiarios, donaciones, materiales y certificados tributarios.</div>
        </div>
        <button class="btn btn-ghost btn-sm" disabled>Próximamente</button>
      </div>
    </div>
  `,
  styleUrl: './reportes.component.scss',
})
export class AdminReportesComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly loading = signal(true);
  readonly data    = signal<ReporteData>({
    totalMaterialesDonados:  0,
    familiasBeneficiadas:    0,
    tasaAprobacion:          0,
    constructorasActivasMes: 0,
    valorTotalCop:           0,
    impactoTributario:       0,
  });

  ngOnInit() {
    this.http.get<ApiResponse<ReporteData>>(`${environment.services.users}/admin/reportes`).subscribe({
      next: r => { this.data.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
