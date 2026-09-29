import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Constancia, ResumenTributario } from '../models';
import { toParams } from '../utils/http';

@Injectable({ providedIn: 'root' })
export class TributarioApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tributario`;

  resumen(anio: number, impuestoEstimado?: number | null): Observable<ApiResponse<ResumenTributario>> {
    return this.http.get<ApiResponse<ResumenTributario>>(`${this.base}/resumen`, { params: toParams({ anio, impuestoEstimado }) });
  }

  constancias(anio: number): Observable<ApiResponse<Constancia[]>> {
    return this.http.get<ApiResponse<Constancia[]>>(`${this.base}/constancias`, { params: toParams({ anio }) });
  }

  constanciaPdf(solicitudId: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/constancias/${solicitudId}/pdf`, { responseType: 'blob', observe: 'response' });
  }

  certificadoPdf(anio: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/certificado/${anio}/pdf`, { responseType: 'blob', observe: 'response' });
  }
}
