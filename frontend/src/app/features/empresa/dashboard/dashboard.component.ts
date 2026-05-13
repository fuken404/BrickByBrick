import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { AuthStore } from '../../../core/auth/auth.store';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { EventApiService } from '../../../core/services/event-api.service';
import { Material, Evento, Constructora } from '../../../core/models';
import { MaterialCardComponent } from '../../../shared/components/material-card/material-card.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-empresa-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MaterialCardComponent, KpiCardComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <div class="welcome-header">
        <div>
          <h1 class="page-title">Panel de empresa</h1>
          <p class="page-subtitle">{{ razonSocial() }}</p>
        </div>
        <div class="header-actions">
          <a routerLink="/empresa/materiales/nuevo" class="btn btn-primary">
            <mat-icon>add</mat-icon> Publicar material
          </a>
          <a routerLink="/empresa/eventos/nuevo" class="btn btn-secondary">
            <mat-icon>event</mat-icon> Crear evento
          </a>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <app-kpi-card
          label="Materiales activos"
          [value]="materialesActivos()"
          icon="inventory_2"
          iconColor="#C0392B"
          iconBg="rgba(192,57,43,.1)"
        />
        <app-kpi-card
          label="Solicitudes pendientes"
          [value]="solicitudesPendientes()"
          icon="pending_actions"
          iconColor="#E67E22"
          iconBg="rgba(230,126,34,.1)"
        />
        <app-kpi-card
          label="Materiales entregados"
          [value]="entregados()"
          icon="check_circle"
          iconColor="#27AE60"
          iconBg="rgba(39,174,96,.1)"
        />
        <app-kpi-card
          label="Eventos activos"
          [value]="eventosActivos()"
          icon="event"
          iconColor="#2E86AB"
          iconBg="rgba(46,134,171,.1)"
        />
      </div>

      <!-- Mis últimos materiales -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Mis materiales publicados</h2>
          <a routerLink="/empresa/materiales" class="btn-link">Ver todos <mat-icon>chevron_right</mat-icon></a>
        </div>
        @if (loadingMateriales()) {
          <app-skeleton-loader type="card" [count]="4" />
        } @else if (materiales().length === 0) {
          <div class="empty-msg">
            <mat-icon>inventory_2</mat-icon>
            <p>No tienes materiales publicados aún.</p>
            <a routerLink="/empresa/materiales/nuevo" class="btn btn-primary btn-sm">Publicar primer material</a>
          </div>
        } @else {
          <div class="cards-grid">
            @for (m of materiales(); track m.id) {
              <app-material-card [material]="m" (clicked)="irAMaterial($event)" />
            }
          </div>
        }
      </section>

      <!-- Próximos eventos -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Mis eventos</h2>
          <a routerLink="/empresa/eventos" class="btn-link">Ver todos <mat-icon>chevron_right</mat-icon></a>
        </div>
        @if (loadingEventos()) {
          <app-skeleton-loader type="list" [count]="3" />
        } @else if (eventos().length === 0) {
          <div class="empty-msg">
            <mat-icon>event_busy</mat-icon>
            <p>No tienes eventos creados.</p>
          </div>
        } @else {
          <div class="eventos-list">
            @for (e of eventos(); track e.id) {
              <div class="evento-row card">
                <div class="evento-tipo tipo-{{ e.tipoEvento }}">
                  <mat-icon>event</mat-icon>
                </div>
                <div class="evento-info">
                  <div class="evento-nombre">{{ e.nombre }}</div>
                  <div class="evento-meta">
                    {{ e.fechaInicio | date:'dd/MM/yyyy' }}
                    @if (e.direccion) { · {{ e.direccion }} }
                    · {{ e._count.inscripciones }} inscritos
                  </div>
                </div>
                <div class="evento-estado">
                  <span class="estado-pill estado-{{ e.estado }}">{{ e.estado }}</span>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- Tax callout -->
      @if (!verificada()) {
        <div class="alert-card">
          <mat-icon>info</mat-icon>
          <div>
            <div class="alert-title">Completa la verificación de tu empresa</div>
            <div class="alert-desc">Para generar certificados tributarios y acceder al Art. 255, necesitas que un administrador verifique tu empresa.</div>
          </div>
          <a routerLink="/empresa/perfil" class="btn btn-ghost btn-sm">Ver perfil</a>
        </div>
      }
    </div>
  `,
  styleUrl: './dashboard.component.scss',
})
export class EmpresaDashboardComponent implements OnInit {
  private readonly auth     = inject(AuthStore);
  private readonly matSvc   = inject(MaterialApiService);
  private readonly eventSvc = inject(EventApiService);

  readonly materiales          = signal<Material[]>([]);
  readonly eventos             = signal<Evento[]>([]);
  readonly loadingMateriales   = signal(true);
  readonly loadingEventos      = signal(true);
  readonly materialesActivos   = signal(0);
  readonly solicitudesPendientes= signal(0);
  readonly entregados          = signal(0);
  readonly eventosActivos      = signal(0);

  razonSocial() {
    const p = this.auth.perfil() as Constructora | null;
    return p?.razonSocial ?? '';
  }

  verificada() {
    const p = this.auth.perfil() as Constructora | null;
    return p?.verificada ?? false;
  }

  ngOnInit() {
    // Materiales propios (grid + KPI): fetch all, count active client-side
    this.matSvc.getMisMateriales({ limit: 100 }).subscribe({
      next: r => {
        const items = r.data.items;
        const activos = items.filter((m: Material) => m.estadoPublicacion === 'activo');
        this.materiales.set(activos.slice(0, 8));
        this.materialesActivos.set(activos.length);
        this.loadingMateriales.set(false);
      },
      error: () => this.loadingMateriales.set(false),
    });

    // Solicitudes recibidas — contar pendientes y entregadas
    this.matSvc.getSolicitudesRecibidas({ limit: 200 }).subscribe({
      next: r => {
        const items = r.data.items;
        this.solicitudesPendientes.set(items.filter(s => s.estado === 'pendiente').length);
        this.entregados.set(items.filter(s => s.estado === 'entregada').length);
      },
    });

    // Eventos propios
    this.eventSvc.getMisEventos({ limit: 5 }).subscribe({
      next: r => {
        this.eventos.set(r.data.items);
        this.eventosActivos.set(r.data.items.filter(e => e.estado === 'publicado').length);
        this.loadingEventos.set(false);
      },
      error: () => this.loadingEventos.set(false),
    });
  }

  irAMaterial(m: Material) {
    window.location.href = `/empresa/materiales/${m.id}/editar`;
  }
}
