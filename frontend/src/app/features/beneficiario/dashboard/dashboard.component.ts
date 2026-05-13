import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { AuthStore } from '../../../core/auth/auth.store';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { EventApiService } from '../../../core/services/event-api.service';
import { Material, Evento, Beneficiario } from '../../../core/models';
import { MaterialCardComponent } from '../../../shared/components/material-card/material-card.component';
import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-beneficiario-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MaterialCardComponent, EventCardComponent, KpiCardComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <!-- Welcome header -->
      <div class="welcome-header">
        <div>
          <h1 class="page-title">Bienvenido, {{ nombreCorto() }}</h1>
          <p class="page-subtitle">Aquí tienes lo más reciente disponible para ti.</p>
        </div>
        <a routerLink="/beneficiario/materiales" class="btn btn-primary">
          <mat-icon>search</mat-icon> Buscar materiales
        </a>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <app-kpi-card
          label="Solicitudes activas"
          [value]="solicitudesActivas()"
          icon="pending_actions"
          iconColor="#2E86AB"
          iconBg="rgba(46,134,171,.1)"
        />
        <app-kpi-card
          label="Materiales recibidos"
          [value]="materialesRecibidos()"
          icon="check_circle"
          iconColor="#27AE60"
          iconBg="rgba(39,174,96,.1)"
        />
        <app-kpi-card
          label="Eventos inscritos"
          [value]="eventosInscritos()"
          icon="event"
          iconColor="#E67E22"
          iconBg="rgba(230,126,34,.1)"
        />
        <app-kpi-card
          label="Materiales disponibles"
          [value]="totalMateriales()"
          icon="inventory_2"
          iconColor="#C0392B"
          iconBg="rgba(192,57,43,.1)"
        />
      </div>

      <!-- Materiales recientes -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Materiales disponibles</h2>
          <a routerLink="/beneficiario/materiales" class="btn-link">Ver todos <mat-icon>chevron_right</mat-icon></a>
        </div>
        @if (loadingMateriales()) {
          <app-skeleton-loader type="card" [count]="4" />
        } @else if (materiales().length === 0) {
          <div class="empty-msg">No hay materiales disponibles en este momento.</div>
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
          <h2 class="section-title">Próximos eventos</h2>
          <a routerLink="/beneficiario/eventos" class="btn-link">Ver todos <mat-icon>chevron_right</mat-icon></a>
        </div>
        @if (loadingEventos()) {
          <app-skeleton-loader type="card" [count]="2" />
        } @else if (eventos().length === 0) {
          <div class="empty-msg">No hay eventos próximos.</div>
        } @else {
          <div class="events-grid">
            @for (e of eventos(); track e.id) {
              <app-event-card [evento]="e" [inscrito]="false" (clicked)="irAEvento($event)" />
            }
          </div>
        }
      </section>
    </div>
  `,
  styleUrl: './dashboard.component.scss',
})
export class BeneficiarioDashboardComponent implements OnInit {
  private readonly auth     = inject(AuthStore);
  private readonly matSvc   = inject(MaterialApiService);
  private readonly eventSvc = inject(EventApiService);

  readonly materiales         = signal<Material[]>([]);
  readonly eventos            = signal<Evento[]>([]);
  readonly loadingMateriales  = signal(true);
  readonly loadingEventos     = signal(true);
  readonly solicitudesActivas = signal(0);
  readonly materialesRecibidos= signal(0);
  readonly eventosInscritos   = signal(0);
  readonly totalMateriales    = signal(0);

  nombreCorto() {
    const perfil = this.auth.perfil() as Beneficiario | null;
    if (perfil?.nombreCompleto) return perfil.nombreCompleto.split(' ')[0];
    return this.auth.userEmail().split('@')[0];
  }

  ngOnInit() {
    this.matSvc.getAll({ limit: 8, page: 1 }).subscribe({
      next: r => {
        this.materiales.set(r.data.items);
        this.totalMateriales.set(r.data.total);
        this.loadingMateriales.set(false);
      },
      error: () => this.loadingMateriales.set(false),
    });

    this.eventSvc.getAll({ estado: 'publicado', limit: 4 }).subscribe({
      next: r => {
        this.eventos.set(r.data.items);
        this.loadingEventos.set(false);
      },
      error: () => this.loadingEventos.set(false),
    });
  }

  irAMaterial(m: Material) {
    window.location.href = `/beneficiario/materiales/${m.id}`;
  }

  irAEvento(e: Evento) {
    window.location.href = `/beneficiario/eventos`;
  }
}
