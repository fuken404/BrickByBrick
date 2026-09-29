import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, Beneficiario, Constructora, DocumentoEmpresa, EstadisticasPublicas, Localidad, Me, Pagina,
  PerfilPublico, PreferenciasNotif, TipoDocumento,
} from '../models';
import { toParams } from '../utils/http';

export type CambiosBeneficiario = Partial<{
  nombreCompleto: string; fechaNacimiento: string | null; genero: string | null; estrato: number | null; localidadId: number | null;
}>;

export type CambiosConstructora = Partial<{
  razonSocial: string; representanteLegal: string | null; cargoRepresentante: string | null; numEmpleados: number | null;
  direccion: string | null; localidadId: number | null; descripcion: string | null; sitioWeb: string | null;
}>;

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // --- Catálogos y público ---
  localidades(): Observable<ApiResponse<Localidad[]>> {
    return this.http.get<ApiResponse<Localidad[]>>(`${this.base}/localidades`);
  }

  estadisticasPublicas(): Observable<ApiResponse<EstadisticasPublicas>> {
    return this.http.get<ApiResponse<EstadisticasPublicas>>(`${this.base}/public/estadisticas`);
  }

  perfilPublico(usuarioId: string): Observable<ApiResponse<PerfilPublico>> {
    return this.http.get<ApiResponse<PerfilPublico>>(`${this.base}/perfiles/${usuarioId}`);
  }

  // --- Perfil propio ---
  me(): Observable<ApiResponse<Me>> {
    return this.http.get<ApiResponse<Me>>(`${this.base}/me`);
  }

  actualizarMe(data: { telefono?: string; preferenciasNotif?: PreferenciasNotif }): Observable<ApiResponse<Me>> {
    return this.http.patch<ApiResponse<Me>>(`${this.base}/me`, data);
  }

  subirAvatar(file: File): Observable<ApiResponse<{ avatarUrl: string }>> {
    const form = new FormData();
    form.append('avatar', file);
    return this.http.post<ApiResponse<{ avatarUrl: string }>>(`${this.base}/me/avatar`, form);
  }

  eliminarCuenta(password: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.base}/me/eliminar`, { password, confirmacion: 'ELIMINAR' }, { withCredentials: true });
  }

  // --- Beneficiarios ---
  actualizarBeneficiario(id: string, data: CambiosBeneficiario): Observable<ApiResponse<Beneficiario>> {
    return this.http.put<ApiResponse<Beneficiario>>(`${this.base}/beneficiarios/${id}`, data);
  }

  actualizarPortafolio(id: string, data: { nombreEmprendimiento: string | null; bioPublica: string | null; portafolioPublico: boolean }): Observable<ApiResponse<Beneficiario>> {
    return this.http.put<ApiResponse<Beneficiario>>(`${this.base}/beneficiarios/${id}/portafolio`, data);
  }

  toggleAlimentador(id: string): Observable<ApiResponse<Beneficiario>> {
    return this.http.patch<ApiResponse<Beneficiario>>(`${this.base}/beneficiarios/${id}/alimentador`, {});
  }

  // --- Constructoras ---
  constructoras(filtros: { q?: string; verificada?: boolean; localidadId?: number; page?: number; limit?: number } = {}): Observable<ApiResponse<Pagina<Constructora>>> {
    return this.http.get<ApiResponse<Pagina<Constructora>>>(`${this.base}/constructoras`, { params: toParams(filtros) });
  }

  constructora(id: string): Observable<ApiResponse<Constructora>> {
    return this.http.get<ApiResponse<Constructora>>(`${this.base}/constructoras/${id}`);
  }

  actualizarConstructora(id: string, data: CambiosConstructora): Observable<ApiResponse<Constructora>> {
    return this.http.put<ApiResponse<Constructora>>(`${this.base}/constructoras/${id}`, data);
  }

  subirDocumento(constructoraId: string, file: File, tipo: TipoDocumento): Observable<ApiResponse<DocumentoEmpresa>> {
    const form = new FormData();
    form.append('documento', file);
    form.append('tipo', tipo);
    return this.http.post<ApiResponse<DocumentoEmpresa>>(`${this.base}/constructoras/${constructoraId}/documentos`, form);
  }

  subirLogo(constructoraId: string, file: File): Observable<ApiResponse<{ id: string; logoUrl: string }>> {
    const form = new FormData();
    form.append('logo', file);
    return this.http.post<ApiResponse<{ id: string; logoUrl: string }>>(`${this.base}/constructoras/${constructoraId}/logo`, form);
  }
}
