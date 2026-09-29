import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, EstadoMiembro, Grupo, MensajeGrupo, MiembroGrupo, Pagina, PaginaCursor, PrivacidadGrupo } from '../models';
import { toParams } from '../utils/http';

export interface DatosGrupo { nombre: string; descripcion?: string; privacidad: PrivacidadGrupo; temas: string[] }
export type AccionMiembro = 'aprobar' | 'rechazar' | 'expulsar' | 'hacer_admin' | 'quitar_admin';

@Injectable({ providedIn: 'root' })
export class GrupoApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/grupos`;

  listar(filtros: { q?: string; mios?: boolean; page?: number } = {}): Observable<ApiResponse<Pagina<Grupo>>> {
    return this.http.get<ApiResponse<Pagina<Grupo>>>(this.base, { params: toParams(filtros) });
  }

  obtener(id: string): Observable<ApiResponse<Grupo>> {
    return this.http.get<ApiResponse<Grupo>>(`${this.base}/${id}`);
  }

  crear(data: DatosGrupo): Observable<ApiResponse<Grupo>> {
    return this.http.post<ApiResponse<Grupo>>(this.base, data);
  }

  actualizar(id: string, data: Partial<DatosGrupo>): Observable<ApiResponse<Grupo>> {
    return this.http.put<ApiResponse<Grupo>>(`${this.base}/${id}`, data);
  }

  subirImagen(id: string, file: File): Observable<ApiResponse<Grupo>> {
    const form = new FormData();
    form.append('imagen', file);
    return this.http.post<ApiResponse<Grupo>>(`${this.base}/${id}/imagen`, form);
  }

  eliminar(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }

  unirse(id: string): Observable<ApiResponse<{ estado: EstadoMiembro; rol: 'admin' | 'miembro' }>> {
    return this.http.post<ApiResponse<{ estado: EstadoMiembro; rol: 'admin' | 'miembro' }>>(`${this.base}/${id}/unirse`, {});
  }

  salir(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}/miembros/me`);
  }

  miembros(id: string, estado?: EstadoMiembro): Observable<ApiResponse<Pagina<MiembroGrupo>>> {
    return this.http.get<ApiResponse<Pagina<MiembroGrupo>>>(`${this.base}/${id}/miembros`, { params: toParams({ estado, limit: 100 }) });
  }

  gestionarMiembro(id: string, usuarioId: string, accion: AccionMiembro): Observable<ApiResponse<unknown>> {
    return this.http.patch<ApiResponse<unknown>>(`${this.base}/${id}/miembros/${usuarioId}`, { accion });
  }

  invitar(id: string, usuarioId: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${id}/invitaciones`, { usuarioId });
  }

  mensajes(id: string, antes?: string): Observable<ApiResponse<PaginaCursor<MensajeGrupo>>> {
    return this.http.get<ApiResponse<PaginaCursor<MensajeGrupo>>>(`${this.base}/${id}/mensajes`, { params: toParams({ antes }) });
  }

  enviarMensaje(id: string, contenido: string): Observable<ApiResponse<MensajeGrupo>> {
    return this.http.post<ApiResponse<MensajeGrupo>>(`${this.base}/${id}/mensajes`, { contenido });
  }
}
