import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, Comentario, EstadoReporte, Pagina, Publicacion, Reporte, TipoPublicacion, TipoReporte, UsuarioPublico,
} from '../models';
import { toParams } from '../utils/http';

export interface FiltrosFeed {
  feed?: 'todos' | 'siguiendo';
  tipo?: TipoPublicacion;
  q?: string;
  autorId?: string;
  estado?: 'publicada' | 'suspendida';
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class SocialApiService {
  private readonly http = inject(HttpClient);
  private readonly pubs = `${environment.apiUrl}/publicaciones`;
  private readonly comentariosUrl = `${environment.apiUrl}/comentarios`;

  // --- Publicaciones ---
  feed(filtros: FiltrosFeed = {}): Observable<ApiResponse<Pagina<Publicacion>>> {
    return this.http.get<ApiResponse<Pagina<Publicacion>>>(this.pubs, { params: toParams(filtros) });
  }

  publicacion(id: string): Observable<ApiResponse<Publicacion>> {
    return this.http.get<ApiResponse<Publicacion>>(`${this.pubs}/${id}`);
  }

  publicar(data: { tipo: TipoPublicacion; titulo?: string; contenido: string }, fotos: File[] = []): Observable<ApiResponse<Publicacion>> {
    const form = new FormData();
    form.append('tipo', data.tipo);
    if (data.titulo) form.append('titulo', data.titulo);
    form.append('contenido', data.contenido);
    fotos.forEach((f) => form.append('fotos', f));
    return this.http.post<ApiResponse<Publicacion>>(this.pubs, form);
  }

  editar(id: string, data: { tipo?: TipoPublicacion; titulo?: string | null; contenido?: string }): Observable<ApiResponse<Publicacion>> {
    return this.http.put<ApiResponse<Publicacion>>(`${this.pubs}/${id}`, data);
  }

  eliminar(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.pubs}/${id}`);
  }

  moderar(id: string, estado: 'publicada' | 'suspendida', motivo?: string): Observable<ApiResponse<Publicacion>> {
    return this.http.patch<ApiResponse<Publicacion>>(`${this.pubs}/${id}/moderacion`, { estado, motivo });
  }

  like(id: string): Observable<ApiResponse<{ likes: number; likedByMe: boolean }>> {
    return this.http.post<ApiResponse<{ likes: number; likedByMe: boolean }>>(`${this.pubs}/${id}/like`, {});
  }

  unlike(id: string): Observable<ApiResponse<{ likes: number; likedByMe: boolean }>> {
    return this.http.delete<ApiResponse<{ likes: number; likedByMe: boolean }>>(`${this.pubs}/${id}/like`);
  }

  repost(id: string, comentario?: string): Observable<ApiResponse<Publicacion>> {
    return this.http.post<ApiResponse<Publicacion>>(`${this.pubs}/${id}/repost`, comentario ? { comentario } : {});
  }

  quitarRepost(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.pubs}/${id}/repost`);
  }

  // --- Comentarios ---
  comentarios(publicacionId: string, page = 1): Observable<ApiResponse<Pagina<Comentario>>> {
    return this.http.get<ApiResponse<Pagina<Comentario>>>(`${this.pubs}/${publicacionId}/comentarios`, { params: toParams({ page }) });
  }

  comentar(publicacionId: string, contenido: string, parentId?: string): Observable<ApiResponse<Comentario>> {
    return this.http.post<ApiResponse<Comentario>>(`${this.pubs}/${publicacionId}/comentarios`, parentId ? { contenido, parentId } : { contenido });
  }

  editarComentario(id: string, contenido: string): Observable<ApiResponse<Comentario>> {
    return this.http.put<ApiResponse<Comentario>>(`${this.comentariosUrl}/${id}`, { contenido });
  }

  eliminarComentario(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.comentariosUrl}/${id}`);
  }

  likeComentario(id: string): Observable<ApiResponse<{ likes: number; likedByMe: boolean }>> {
    return this.http.post<ApiResponse<{ likes: number; likedByMe: boolean }>>(`${this.comentariosUrl}/${id}/like`, {});
  }

  unlikeComentario(id: string): Observable<ApiResponse<{ likes: number; likedByMe: boolean }>> {
    return this.http.delete<ApiResponse<{ likes: number; likedByMe: boolean }>>(`${this.comentariosUrl}/${id}/like`);
  }

  // --- Reportes ---
  reportar(tipoContenido: TipoReporte, contenidoId: string, motivo: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${environment.apiUrl}/reportes`, { tipoContenido, contenidoId, motivo });
  }

  reportes(filtros: { estado?: EstadoReporte; tipo?: TipoReporte; page?: number }): Observable<ApiResponse<Pagina<Reporte>>> {
    return this.http.get<ApiResponse<Pagina<Reporte>>>(`${environment.apiUrl}/reportes`, { params: toParams(filtros) });
  }

  resolverReporte(id: string, accion: 'ocultar' | 'ignorar', resolucion: string): Observable<ApiResponse<{ id: string; estado: EstadoReporte }>> {
    return this.http.patch<ApiResponse<{ id: string; estado: EstadoReporte }>>(`${environment.apiUrl}/reportes/${id}`, { accion, resolucion });
  }

  // --- Seguidores ---
  seguir(usuarioId: string): Observable<ApiResponse<{ seguidores: number; siguiendoPorMi: boolean }>> {
    return this.http.post<ApiResponse<{ seguidores: number; siguiendoPorMi: boolean }>>(`${environment.apiUrl}/seguidores/${usuarioId}`, {});
  }

  dejarDeSeguir(usuarioId: string): Observable<ApiResponse<{ seguidores: number; siguiendoPorMi: boolean }>> {
    return this.http.delete<ApiResponse<{ seguidores: number; siguiendoPorMi: boolean }>>(`${environment.apiUrl}/seguidores/${usuarioId}`);
  }

  seguidores(usuarioId: string, page = 1): Observable<ApiResponse<Pagina<UsuarioPublico>>> {
    return this.http.get<ApiResponse<Pagina<UsuarioPublico>>>(`${environment.apiUrl}/seguidores/${usuarioId}/seguidores`, { params: toParams({ page }) });
  }

  siguiendo(usuarioId: string, page = 1): Observable<ApiResponse<Pagina<UsuarioPublico>>> {
    return this.http.get<ApiResponse<Pagina<UsuarioPublico>>>(`${environment.apiUrl}/seguidores/${usuarioId}/siguiendo`, { params: toParams({ page }) });
  }
}
