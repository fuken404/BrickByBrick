import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from './auth.store';
import { Sesion } from '../models';

const sesion = (token: string): Sesion => ({
  accessToken: token,
  user: { id: 'u1', email: 'a@b.co', rol: 'BENEFICIARIO', emailVerificado: true, mfaHabilitado: false, avatarUrl: null, perfil: null },
});

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let store: InstanceType<typeof AuthStore>;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
    store.setSesion(sesion('viejo'));
  });

  afterEach(() => backend.verify());

  it('adjunta el token solo a peticiones de la API', () => {
    http.get('/api/v1/materiales').subscribe();
    http.get('https://externo.com/datos').subscribe();
    expect(backend.expectOne('/api/v1/materiales').request.headers.get('Authorization')).toBe('Bearer viejo');
    expect(backend.expectOne('https://externo.com/datos').request.headers.has('Authorization')).toBe(false);
  });

  it('ante varios 401 simultáneos renueva la sesión una sola vez y reintenta', async () => {
    const a = firstValueFrom(http.get<string>('/api/v1/a'));
    const b = firstValueFrom(http.get<string>('/api/v1/b'));
    backend.expectOne('/api/v1/a').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/v1/b').flush(null, { status: 401, statusText: 'Unauthorized' });

    const refresh = backend.match('/api/v1/auth/refresh-token');
    expect(refresh).toHaveLength(1);
    refresh[0].flush({ success: true, message: '', data: sesion('nuevo') });

    const reintentoA = backend.expectOne('/api/v1/a');
    const reintentoB = backend.expectOne('/api/v1/b');
    expect(reintentoA.request.headers.get('Authorization')).toBe('Bearer nuevo');
    reintentoA.flush('ok-a');
    reintentoB.flush('ok-b');
    expect(await a).toBe('ok-a');
    expect(await b).toBe('ok-b');
  });

  it('si la renovación falla limpia la sesión y envía al login', async () => {
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const peticion = firstValueFrom(http.get('/api/v1/privado')).catch((e: unknown) => e);
    backend.expectOne('/api/v1/privado').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/v1/auth/refresh-token').flush(null, { status: 401, statusText: 'Unauthorized' });
    await peticion;
    expect(store.isAuthenticated()).toBe(false);
    expect(navegar).toHaveBeenCalledWith(['/login'], expect.objectContaining({ queryParams: expect.objectContaining({ sesion: 'expirada' }) }));
  });

  it('no intenta renovar cuando falla el propio login', async () => {
    const peticion = firstValueFrom(http.post('/api/v1/auth/login', {})).catch((e: unknown) => e);
    backend.expectOne('/api/v1/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
    await peticion;
    backend.expectNone('/api/v1/auth/refresh-token');
  });
});
