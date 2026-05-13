import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Publicacion, Comentario, Grupo, MensajeGrupo } from '../models';

@Injectable({ providedIn: 'root' })
export class PublicationApiService {
  private readonly http = inject(HttpClient);
  private readonly basePubs   = `${environment.services.pubs}/publicaciones`;
  private readonly baseGrupos = `${environment.services.pubs}/grupos`;

  getPublicaciones(params?: { tipo?: string; q?: string; page?: number; limit?: number }):
    Observable<ApiResponse<PaginatedResponse<Publicacion>>> {
    let httpParams = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) httpParams = httpParams.set(k, String(v)); });
    return this.http.get<ApiResponse<PaginatedResponse<Publicacion>>>(this.basePubs, { params: httpParams });
  }

  getPublicacion(id: string): Observable<ApiResponse<Publicacion & { comentarios: Comentario[] }>> {
    return this.http.get<ApiResponse<Publicacion & { comentarios: Comentario[] }>>(`${this.basePubs}/${id}`);
  }

  createPublicacion(data: Partial<Publicacion>): Observable<ApiResponse<Publicacion>> {
    return this.http.post<ApiResponse<Publicacion>>(this.basePubs, data);
  }

  updatePublicacion(id: string, data: Partial<Publicacion>): Observable<ApiResponse<Publicacion>> {
    return this.http.put<ApiResponse<Publicacion>>(`${this.basePubs}/${id}`, data);
  }

  deletePublicacion(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.basePubs}/${id}`);
  }

  addComentario(pubId: string, contenido: string, parentId?: string): Observable<ApiResponse<Comentario>> {
    return this.http.post<ApiResponse<Comentario>>(`${this.basePubs}/${pubId}/comentarios`, { contenido, parentId });
  }

  addLike(pubId: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.basePubs}/${pubId}/like`, {});
  }

  removeLike(pubId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.basePubs}/${pubId}/like`);
  }

  // Grupos
  getGrupos(params?: { page?: number; limit?: number }): Observable<ApiResponse<PaginatedResponse<Grupo>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Grupo>>>(this.baseGrupos, { params: params as Record<string, string> });
  }

  getGrupo(id: string): Observable<ApiResponse<Grupo>> {
    return this.http.get<ApiResponse<Grupo>>(`${this.baseGrupos}/${id}`);
  }

  crearGrupo(data: { nombre: string; descripcion?: string; temas?: string[] }): Observable<ApiResponse<Grupo>> {
    return this.http.post<ApiResponse<Grupo>>(this.baseGrupos, data);
  }

  unirseGrupo(id: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.baseGrupos}/${id}/unirse`, {});
  }

  salirGrupo(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseGrupos}/${id}/salir`);
  }

  getMensajes(grupoId: string, params?: { page?: number }): Observable<ApiResponse<PaginatedResponse<MensajeGrupo>>> {
    return this.http.get<ApiResponse<PaginatedResponse<MensajeGrupo>>>(`${this.baseGrupos}/${grupoId}/mensajes`, { params: params as Record<string, string> });
  }

  sendMensaje(grupoId: string, contenido: string): Observable<ApiResponse<MensajeGrupo>> {
    return this.http.post<ApiResponse<MensajeGrupo>>(`${this.baseGrupos}/${grupoId}/mensajes`, { contenido });
  }
}
