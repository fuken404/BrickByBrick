import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { computed } from '@angular/core';
import { tap, switchMap, catchError, EMPTY } from 'rxjs';
import { AuthState, AuthResponse, RolUsuario } from '../models';

const AUTH_STORAGE_KEY = 'bbb_auth';

function loadFromStorage(): Partial<AuthState> {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<AuthState>;
  } catch {
    return {};
  }
}

const initialState: AuthState = {
  user:        loadFromStorage().user        ?? null,
  accessToken: loadFromStorage().accessToken ?? null,
  isLoading:   false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>(initialState),

  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.accessToken()),
    rol:             computed(() => store.user()?.rol ?? null),
    isAdmin:         computed(() => store.user()?.rol === 'ADMINISTRADOR'),
    isEmpresa:       computed(() => store.user()?.rol === 'CONSTRUCTORA'),
    isBeneficiario:  computed(() => store.user()?.rol === 'BENEFICIARIO'),
    userEmail:       computed(() => store.user()?.email ?? ''),
    perfil:          computed(() => store.user()?.perfil ?? null),
  })),

  withMethods((store) => ({
    setAuth(response: AuthResponse) {
      patchState(store, {
        user:        response.user,
        accessToken: response.accessToken,
        isLoading:   false,
      });
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user:        response.user,
        accessToken: response.accessToken,
      }));
    },

    updateAccessToken(token: string) {
      patchState(store, { accessToken: token });
      const stored = loadFromStorage();
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...stored, accessToken: token }));
    },

    clearAuth() {
      patchState(store, { user: null, accessToken: null, isLoading: false });
      localStorage.removeItem(AUTH_STORAGE_KEY);
    },

    setLoading(isLoading: boolean) {
      patchState(store, { isLoading });
    },

    dashboardRoute(): string {
      const rol = store.user()?.rol;
      if (rol === 'ADMINISTRADOR') return '/admin/dashboard';
      if (rol === 'CONSTRUCTORA')  return '/empresa/dashboard';
      return '/beneficiario/dashboard';
    },
  }))
);
