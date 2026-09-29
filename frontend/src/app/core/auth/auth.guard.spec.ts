import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { authGuard, noAuthGuard, roleGuard } from './auth.guard';
import { AuthStore } from './auth.store';
import { RolUsuario } from '../models';

const ruta = {} as ActivatedRouteSnapshot;
const estado = (url: string) => ({ url }) as RouterStateSnapshot;

describe('guards de autenticación', () => {
  let store: InstanceType<typeof AuthStore>;
  let router: Router;

  const ejecutar = <T>(fn: () => T) => TestBed.runInInjectionContext(fn);
  const iniciar = (rol: RolUsuario) => store.setSesion({
    accessToken: 't',
    user: { id: 'u', email: 'x@y.co', rol, emailVerificado: true, mfaHabilitado: false, avatarUrl: null, perfil: null },
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
  });

  it('authGuard envía al login conservando la ruta pedida', () => {
    const res = ejecutar(() => authGuard(ruta, estado('/empresa/tributario'))) as UrlTree;
    expect(router.serializeUrl(res)).toBe('/login?returnUrl=%2Fempresa%2Ftributario');
  });

  it('authGuard deja pasar con sesión', () => {
    iniciar('BENEFICIARIO');
    expect(ejecutar(() => authGuard(ruta, estado('/beneficiario')))).toBe(true);
  });

  it('roleGuard redirige al inicio del propio rol', () => {
    iniciar('BENEFICIARIO');
    const res = ejecutar(() => roleGuard(['ADMINISTRADOR'])(ruta, estado('/admin'))) as UrlTree;
    expect(router.serializeUrl(res)).toBe('/beneficiario/dashboard');
    expect(ejecutar(() => roleGuard(['BENEFICIARIO'])(ruta, estado('/beneficiario')))).toBe(true);
  });

  it('noAuthGuard saca del login a quien ya tiene sesión', () => {
    iniciar('CONSTRUCTORA');
    const res = ejecutar(() => noAuthGuard(ruta, estado('/login'))) as UrlTree;
    expect(router.serializeUrl(res)).toBe('/empresa/dashboard');
  });
});
