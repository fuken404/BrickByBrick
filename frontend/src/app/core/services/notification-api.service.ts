import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Notificacion, PaginaNotificaciones, TipoNotificacion } from '../models';
import { toParams } from '../utils/http';

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notificaciones`;

  listar(filtros: { page?: number; limit?: number; soloNoLeidas?: boolean; tipo?: TipoNotificacion } = {}): Observable<ApiResponse<PaginaNotificaciones>> {
    return this.http.get<ApiResponse<PaginaNotificaciones>>(this.base, { params: toParams(filtros) });
  }

  noLeidas(): Observable<ApiResponse<{ noLeidas: number }>> {
    return this.http.get<ApiResponse<{ noLeidas: number }>>(`${this.base}/no-leidas`);
  }

  marcarLeida(id: string): Observable<ApiResponse<Notificacion>> {
    return this.http.patch<ApiResponse<Notificacion>>(`${this.base}/${id}/leer`, {});
  }

  marcarTodas(): Observable<ApiResponse<{ actualizadas: number }>> {
    return this.http.patch<ApiResponse<{ actualizadas: number }>>(`${this.base}/leer-todas`, {});
  }

  eliminar(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }

  eliminarLeidas(): Observable<ApiResponse<{ eliminadas: number }>> {
    return this.http.delete<ApiResponse<{ eliminadas: number }>>(`${this.base}/leidas`);
  }
}
