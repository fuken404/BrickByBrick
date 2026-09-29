import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, EstadoEvento, EstadoInscripcion, Evento, FiltrosEvento, Inscripcion, Pagina } from '../models';
import { toParams } from '../utils/http';

export interface DatosEvento {
  nombre: string;
  tipoEvento: string;
  descripcion?: string | null;
  fechaInicio: string;
  fechaFin: string;
  direccion: string;
  localidadId: number;
  capacidadMaxima?: number | null;
  materialIds?: string[];
}

@Injectable({ providedIn: 'root' })
export class EventApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/eventos`;

  publicos(filtros: FiltrosEvento = {}): Observable<ApiResponse<Pagina<Evento>>> {
    return this.http.get<ApiResponse<Pagina<Evento>>>(this.base, { params: toParams(filtros) });
  }

  misEventos(filtros: FiltrosEvento = {}): Observable<ApiResponse<Pagina<Evento>>> {
    return this.http.get<ApiResponse<Pagina<Evento>>>(`${this.base}/mis-eventos`, { params: toParams(filtros) });
  }

  adminEventos(filtros: FiltrosEvento = {}): Observable<ApiResponse<Pagina<Evento>>> {
    return this.http.get<ApiResponse<Pagina<Evento>>>(`${this.base}/admin`, { params: toParams(filtros) });
  }

  misInscripciones(filtros: FiltrosEvento = {}): Observable<ApiResponse<Pagina<Inscripcion>>> {
    return this.http.get<ApiResponse<Pagina<Inscripcion>>>(`${this.base}/mis-inscripciones`, { params: toParams(filtros) });
  }

  obtener(id: string): Observable<ApiResponse<Evento>> {
    return this.http.get<ApiResponse<Evento>>(`${this.base}/${id}`);
  }

  crear(data: DatosEvento & { estado: 'borrador' | 'publicado' }): Observable<ApiResponse<Evento>> {
    return this.http.post<ApiResponse<Evento>>(this.base, data);
  }

  actualizar(id: string, data: Partial<DatosEvento>): Observable<ApiResponse<Evento>> {
    return this.http.put<ApiResponse<Evento>>(`${this.base}/${id}`, data);
  }

  cambiarEstado(id: string, estado: Exclude<EstadoEvento, 'borrador'>, motivo?: string): Observable<ApiResponse<Evento>> {
    return this.http.patch<ApiResponse<Evento>>(`${this.base}/${id}/estado`, { estado, motivo });
  }

  eliminar(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }

  subirImagen(id: string, file: File): Observable<ApiResponse<Evento>> {
    const form = new FormData();
    form.append('imagen', file);
    return this.http.post<ApiResponse<Evento>>(`${this.base}/${id}/imagen`, form);
  }

  inscribirse(id: string): Observable<ApiResponse<Inscripcion>> {
    return this.http.post<ApiResponse<Inscripcion>>(`${this.base}/${id}/inscripcion`, {});
  }

  cancelarInscripcion(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}/inscripcion`);
  }

  inscritos(id: string, estado?: EstadoInscripcion): Observable<ApiResponse<Inscripcion[]>> {
    return this.http.get<ApiResponse<Inscripcion[]>>(`${this.base}/${id}/inscritos`, { params: toParams({ estado }) });
  }

  registrarAsistencia(id: string, inscripciones: { id: string; asistio: boolean }[]): Observable<ApiResponse<Inscripcion[]>> {
    return this.http.patch<ApiResponse<Inscripcion[]>>(`${this.base}/${id}/asistencia`, { inscripciones });
  }

  exportarInscritos(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/${id}/inscritos/export`, { responseType: 'blob', observe: 'response' });
  }
}
