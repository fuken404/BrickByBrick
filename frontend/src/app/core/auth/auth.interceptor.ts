import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStore } from './auth.store';
import { ToastService } from '../services/toast.service';

/** Endpoints de autenticación que no deben disparar el refresco automático. */
const SIN_REFRESCO = ['/auth/login', '/auth/refresh-token', '/auth/mfa/', '/auth/logout', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

const esApi = (req: HttpRequest<unknown>) => req.url.startsWith(environment.apiUrl) || req.url === '/health';
const conToken = (req: HttpRequest<unknown>, token: string | null) =>
  token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

/** Adjunta el token y, ante un 401, renueva la sesión y reintenta una vez. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!esApi(req)) return next(req);
  const auth = inject(AuthStore);
  const router = inject(Router);

  return next(conToken(req, auth.accessToken())).pipe(
    catchError((err: unknown) => {
      const es401 = err instanceof HttpErrorResponse && err.status === 401;
      if (!es401 || SIN_REFRESCO.some((p) => req.url.includes(p)) || !auth.accessToken()) {
        return throwError(() => err);
      }
      return auth.refrescar().pipe(
        switchMap((token) => next(conToken(req, token))),
        catchError((refreshErr: unknown) => {
          auth.limpiar();
          router.navigate(['/login'], { queryParams: { returnUrl: router.url, sesion: 'expirada' } });
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};

/** Avisa de errores de red y del servidor; los 4xx los maneja cada vista. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && esApi(req)) {
        if (err.status === 0) toast.error('Sin conexión con el servidor. Revisa tu red.');
        else if (err.status === 429) toast.error('Demasiadas solicitudes. Espera un momento e intenta de nuevo.');
        else if (err.status >= 500 && err.status !== 503) toast.error('Error del servidor. Intenta de nuevo en unos segundos.');
      }
      return throwError(() => err);
    }),
  );
};
