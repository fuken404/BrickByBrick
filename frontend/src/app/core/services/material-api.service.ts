import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, CategoriaMaterial, EstadoPubMaterial, EstadoSolicitud, FiltrosMaterial, FotoMaterial, Material, Pagina,
  PaginaSolicitudes, SolicitudMaterial,
} from '../models';
import { toParams } from '../utils/http';

export interface DatosMaterial {
  categoriaId: number;
  nombre: string;
  descripcion?: string | null;
  estadoMaterial: string;
  cantidad: number;
  unidadMedida: string;
  valorUnitarioCop?: number | null;
  condicionesRetiro?: string | null;
  fechaLimite?: string | null;
  maxSolicitudes?: number | null;
}

export interface FiltrosSolicitud { estado?: EstadoSolicitud; materialId?: string; page?: number; limit?: number }

@Injectable({ providedIn: 'root' })
export class MaterialApiService {
  private readonly http = inject(HttpClient);
  private readonly materiales = `${environment.apiUrl}/materiales`;
  private readonly solicitudes = `${environment.apiUrl}/solicitudes`;

  // --- Categorías ---
  categorias(): Observable<ApiResponse<CategoriaMaterial[]>> {
    return this.http.get<ApiResponse<CategoriaMaterial[]>>(`${environment.apiUrl}/categorias`);
  }

  crearCategoria(data: Pick<CategoriaMaterial, 'nombre' | 'colorHex' | 'icono'>): Observable<ApiResponse<CategoriaMaterial>> {
    return this.http.post<ApiResponse<CategoriaMaterial>>(`${environment.apiUrl}/categorias`, data);
  }

  actualizarCategoria(id: number, data: Pick<CategoriaMaterial, 'nombre' | 'colorHex' | 'icono'>): Observable<ApiResponse<CategoriaMaterial>> {
    return this.http.put<ApiResponse<CategoriaMaterial>>(`${environment.apiUrl}/categorias/${id}`, data);
  }

  eliminarCategoria(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/categorias/${id}`);
  }

  // --- Materiales ---
  catalogo(filtros: FiltrosMaterial = {}): Observable<ApiResponse<Pagina<Material>>> {
    return this.http.get<ApiResponse<Pagina<Material>>>(this.materiales, { params: toParams(filtros) });
  }

  misMateriales(filtros: FiltrosMaterial = {}): Observable<ApiResponse<Pagina<Material>>> {
    return this.http.get<ApiResponse<Pagina<Material>>>(`${this.materiales}/mis-materiales`, { params: toParams(filtros) });
  }

  adminMateriales(filtros: FiltrosMaterial = {}): Observable<ApiResponse<Pagina<Material>>> {
    return this.http.get<ApiResponse<Pagina<Material>>>(`${this.materiales}/admin`, { params: toParams(filtros) });
  }

  obtener(id: string): Observable<ApiResponse<Material>> {
    return this.http.get<ApiResponse<Material>>(`${this.materiales}/${id}`);
  }

  crear(data: DatosMaterial & { estadoPublicacion: 'borrador' | 'activo' }): Observable<ApiResponse<Material>> {
    return this.http.post<ApiResponse<Material>>(this.materiales, data);
  }

  actualizar(id: string, data: Partial<DatosMaterial>): Observable<ApiResponse<Material>> {
    return this.http.put<ApiResponse<Material>>(`${this.materiales}/${id}`, data);
  }

  cambiarEstado(id: string, estado: Extract<EstadoPubMaterial, 'activo' | 'pausado' | 'borrador'>): Observable<ApiResponse<Material>> {
    return this.http.patch<ApiResponse<Material>>(`${this.materiales}/${id}/estado`, { estado });
  }

  eliminar(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.materiales}/${id}`);
  }

  subirFotos(id: string, files: File[]): Observable<ApiResponse<FotoMaterial[]>> {
    const form = new FormData();
    files.forEach((f) => form.append('fotos', f));
    return this.http.post<ApiResponse<FotoMaterial[]>>(`${this.materiales}/${id}/fotos`, form);
  }

  eliminarFoto(id: string, fotoId: string): Observable<ApiResponse<FotoMaterial[]>> {
    return this.http.delete<ApiResponse<FotoMaterial[]>>(`${this.materiales}/${id}/fotos/${fotoId}`);
  }

  // --- Solicitudes ---
  solicitar(materialId: string, data: { cantidadSolicitada: number; propositoUso: string; descripcionProyecto?: string }): Observable<ApiResponse<SolicitudMaterial>> {
    return this.http.post<ApiResponse<SolicitudMaterial>>(`${this.materiales}/${materialId}/solicitudes`, data);
  }

  misSolicitudes(filtros: FiltrosSolicitud = {}): Observable<ApiResponse<PaginaSolicitudes>> {
    return this.http.get<ApiResponse<PaginaSolicitudes>>(`${this.solicitudes}/mis-solicitudes`, { params: toParams(filtros) });
  }

  solicitudesRecibidas(filtros: FiltrosSolicitud = {}): Observable<ApiResponse<PaginaSolicitudes>> {
    return this.http.get<ApiResponse<PaginaSolicitudes>>(`${this.solicitudes}/recibidas`, { params: toParams(filtros) });
  }

  todasLasSolicitudes(filtros: FiltrosSolicitud = {}): Observable<ApiResponse<PaginaSolicitudes>> {
    return this.http.get<ApiResponse<PaginaSolicitudes>>(this.solicitudes, { params: toParams(filtros) });
  }

  solicitud(id: string): Observable<ApiResponse<SolicitudMaterial>> {
    return this.http.get<ApiResponse<SolicitudMaterial>>(`${this.solicitudes}/${id}`);
  }

  cambiarEstadoSolicitud(
    id: string,
    data: { estado: 'aprobada' | 'rechazada' | 'entregada' | 'cancelada'; instruccionesRetiro?: string; motivo?: string },
  ): Observable<ApiResponse<SolicitudMaterial>> {
    return this.http.patch<ApiResponse<SolicitudMaterial>>(`${this.solicitudes}/${id}/estado`, data);
  }

  cancelarSolicitud(id: string, motivo?: string): Observable<ApiResponse<SolicitudMaterial>> {
    return this.http.post<ApiResponse<SolicitudMaterial>>(`${this.solicitudes}/${id}/cancelar`, motivo ? { motivo } : {});
  }

  confirmarRecepcion(id: string, data: { calificacion?: number; comentarioCalificacion?: string } = {}): Observable<ApiResponse<SolicitudMaterial>> {
    return this.http.post<ApiResponse<SolicitudMaterial>>(`${this.solicitudes}/${id}/confirmar-recepcion`, data);
  }

  calificar(id: string, calificacion: number, comentarioCalificacion?: string): Observable<ApiResponse<SolicitudMaterial>> {
    return this.http.post<ApiResponse<SolicitudMaterial>>(`${this.solicitudes}/${id}/calificacion`, { calificacion, comentarioCalificacion });
  }
}
