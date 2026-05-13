import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Notificacion } from '../models';
import { AuthStore } from '../auth/auth.store';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http   = inject(HttpClient);
  private readonly auth   = inject(AuthStore);
  private readonly base   = `${environment.services.notif}/notificaciones`;

  private socket: Socket | null = null;

  /** Signal reactivo con el contador de no leídas */
  readonly unreadCount = signal(0);

  // --- WebSocket ---

  connect(): void {
    if (this.socket?.connected) return;
    const token = this.auth.accessToken();
    if (!token) return;

    this.socket = io(environment.wsUrl, {
      path:           environment.wsPath,
      auth:           { token },
      reconnection:   true,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => console.log('WS conectado'));
    this.socket.on('disconnect', () => console.log('WS desconectado'));
    this.socket.on('notification', (notif: Notificacion) => {
      this.unreadCount.update(n => n + 1);
      // El store de notificaciones puede escuchar esto via emit
      this.onNotification?.(notif);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  /** Callback opcional para que los componentes reciban notificaciones en tiempo real */
  onNotification?: (notif: Notificacion) => void;

  // --- HTTP ---

  getAll(params?: { page?: number; limit?: number; soloNoLeidas?: boolean }):
    Observable<ApiResponse<PaginatedResponse<Notificacion> & { noLeidas: number }>> {
    return this.http.get<ApiResponse<PaginatedResponse<Notificacion> & { noLeidas: number }>>(this.base, { params: params as Record<string, string> });
  }

  marcarLeida(id: string): Observable<ApiResponse<Notificacion>> {
    return this.http.patch<ApiResponse<Notificacion>>(`${this.base}/${id}/leer`, {});
  }

  marcarTodasLeidas(): Observable<ApiResponse<{ actualizadas: number }>> {
    return this.http.patch<ApiResponse<{ actualizadas: number }>>(`${this.base}/leer-todas`, {});
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }

  setUnreadCount(count: number): void {
    this.unreadCount.set(count);
  }
}
