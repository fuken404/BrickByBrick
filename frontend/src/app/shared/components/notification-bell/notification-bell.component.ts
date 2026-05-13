import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { FechaRelativaPipe } from '../../pipes/fecha-relativa.pipe';
import { AuthStore } from '../../../core/auth/auth.store';
import { Notificacion } from '../../../core/models';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatBadgeModule, RouterLink, ClickOutsideDirective, FechaRelativaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notif-wrapper" (clickOutside)="open.set(false)">
      <button class="bell-btn"
              [matBadge]="unreadCount() > 0 ? (unreadCount() > 99 ? '99+' : unreadCount()) : null"
              matBadgeColor="warn" matBadgeSize="small"
              (click)="toggle()" [attr.aria-label]="'Notificaciones, ' + unreadCount() + ' sin leer'">
        <mat-icon>notifications</mat-icon>
      </button>

      @if (open()) {
        <div class="notif-dropdown">
          <div class="notif-dropdown-header">
            <span>Notificaciones</span>
            @if (unreadCount() > 0) {
              <button class="btn-text" (click)="markAllRead()">Marcar todas como leídas</button>
            }
          </div>

          @if (loading()) {
            <div class="notif-empty">
              <mat-icon>hourglass_empty</mat-icon>
              <p>Cargando...</p>
            </div>
          } @else if (notifs().length === 0) {
            <div class="notif-empty">
              <mat-icon>notifications_none</mat-icon>
              <p>Sin notificaciones</p>
            </div>
          } @else {
            <div class="notif-list">
              @for (n of notifs(); track n.id) {
                <div class="notif-item" [class.unread]="!n.leida" (click)="onNotifClick(n.id)">
                  <div class="notif-dot" [class.visible]="!n.leida"></div>
                  <div class="notif-content">
                    <p class="notif-msg">{{ n.mensaje }}</p>
                    <span class="notif-time">{{ n.createdAt | fechaRelativa }}</span>
                  </div>
                </div>
              }
            </div>
            <div class="notif-footer">
              <a [routerLink]="notifRoute" (click)="open.set(false)">Ver todas</a>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent {
  private readonly notifSvc: NotificationService = inject(NotificationService);
  private readonly auth = inject(AuthStore);

  protected readonly unreadCount = this.notifSvc.unreadCount;
  protected readonly notifs = signal<Notificacion[]>([]);
  protected readonly loading = signal(false);
  protected readonly open = signal(false);

  get notifRoute(): string {
    const rol = this.auth.rol();
    return rol === 'BENEFICIARIO' ? '/beneficiario/notificaciones' : '/empresa/notificaciones';
  }

  toggle(): void {
    const opening = !this.open();
    this.open.set(opening);
    if (opening && this.notifs().length === 0) this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.notifSvc.getAll({ limit: 10 }).subscribe({
      next: res => {
        this.notifs.set(res.data.items);
        this.notifSvc.setUnreadCount(res.data.noLeidas);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  markAllRead(): void {
    this.notifSvc.marcarTodasLeidas().subscribe({
      next: () => {
        this.notifs.update(list => list.map(n => ({ ...n, leida: true })));
        this.notifSvc.setUnreadCount(0);
      },
    });
  }

  onNotifClick(id: string): void {
    this.notifSvc.marcarLeida(id).subscribe({
      next: () => {
        this.notifs.update(list => list.map(n => n.id === id ? { ...n, leida: true } : n));
        this.notifSvc.setUnreadCount(Math.max(0, this.unreadCount() - 1));
      },
    });
    this.open.set(false);
  }
}
