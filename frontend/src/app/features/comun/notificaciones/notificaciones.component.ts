import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NotificationApiService } from '../../../core/services/notification-api.service';
import { NotificationStore } from '../../../core/stores/notification.store';
import { RealtimeService } from '../../../core/services/realtime.service';
import { Notificacion, TipoNotificacion } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { FechaRelativaPipe } from '../../../shared/pipes/fecha-relativa.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const ICONOS: Partial<Record<TipoNotificacion, { icon: string; color: string }>> = {
  material_nuevo: { icon: 'inventory_2', color: '#AD5138' },
  solicitud_nueva: { icon: 'assignment', color: '#996923' },
  solicitud_aprobada: { icon: 'check_circle', color: '#38745B' },
  solicitud_rechazada: { icon: 'cancel', color: '#B53F36' },
  solicitud_entregada: { icon: 'local_shipping', color: '#48635A' },
  solicitud_cancelada: { icon: 'block', color: '#687069' },
  recepcion_confirmada: { icon: 'task_alt', color: '#38745B' },
  evento_nuevo: { icon: 'event', color: '#48635A' },
  evento_inscripcion: { icon: 'event_available', color: '#48635A' },
  evento_cupos_bajos: { icon: 'warning', color: '#996923' },
  evento_cancelado: { icon: 'event_busy', color: '#B53F36' },
  evento_actualizado: { icon: 'update', color: '#996923' },
  comentario: { icon: 'comment', color: '#716453' },
  comentario_respuesta: { icon: 'reply', color: '#716453' },
  like: { icon: 'favorite', color: '#B53F36' },
  repost: { icon: 'repeat', color: '#38745B' },
  seguidor_nuevo: { icon: 'person_add', color: '#48635A' },
  mensaje_nuevo: { icon: 'chat', color: '#48635A' },
  grupo_invitacion: { icon: 'group_add', color: '#16A085' },
  grupo_solicitud: { icon: 'how_to_reg', color: '#16A085' },
  verificacion: { icon: 'verified', color: '#38745B' },
  documento_revisado: { icon: 'description', color: '#48635A' },
  reporte_resuelto: { icon: 'shield', color: '#687069' },
  material_vence: { icon: 'schedule', color: '#996923' },
  cuenta: { icon: 'manage_accounts', color: '#687069' },
};

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [DatePipe, MatIconModule, EmptyStateComponent, SkeletonLoaderComponent, FechaRelativaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" style="max-width:820px">
      <header class="page-header">
        <div>
          <h1 class="page-title">Notificaciones</h1>
          <p class="page-subtitle">{{ noLeidas() > 0 ? noLeidas() + ' sin leer' : 'Estás al día' }}</p>
        </div>
        <div class="actions">
          @if (noLeidas() > 0) { <button type="button" class="btn btn-sm btn-ghost" (click)="marcarTodas()"><mat-icon>done_all</mat-icon>Marcar todas como leídas</button> }
          <button type="button" class="btn btn-sm btn-ghost" (click)="limpiarLeidas()"><mat-icon>delete_sweep</mat-icon>Borrar leídas</button>
        </div>
      </header>
      <div class="chips">
        <button type="button" class="chip" [class.active]="!soloNoLeidas()" (click)="filtrar(false)">Todas</button>
        <button type="button" class="chip" [class.active]="soloNoLeidas()" (click)="filtrar(true)">Sin leer</button>
      </div>

      @if (cargando()) {
        <app-skeleton-loader type="list" [count]="6" />
      } @else if (!items().length) {
        <div class="card"><app-empty-state icon="notifications_none" title="Sin notificaciones" description="Aquí verás las novedades de tus solicitudes, eventos y comunidad." /></div>
      } @else {
        <ul class="list-card">
          @for (n of items(); track n.id) {
            <li class="list-item clickable notif" [class.unread]="!n.leida" (click)="abrir(n)" (keydown.enter)="abrir(n)" tabindex="0">
              <div class="notif-icon" [style.background]="icono(n).color + '18'" [style.color]="icono(n).color"><mat-icon>{{ icono(n).icon }}</mat-icon></div>
              <div class="grow">
                <div class="strong">{{ n.titulo }}</div>
                <div class="small muted">{{ n.mensaje }}</div>
                <div class="xsmall muted mt-4" [title]="n.createdAt | date:'medium'">{{ n.createdAt | fechaRelativa }}</div>
              </div>
              @if (!n.leida) { <span class="punto" aria-label="Sin leer"></span> }
              <button type="button" class="icon-btn danger" (click)="$event.stopPropagation(); eliminar(n)" aria-label="Eliminar notificación"><mat-icon>close</mat-icon></button>
            </li>
          }
        </ul>
        @if (hayMas()) { <div class="load-more"><button type="button" class="btn btn-ghost" (click)="cargar(true)">Cargar más</button></div> }
      }
    </div>
  `,
  styles: [`
    .notif.unread { background: rgba(173,81,56,.035); }
    .notif-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .punto { width: 9px; height: 9px; border-radius: 50%; background: var(--primary); margin-top: 6px; flex-shrink: 0; }
  `],
})
export class NotificacionesComponent implements OnInit {
  private readonly api = inject(NotificationApiService);
  private readonly contadores = inject(NotificationStore);
  private readonly router = inject(Router);

  protected readonly items = signal<Notificacion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  protected readonly noLeidas = signal(0);
  protected readonly soloNoLeidas = signal(false);
  private pagina = 1;

  constructor() {
    inject(RealtimeService).on<Notificacion>('notification').pipe(takeUntilDestroyed()).subscribe((n) => {
      this.items.update((l) => [n, ...l]);
      this.noLeidas.update((v) => v + 1);
    });
  }

  ngOnInit(): void { this.cargar(); }

  icono(n: Notificacion) { return ICONOS[n.tipo] ?? { icon: 'notifications', color: '#687069' }; }

  filtrar(v: boolean): void { this.soloNoLeidas.set(v); this.cargar(); }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    this.api.listar({ page: this.pagina, limit: 30, soloNoLeidas: this.soloNoLeidas() || undefined }).subscribe({
      next: (r) => {
        this.items.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.noLeidas.set(r.data.noLeidas);
        this.contadores.noLeidas.set(r.data.noLeidas);
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrir(n: Notificacion): void {
    if (!n.leida) {
      this.api.marcarLeida(n.id).subscribe(() => {
        this.items.update((l) => l.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
        this.noLeidas.update((v) => Math.max(0, v - 1));
        this.contadores.descontar();
      });
    }
    if (n.urlDestino) this.router.navigateByUrl(n.urlDestino);
  }

  marcarTodas(): void {
    this.api.marcarTodas().subscribe(() => {
      this.items.update((l) => l.map((x) => ({ ...x, leida: true })));
      this.noLeidas.set(0);
      this.contadores.noLeidas.set(0);
    });
  }

  eliminar(n: Notificacion): void {
    this.api.eliminar(n.id).subscribe(() => {
      this.items.update((l) => l.filter((x) => x.id !== n.id));
      if (!n.leida) { this.noLeidas.update((v) => Math.max(0, v - 1)); this.contadores.descontar(); }
    });
  }

  limpiarLeidas(): void {
    this.api.eliminarLeidas().subscribe(() => this.items.update((l) => l.filter((x) => !x.leida)));
  }
}
