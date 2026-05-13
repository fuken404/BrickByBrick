import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthStore } from './auth.store';
import { AuthApiService } from '../services/auth-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Adjunta el Bearer token a todas las requests */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthStore);
  const token = auth.accessToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq);
};

/** Captura errores 401, 403 y 500 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth    = inject(AuthStore);
  const authApi = inject(AuthApiService);
  const router  = inject(Router);
  const snack   = inject(MatSnackBar);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        // Intentar refresh
        return authApi.refreshToken().pipe(
          switchMap((res) => {
            auth.updateAccessToken(res.data.accessToken);
            const retried = req.clone({
              setHeaders: { Authorization: `Bearer ${res.data.accessToken}` },
            });
            return next(retried);
          }),
          catchError(() => {
            auth.clearAuth();
            router.navigate(['/login']);
            return throwError(() => err);
          })
        );
      }

      if (err.status === 403) {
        router.navigate([auth.dashboardRoute()]);
      }

      if (err.status >= 500) {
        snack.open('Error del servidor. Intenta de nuevo.', 'Cerrar', {
          duration: 4000,
          panelClass: 'error',
        });
      }

      return throwError(() => err);
    })
  );
};

/** Spinner global — puedes conectar esto a un servicio LoadingService */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // Excluir llamadas de polling o background
  const skipLoading = req.headers.get('X-Skip-Loading') === 'true';
  if (skipLoading) return next(req);

  // Aquí se inyectaría LoadingService si se implementa
  return next(req);
};
