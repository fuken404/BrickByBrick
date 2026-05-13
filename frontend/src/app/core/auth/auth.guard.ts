import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';
import { RolUsuario } from '../models';

/** Redirige a /login si no hay token */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthStore);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  router.navigate(['/login']);
  return false;
};

/** Redirige al dashboard si ya está autenticado (para login/register) */
export const noAuthGuard: CanActivateFn = () => {
  const auth   = inject(AuthStore);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true;

  router.navigate([auth.dashboardRoute()]);
  return false;
};

/**
 * Verifica que el usuario tenga uno de los roles permitidos.
 * Uso: canActivate: [authGuard, roleGuard(['BENEFICIARIO'])]
 */
export function roleGuard(roles: RolUsuario[]): CanActivateFn {
  return () => {
    const auth   = inject(AuthStore);
    const router = inject(Router);

    const rol = auth.rol();
    if (rol && roles.includes(rol)) return true;

    // Redirigir al dashboard del rol actual o al login
    if (auth.isAuthenticated()) {
      router.navigate([auth.dashboardRoute()]);
    } else {
      router.navigate(['/login']);
    }
    return false;
  };
}
