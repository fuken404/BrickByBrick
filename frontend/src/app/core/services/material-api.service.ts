import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Material, SolicitudMaterial, FiltrosMaterial } from '../models';

@Injectable({ providedIn: 'root' })
export class MaterialApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.services.materials}/materiales`;

  getAll(filtros: FiltrosMaterial = {}): Observable<ApiResponse<PaginatedResponse<Material>>> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v !== undefined && v !== null) params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<PaginatedResponse<Material>>>(this.base, { params });
  }

  getMisMateriales(filtros: { estadoPublicacion?: string; page?: number; limit?: number } = {}): Observable<ApiResponse<PaginatedResponse<Material>>> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v !== undefined && v !== null) params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<PaginatedResponse<Material>>>(`${this.base}/mis-materiales`, { params });
  }

  getById(id: string): Observable<ApiResponse<Material>> {
    return this.http.get<ApiResponse<Material>>(`${this.base}/${id}`);
  }

  create(data: Partial<Material>): Observable<ApiResponse<Material>> {
    return this.http.post<ApiResponse<Material>>(this.base, data);
  }

  update(id: string, data: Partial<Material>): Observable<ApiResponse<Material>> {
    return this.http.put<ApiResponse<Material>>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }

  cambiarEstado(id: string, estado: string): Observable<ApiResponse<Partial<Material>>> {
    return this.http.patch<ApiResponse<Partial<Material>>>(`${this.base}/${id}/estado`, { estado });
  }

  uploadFotos(id: string, files: File[]): Observable<ApiResponse<unknown>> {
    const form = new FormData();
    files.forEach(f => form.append('fotos', f));
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${id}/fotos`, form);
  }

  getSolicitudes(materialId: string): Observable<ApiResponse<SolicitudMaterial[]>> {
    return this.http.get<ApiResponse<SolicitudMaterial[]>>(`${this.base}/${materialId}/solicitudes`);
  }

  getSolicitudesRecibidas(params: { estado?: string; page?: number; limit?: number } = {}): Observable<ApiResponse<PaginatedResponse<SolicitudMaterial>>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p = p.set(k, String(v)); });
    return this.http.get<ApiResponse<PaginatedResponse<SolicitudMaterial>>>(
      `${environment.services.materials}/solicitudes/recibidas`, { params: p }
    );
  }

  getMisSolicitudes(params: { estado?: string; page?: number; limit?: number } = {}): Observable<ApiResponse<PaginatedResponse<SolicitudMaterial>>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p = p.set(k, String(v)); });
    return this.http.get<ApiResponse<PaginatedResponse<SolicitudMaterial>>>(
      `${environment.services.materials}/solicitudes/mis-solicitudes`, { params: p }
    );
  }

  crearSolicitud(materialId: string, data: Partial<SolicitudMaterial>): Observable<ApiResponse<SolicitudMaterial>> {
    return this.http.post<ApiResponse<SolicitudMaterial>>(`${this.base}/${materialId}/solicitudes`, data);
  }

  cambiarEstadoSolicitud(solicitudId: string, estado: string, instruccionesRetiro?: string): Observable<ApiResponse<SolicitudMaterial>> {
    return this.http.patch<ApiResponse<SolicitudMaterial>>(
      `${environment.services.materials}/solicitudes/${solicitudId}/estado`,
      { estado, instruccionesRetiro }
    );
  }

  calificarSolicitud(solicitudId: string, calificacion: number, comentario?: string): Observable<ApiResponse<SolicitudMaterial>> {
    return this.http.post<ApiResponse<SolicitudMaterial>>(
      `${environment.services.materials}/solicitudes/${solicitudId}/calificacion`,
      { calificacion, comentarioCalificacion: comentario }
    );
  }

  getAllSolicitudes(params: { estado?: string; page?: number; limit?: number } = {}): Observable<ApiResponse<any>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p = p.set(k, String(v)); });
    return this.http.get<ApiResponse<any>>(`${environment.services.materials}/solicitudes`, { params: p });
  }
}
