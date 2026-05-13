import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Evento, InscripcionEvento, FiltrosEvento } from '../models';

@Injectable({ providedIn: 'root' })
export class EventApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.services.events}/eventos`;

  getAll(filtros: FiltrosEvento = {}): Observable<ApiResponse<PaginatedResponse<Evento>>> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v !== undefined) params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<PaginatedResponse<Evento>>>(this.base, { params });
  }

  getMisEventos(filtros: { estado?: string; page?: number; limit?: number } = {}): Observable<ApiResponse<PaginatedResponse<Evento>>> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v !== undefined) params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<PaginatedResponse<Evento>>>(`${this.base}/mis-eventos`, { params });
  }

  getById(id: string): Observable<ApiResponse<Evento>> {
    return this.http.get<ApiResponse<Evento>>(`${this.base}/${id}`);
  }

  create(data: Partial<Evento>): Observable<ApiResponse<Evento>> {
    return this.http.post<ApiResponse<Evento>>(this.base, data);
  }

  update(id: string, data: Partial<Evento>): Observable<ApiResponse<Evento>> {
    return this.http.put<ApiResponse<Evento>>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }

  inscribirse(eventoId: string): Observable<ApiResponse<InscripcionEvento>> {
    return this.http.post<ApiResponse<InscripcionEvento>>(`${this.base}/${eventoId}/inscribirme`, {});
  }

  cancelarInscripcion(eventoId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${eventoId}/inscribirme`);
  }

  getInscritos(eventoId: string): Observable<ApiResponse<InscripcionEvento[]>> {
    return this.http.get<ApiResponse<InscripcionEvento[]>>(`${this.base}/${eventoId}/inscritos`);
  }
}
