import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import { DashboardAdmin, ApiResponse } from '../../../core/models';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, KpiCardComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <div class="page-header">
        <p class="dashboard-eyebrow">UNA VISIÓN COMPLETA DEL IMPACTO</p>
          <h1 class="page-title">Panel de administración</h1>
        <p class="page-subtitle">Resumen general de la plataforma BrickByBrick</p>
      </div>

      @if (loading()) {
        <app-skeleton-loader type="card" [count]="8" />
      } @else if (stats()) {
        <div class="kpi-section">
          <h2 class="kpi-section-title">Usuarios</h2>
          <div class="kpi-grid">
            <app-kpi-card label="Beneficiarios" [value]="stats()!.totalBeneficiarios" icon="people" iconColor="#AD5138" iconBg="rgba(173,81,56,.1)" />
            <app-kpi-card label="Constructoras" [value]="stats()!.totalConstructoras" icon="business" iconColor="#48635A" iconBg="rgba(72,99,90,.1)" />
            <app-kpi-card label="Verificadas" [value]="stats()!.constructorasVerificadas" icon="verified" iconColor="#38745B" iconBg="rgba(56,116,91,.1)" />
          </div>
        </div>

        <div class="kpi-section">
          <h2 class="kpi-section-title">Materiales y solicitudes</h2>
          <div class="kpi-grid kpi-4">
            <app-kpi-card label="Materiales activos" [value]="stats()!.materialesActivos" icon="inventory_2" iconColor="#AD5138" iconBg="rgba(173,81,56,.1)" />
            <app-kpi-card label="Total materiales" [value]="stats()!.totalMateriales" icon="layers" iconColor="#6B6B6B" iconBg="rgba(107,107,107,.1)" />
            <app-kpi-card label="Solicitudes totales" [value]="stats()!.totalSolicitudes" icon="pending_actions" iconColor="#996923" iconBg="rgba(153,105,35,.1)" />
            <app-kpi-card label="Entregados" [value]="stats()!.solicitudesCompletadas" icon="check_circle" iconColor="#38745B" iconBg="rgba(56,116,91,.1)" />
          </div>
        </div>

        <div class="kpi-section">
          <h2 class="kpi-section-title">Comunidad y eventos</h2>
          <div class="kpi-grid kpi-4">
            <app-kpi-card label="Eventos activos" [value]="stats()!.eventosActivos" icon="event" iconColor="#48635A" iconBg="rgba(72,99,90,.1)" />
            <app-kpi-card label="Publicaciones" [value]="stats()!.publicacionesActivas" icon="feed" iconColor="#716453" iconBg="rgba(113,100,83,.1)" />
            <app-kpi-card label="Reportes pendientes" [value]="stats()!.reportesPendientes" icon="flag" iconColor="#B53F36" iconBg="rgba(231,76,60,.1)" />
            <app-kpi-card label="Valor donaciones" [value]="stats()!.valorTotalDonacionesCop" unit="COP" icon="attach_money" iconColor="#38745B" iconBg="rgba(56,116,91,.1)" />
          </div>
        </div>

        <div class="quick-section">
          <h2 class="kpi-section-title">Accesos rápidos</h2>
          <div class="quick-grid">
            @for (q of quickLinks; track q.path) {
              <a [routerLink]="q.path" class="quick-card card">
                <div class="quick-icon" [style.background]="q.color + '15'">
                  <mat-icon [style.color]="q.color">{{ q.icon }}</mat-icon>
                </div>
                <span class="quick-label">{{ q.label }}</span>
                <mat-icon class="quick-arrow">chevron_right</mat-icon>
              </a>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly stats   = signal<DashboardAdmin | null>(null);
  readonly loading = signal(true);

  readonly quickLinks = [
    { path: '/admin/beneficiarios', label: 'Beneficiarios',  icon: 'people',          color: '#AD5138' },
    { path: '/admin/constructoras', label: 'Constructoras',  icon: 'business',         color: '#48635A' },
    { path: '/admin/materiales',    label: 'Materiales',     icon: 'inventory_2',      color: '#996923' },
    { path: '/admin/donaciones',    label: 'Solicitudes',    icon: 'pending_actions',  color: '#38745B' },
    { path: '/admin/eventos',       label: 'Eventos',        icon: 'event',            color: '#48635A' },
    { path: '/admin/publicaciones', label: 'Publicaciones',  icon: 'feed',             color: '#716453' },
    { path: '/admin/reportes',      label: 'Reportes',       icon: 'bar_chart',        color: '#AD5138' },
    { path: '/admin/configuracion', label: 'Configuración',  icon: 'settings',         color: '#6B6B6B' },
  ];

  ngOnInit() {
    this.http.get<ApiResponse<DashboardAdmin>>(`${environment.services.users}/admin/dashboard`).subscribe({
      next: r => { this.stats.set(r.data); this.loading.set(false); },
      error: () => {
        this.stats.set({
          totalBeneficiarios: 0, totalConstructoras: 0, constructorasVerificadas: 0,
          materialesActivos: 0, totalMateriales: 0, totalSolicitudes: 0, solicitudesCompletadas: 0,
          eventosActivos: 0, totalEventos: 0, publicacionesActivas: 0, reportesPendientes: 0,
          valorTotalDonacionesCop: 0,
        });
        this.loading.set(false);
      },
    });
  }
}
