import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { NotificationService } from '../../../core/services/notification.service';
import { Notificacion, TipoNotificacion } from '../../../core/models';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

const TIPO_CONFIG: Record<TipoNotificacion, { icon: string; color: string }> = {
  material_nuevo:        { icon: 'inventory_2',     color: '#C0392B' },
  solicitud_aprobada:    { icon: 'check_circle',    color: '#27AE60' },
  solicitud_rechazada:   { icon: 'cancel',          color: '#E74C3C' },
  solicitud_entregada:   { icon: 'local_shipping',  color: '#27AE60' },
  evento_inscripcion:    { icon: 'event_available', color: '#2E86AB' },
  evento_cupos_bajos:    { icon: 'warning',         color: '#E67E22' },
  comentario:            { icon: 'comment',         color: '#8E44AD' },
  like:                  { icon: 'favorite',        color: '#E74C3C' },
  grupo_invitacion:      { icon: 'group_add',       color: '#2E86AB' },
  verificacion:          { icon: 'verified',        color: '#27AE60' },
  material_vence:        { icon: 'schedule',        color: '#E67E22' },
};

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, MatIconModule, SkeletonLoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Notificaciones</h1>
          <p class="page-subtitle">
            @if (noLeidas() > 0) {
              {{ noLeidas() }} sin leer
            } @else {
              Todo al día
            }
          </p>
        </div>
        @if (noLeidas() > 0) {
          <button class="btn btn-ghost btn-sm" (click)="marcarTodas()">
            <mat-icon>done_all</mat-icon> Marcar todas como leídas
          </button>
        }
      </div>

      @if (loading()) {
        <app-skeleton-loader type="list" [count]="6" />
      } @else if (notifs().length === 0) {
        <app-empty-state
          icon="notifications_none"
          title="Sin notificaciones"
          description="No tienes notificaciones por el momento."
        />
      } @else {
        <div class="notifs-list">
          @for (n of notifs(); track n.id) {
            <div class="notif-item" [class.unread]="!n.leida" (click)="marcarLeida(n)">
              <div class="notif-icon" [style.background]="tipoConfig(n.tipo).color + '15'" [style.color]="tipoConfig(n.tipo).color">
                <mat-icon>{{ tipoConfig(n.tipo).icon }}</mat-icon>
              </div>
              <div class="notif-content">
                <div class="notif-titulo">{{ n.titulo }}</div>
                <div class="notif-mensaje">{{ n.mensaje }}</div>
                <div class="notif-fecha">{{ n.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
              </div>
              @if (!n.leida) {
                <div class="unread-dot"></div>
              }
              <button class="del-btn" (click)="$event.stopPropagation(); eliminar(n.id)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './notificaciones.component.scss',
})
export class NotificacionesComponent implements OnInit {
  private readonly notifSvc = inject(NotificationService);

  readonly notifs   = signal<Notificacion[]>([]);
  readonly loading  = signal(true);
  readonly noLeidas = signal(0);

  tipoConfig(t: TipoNotificacion) {
    return TIPO_CONFIG[t] ?? { icon: 'notifications', color: '#6B6B6B' };
  }

  ngOnInit() {
    this.notifSvc.getAll({ limit: 50 }).subscribe({
      next: r => {
        this.notifs.set(r.data.items);
        this.noLeidas.set(r.data.noLeidas);
        this.notifSvc.setUnreadCount(r.data.noLeidas);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  marcarLeida(n: Notificacion) {
    if (n.leida) return;
    this.notifSvc.marcarLeida(n.id).subscribe({
      next: () => {
        this.notifs.update(list => list.map(x => x.id === n.id ? { ...x, leida: true } : x));
        this.noLeidas.update(c => Math.max(0, c - 1));
        this.notifSvc.setUnreadCount(Math.max(0, this.noLeidas() - 1));
      },
    });
  }

  marcarTodas() {
    this.notifSvc.marcarTodasLeidas().subscribe({
      next: () => {
        this.notifs.update(list => list.map(x => ({ ...x, leida: true })));
        this.noLeidas.set(0);
        this.notifSvc.setUnreadCount(0);
      },
    });
  }

  eliminar(id: string) {
    this.notifSvc.delete(id).subscribe({
      next: () => this.notifs.update(list => list.filter(x => x.id !== id)),
    });
  }
}
