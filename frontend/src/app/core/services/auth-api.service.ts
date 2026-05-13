import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuthResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.services.auth;

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/auth/login`, { email, password }, { withCredentials: true });
  }

  registerBeneficiario(data: Record<string, unknown>): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/auth/register/beneficiario`, data);
  }

  registerConstructora(data: Record<string, unknown>): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/auth/register/constructora`, data);
  }

  logout(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.base}/auth/logout`, {}, { withCredentials: true });
  }

  refreshToken(): Observable<ApiResponse<{ accessToken: string }>> {
    return this.http.post<ApiResponse<{ accessToken: string }>>(`${this.base}/auth/refresh-token`, {}, { withCredentials: true });
  }

  forgotPassword(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.base}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.base}/auth/reset-password/${token}`, { password });
  }

  verifyEmail(token: string): Observable<ApiResponse<null>> {
    return this.http.get<ApiResponse<null>>(`${this.base}/auth/verify-email/${token}`);
  }

  cambiarPassword(passwordActual: string, passwordNueva: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.base}/auth/cambiar-password`, { passwordActual, passwordNueva });
  }
}
