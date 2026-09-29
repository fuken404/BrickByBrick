import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MensajeDirecto, Notificacion } from '../models';
import { NotificationApiService } from '../services/notification-api.service';
import { MensajeApiService } from '../services/mensaje-api.service';
import { RealtimeService } from '../services/realtime.service';
import { ToastService } from '../services/toast.service';
import { AuthStore } from '../auth/auth.store';

/** Contadores de notificaciones y mensajes, alimentados en tiempo real. */
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly api = inject(NotificationApiService);
  private readonly mensajesApi = inject(MensajeApiService);
  private readonly realtime = inject(RealtimeService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);

  readonly noLeidas = signal(0);
  readonly mensajesNoLeidos = signal(0);
  /** Conversación abierta en pantalla (no se cuentan sus mensajes como no leídos). */
  readonly conversacionAbierta = signal<string | null>(null);

  private subs: Subscription[] = [];

  iniciar(): void {
    this.detener();
    this.realtime.conectar();
    this.recargar();
    this.subs = [
      this.realtime.on<Notificacion>('notification').subscribe((n) => {
        this.noLeidas.update((v) => v + 1);
        if (n.tipo === 'mensaje_nuevo' && this.router.url.includes('/mensajes')) return;
        this.toast.info(n.titulo, n.urlDestino ? 'Ver' : undefined, n.urlDestino ? () => this.router.navigateByUrl(n.urlDestino!) : undefined);
      }),
      this.realtime.on<MensajeDirecto>('dm:mensaje').subscribe((m) => {
        const propio = m.autorId === this.auth.user()?.id;
        if (!propio && m.conversacionId !== this.conversacionAbierta()) this.mensajesNoLeidos.update((v) => v + 1);
      }),
      this.realtime.on<{ conversacionId: string }>('dm:leido').subscribe(() => this.recargarMensajes()),
    ];
  }

  detener(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
    this.realtime.desconectar();
    this.noLeidas.set(0);
    this.mensajesNoLeidos.set(0);
  }

  recargar(): void {
    this.api.noLeidas().subscribe({ next: (r) => this.noLeidas.set(r.data.noLeidas), error: () => undefined });
    this.recargarMensajes();
  }

  recargarMensajes(): void {
    this.mensajesApi.noLeidos().subscribe({ next: (r) => this.mensajesNoLeidos.set(r.data.total), error: () => undefined });
  }

  descontar(n = 1): void {
    this.noLeidas.update((v) => Math.max(0, v - n));
  }
}
