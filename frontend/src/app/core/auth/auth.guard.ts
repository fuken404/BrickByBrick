import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';
import { RolUsuario } from '../models';

/** Exige sesión; si no hay, envía al login conservando la ruta pedida. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStore);
  if (auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Para login/registro: si ya hay sesión, va al inicio de su rol. */
export const noAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  if (!auth.isAuthenticated()) return true;
  return inject(Router).parseUrl(auth.rutaInicio());
};

/** Restringe la ruta a ciertos roles. */
export function roleGuard(roles: RolUsuario[]): CanActivateFn {
  return () => {
    const auth = inject(AuthStore);
    const rol = auth.rol();
    if (rol && roles.includes(rol)) return true;
    return inject(Router).parseUrl(auth.isAuthenticated() ? auth.rutaInicio() : '/login');
  };
}
