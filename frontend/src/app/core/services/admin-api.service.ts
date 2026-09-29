import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, ConfiguracionSistema, Constructora, DashboardAdmin, DocumentoEmpresa, EstadoUsuario, MetricasAdmin,
  MetricasRendimiento, Pagina, RegistroAuditoria, RolUsuario, SaludServicios, UsuarioAdmin,
} from '../models';
import { toParams } from '../utils/http';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  dashboard(): Observable<ApiResponse<DashboardAdmin>> {
    return this.http.get<ApiResponse<DashboardAdmin>>(`${this.base}/dashboard`);
  }

  metricas(dias = 30): Observable<ApiResponse<MetricasAdmin>> {
    return this.http.get<ApiResponse<MetricasAdmin>>(`${this.base}/metricas`, { params: toParams({ dias }) });
  }

  rendimiento(): Observable<ApiResponse<MetricasRendimiento>> {
    return this.http.get<ApiResponse<MetricasRendimiento>>(`${environment.apiUrl}/metricas/rendimiento`);
  }

  /** /health del gateway (fuera de /api/v1). */
  salud(): Observable<SaludServicios> {
    return this.http.get<SaludServicios>('/health');
  }

  usuarios(filtros: { q?: string; rol?: RolUsuario; estado?: EstadoUsuario; page?: number; limit?: number }): Observable<ApiResponse<Pagina<UsuarioAdmin>>> {
    return this.http.get<ApiResponse<Pagina<UsuarioAdmin>>>(`${this.base}/usuarios`, { params: toParams(filtros) });
  }

  cambiarEstadoUsuario(id: string, estado: 'activo' | 'suspendido', motivo?: string): Observable<ApiResponse<{ id: string; estado: EstadoUsuario }>> {
    return this.http.patch<ApiResponse<{ id: string; estado: EstadoUsuario }>>(`${this.base}/usuarios/${id}/estado`, { estado, motivo });
  }

  verificarConstructora(id: string, aprobar: boolean, motivo?: string): Observable<ApiResponse<Constructora>> {
    return this.http.patch<ApiResponse<Constructora>>(`${this.base}/constructoras/${id}/verificacion`, { aprobar, motivo });
  }

  revisarDocumento(id: string, estado: 'aprobado' | 'rechazado', motivo?: string): Observable<ApiResponse<DocumentoEmpresa>> {
    return this.http.patch<ApiResponse<DocumentoEmpresa>>(`${this.base}/documentos/${id}`, { estado, motivo });
  }

  configuracion(): Observable<ApiResponse<ConfiguracionSistema>> {
    return this.http.get<ApiResponse<ConfiguracionSistema>>(`${this.base}/configuracion`);
  }

  guardarConfiguracion(data: Partial<ConfiguracionSistema>): Observable<ApiResponse<ConfiguracionSistema>> {
    return this.http.put<ApiResponse<ConfiguracionSistema>>(`${this.base}/configuracion`, data);
  }

  auditoria(filtros: { entidad?: string; page?: number; limit?: number }): Observable<ApiResponse<Pagina<RegistroAuditoria>>> {
    return this.http.get<ApiResponse<Pagina<RegistroAuditoria>>>(`${this.base}/auditoria`, { params: toParams(filtros) });
  }

  exportar(tipo: 'solicitudes' | 'usuarios' | 'eventos'): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/exportar/${tipo}`, { responseType: 'blob', observe: 'response' });
  }
}
