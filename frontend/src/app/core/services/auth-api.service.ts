import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, RespuestaLogin, Sesion, UsuarioSesion } from '../models';

export interface RegistroBeneficiario {
  email: string;
  password: string;
  nombreCompleto: string;
  cedula: string;
  fechaNacimiento: string;
  genero?: string;
  estrato?: number;
  localidadId: number;
  telefono: string;
  aceptaTerminos: true;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;
  private readonly conCookie = { withCredentials: true };

  login(email: string, password: string): Observable<ApiResponse<RespuestaLogin>> {
    return this.http.post<ApiResponse<RespuestaLogin>>(`${this.base}/login`, { email, password }, this.conCookie);
  }

  verificarMfa(desafioId: string, codigo: string): Observable<ApiResponse<Sesion>> {
    return this.http.post<ApiResponse<Sesion>>(`${this.base}/mfa/verificar`, { desafioId, codigo }, this.conCookie);
  }

  reenviarMfa(desafioId: string): Observable<ApiResponse<{ desafioId: string }>> {
    return this.http.post<ApiResponse<{ desafioId: string }>>(`${this.base}/mfa/reenviar`, { desafioId });
  }

  configurarMfa(habilitar: boolean, password: string): Observable<ApiResponse<UsuarioSesion>> {
    return this.http.patch<ApiResponse<UsuarioSesion>>(`${this.base}/mfa`, { habilitar, password });
  }

  registerBeneficiario(data: RegistroBeneficiario): Observable<ApiResponse<UsuarioSesion>> {
    return this.http.post<ApiResponse<UsuarioSesion>>(`${this.base}/register/beneficiario`, data);
  }

  /** multipart/form-data con los archivos `rut` y `camaraComercio`. */
  registerConstructora(form: FormData): Observable<ApiResponse<UsuarioSesion>> {
    return this.http.post<ApiResponse<UsuarioSesion>>(`${this.base}/register/constructora`, form);
  }

  refresh(): Observable<ApiResponse<Sesion>> {
    return this.http.post<ApiResponse<Sesion>>(`${this.base}/refresh-token`, {}, this.conCookie);
  }

  logout(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.base}/logout`, {}, this.conCookie);
  }

  forgotPassword(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.base}/reset-password/${encodeURIComponent(token)}`, { password });
  }

  cambiarPassword(passwordActual: string, passwordNueva: string): Observable<ApiResponse<Sesion>> {
    return this.http.patch<ApiResponse<Sesion>>(`${this.base}/password`, { passwordActual, passwordNueva }, this.conCookie);
  }

  verifyEmail(token: string): Observable<ApiResponse<null>> {
    return this.http.get<ApiResponse<null>>(`${this.base}/verify-email/${encodeURIComponent(token)}`);
  }

  reenviarVerificacion(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.base}/verify-email/reenviar`, {});
  }
}
