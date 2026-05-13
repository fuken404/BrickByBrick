import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Beneficiario, Constructora, DocumentoEmpresa, Localidad } from '../models';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.services.users;

  // Beneficiarios
  getBeneficiarios(params?: Record<string, string>): Observable<ApiResponse<PaginatedResponse<Beneficiario>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Beneficiario>>>(`${this.base}/beneficiarios`, { params });
  }

  getBeneficiario(id: string): Observable<ApiResponse<Beneficiario>> {
    return this.http.get<ApiResponse<Beneficiario>>(`${this.base}/beneficiarios/${id}`);
  }

  updateBeneficiario(id: string, data: Partial<Beneficiario>): Observable<ApiResponse<Beneficiario>> {
    return this.http.put<ApiResponse<Beneficiario>>(`${this.base}/beneficiarios/${id}`, data);
  }

  toggleAlimentador(id: string): Observable<ApiResponse<Partial<Beneficiario>>> {
    return this.http.patch<ApiResponse<Partial<Beneficiario>>>(`${this.base}/beneficiarios/${id}/alimentador`, {});
  }

  // Constructoras
  getConstructoras(params?: Record<string, string>): Observable<ApiResponse<PaginatedResponse<Constructora>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Constructora>>>(`${this.base}/constructoras`, { params });
  }

  getConstructora(id: string): Observable<ApiResponse<Constructora>> {
    return this.http.get<ApiResponse<Constructora>>(`${this.base}/constructoras/${id}`);
  }

  updateConstructora(id: string, data: Partial<Constructora>): Observable<ApiResponse<Constructora>> {
    return this.http.put<ApiResponse<Constructora>>(`${this.base}/constructoras/${id}`, data);
  }

  verificarConstructora(id: string): Observable<ApiResponse<Constructora>> {
    return this.http.patch<ApiResponse<Constructora>>(`${this.base}/constructoras/${id}/verificar`, {});
  }

  uploadDocumento(constructoraId: string, file: File, tipo: string): Observable<ApiResponse<DocumentoEmpresa>> {
    const form = new FormData();
    form.append('documento', file);
    form.append('tipo', tipo);
    return this.http.post<ApiResponse<DocumentoEmpresa>>(`${this.base}/constructoras/${constructoraId}/documentos`, form);
  }

  uploadLogo(constructoraId: string, file: File): Observable<ApiResponse<{ id: string; logoUrl: string }>> {
    const form = new FormData();
    form.append('logo', file);
    return this.http.post<ApiResponse<{ id: string; logoUrl: string }>>(`${this.base}/constructoras/${constructoraId}/logo`, form);
  }
}
