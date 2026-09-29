import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Conversacion, MensajeDirecto, PaginaCursor, UsuarioPublico } from '../models';
import { toParams } from '../utils/http';

@Injectable({ providedIn: 'root' })
export class MensajeApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/conversaciones`;

  conversaciones(): Observable<ApiResponse<Conversacion[]>> {
    return this.http.get<ApiResponse<Conversacion[]>>(this.base);
  }

  noLeidos(): Observable<ApiResponse<{ total: number }>> {
    return this.http.get<ApiResponse<{ total: number }>>(`${this.base}/no-leidos`);
  }

  abrir(usuarioId: string): Observable<ApiResponse<Conversacion>> {
    return this.http.post<ApiResponse<Conversacion>>(this.base, { usuarioId });
  }

  obtener(id: string): Observable<ApiResponse<{ id: string; otroUsuario: UsuarioPublico }>> {
    return this.http.get<ApiResponse<{ id: string; otroUsuario: UsuarioPublico }>>(`${this.base}/${id}`);
  }

  mensajes(id: string, antes?: string): Observable<ApiResponse<PaginaCursor<MensajeDirecto>>> {
    return this.http.get<ApiResponse<PaginaCursor<MensajeDirecto>>>(`${this.base}/${id}/mensajes`, { params: toParams({ antes }) });
  }

  enviar(id: string, contenido: string): Observable<ApiResponse<MensajeDirecto>> {
    return this.http.post<ApiResponse<MensajeDirecto>>(`${this.base}/${id}/mensajes`, { contenido });
  }

  marcarLeida(id: string): Observable<ApiResponse<{ marcados: number }>> {
    return this.http.patch<ApiResponse<{ marcados: number }>>(`${this.base}/${id}/leer`, {});
  }
}
