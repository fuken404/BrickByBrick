import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Observable, catchError, finalize, firstValueFrom, map, of, shareReplay, tap, throwError } from 'rxjs';
import { AuthApiService } from '../services/auth-api.service';
import { RolUsuario, Sesion, UsuarioSesion } from '../models';

type EstadoSesion = 'inicializando' | 'autenticado' | 'anonimo';

interface AuthState {
  user: UsuarioSesion | null;
  accessToken: string | null;
  estado: EstadoSesion;
}

const PREFIJOS: Record<RolUsuario, string> = {
  BENEFICIARIO: '/beneficiario',
  CONSTRUCTORA: '/empresa',
  ADMINISTRADOR: '/admin',
};

/**
 * Sesión del usuario. El access token vive solo en memoria; al recargar la
 * página se recupera con el refresh token (cookie httpOnly) en init().
 */
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>({ user: null, accessToken: null, estado: 'inicializando' }),

  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.accessToken() && !!store.user()),
    rol: computed(() => store.user()?.rol ?? null),
    isAdmin: computed(() => store.user()?.rol === 'ADMINISTRADOR'),
    isEmpresa: computed(() => store.user()?.rol === 'CONSTRUCTORA'),
    isBeneficiario: computed(() => store.user()?.rol === 'BENEFICIARIO'),
    prefijo: computed(() => (store.user() ? PREFIJOS[store.user()!.rol] : '')),
    nombre: computed(() => {
      const u = store.user();
      if (!u) return '';
      if (u.perfil?.tipo === 'constructora') return u.perfil.razonSocial ?? '';
      if (u.perfil?.tipo === 'beneficiario') return u.perfil.nombreCompleto ?? '';
      return u.rol === 'ADMINISTRADOR' ? 'Administración' : u.email;
    }),
  })),

  withMethods((store, api = inject(AuthApiService)) => {
    let refresco$: Observable<string> | null = null;

    const setSesion = (sesion: Sesion) =>
      patchState(store, { user: sesion.user, accessToken: sesion.accessToken, estado: 'autenticado' });

    const limpiar = () => patchState(store, { user: null, accessToken: null, estado: 'anonimo' });

    return {
      setSesion,
      limpiar,

      actualizarUsuario(cambios: Partial<UsuarioSesion>) {
        const actual = store.user();
        if (actual) patchState(store, { user: { ...actual, ...cambios } });
      },

      actualizarPerfil(cambios: Partial<NonNullable<UsuarioSesion['perfil']>>) {
        const actual = store.user();
        if (actual?.perfil) patchState(store, { user: { ...actual, perfil: { ...actual.perfil, ...cambios } } });
      },

      rutaInicio(): string {
        const u = store.user();
        return u ? `${PREFIJOS[u.rol]}/dashboard` : '/login';
      },

      /**
       * Renueva el access token una sola vez aunque varias peticiones
       * reciban 401 al mismo tiempo (single-flight).
       */
      refrescar(): Observable<string> {
        if (!refresco$) {
          refresco$ = api.refresh().pipe(
            map((r) => r.data),
            tap((sesion) => setSesion(sesion)),
            map((sesion) => sesion.accessToken),
            catchError((err: unknown) => {
              limpiar();
              return throwError(() => err);
            }),
            finalize(() => { refresco$ = null; }),
            shareReplay(1),
          );
        }
        return refresco$;
      },

      /** Se ejecuta antes del primer render (provideAppInitializer). */
      async init(): Promise<void> {
        await firstValueFrom(
          api.refresh().pipe(
            tap((r) => setSesion(r.data)),
            map(() => undefined),
            catchError(() => {
              limpiar();
              return of(undefined);
            }),
          ),
        );
      },

      cerrarSesion(): Observable<unknown> {
        return api.logout().pipe(
          catchError(() => of(null)),
          finalize(() => limpiar()),
        );
      },
    };
  }),
);
