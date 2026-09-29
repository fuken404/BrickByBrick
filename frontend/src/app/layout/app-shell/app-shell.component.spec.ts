import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppShellComponent } from './app-shell.component';
import { AuthStore } from '../../core/auth/auth.store';
import { RolUsuario } from '../../core/models';

describe('Workspace navigation', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  const originalWidth = window.innerWidth;
  const ancho = (px: number) => Object.defineProperty(window, 'innerWidth', { configurable: true, value: px });

  function montar(rol: RolUsuario, px = 390) {
    ancho(px);
    TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(AuthStore).setSesion({
      accessToken: 't',
      user: { id: 'u1', email: 'test@example.test', rol, emailVerificado: true, mfaHabilitado: false, avatarUrl: null,
        perfil: rol === 'CONSTRUCTORA' ? { tipo: 'constructora', id: 'c1', razonSocial: 'Obras Andinas', verificada: true }
          : rol === 'BENEFICIARIO' ? { tipo: 'beneficiario', id: 'b1', nombreCompleto: 'Andrea Martínez' } : null },
    });
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
  }

  const el = () => fixture.nativeElement as HTMLElement;
  const toggle = () => el().querySelector<HTMLButtonElement>('.menu-toggle')!;

  afterEach(() => {
    fixture?.destroy();
    ancho(originalWidth);
  });

  it('exposes all role destinations from the mobile drawer and closes on Escape', () => {
    montar('BENEFICIARIO');
    toggle().click();
    fixture.detectChanges();
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(el().querySelector('.shell.mobile-open')).toBeTruthy();
    expect(el().querySelector('.main')?.hasAttribute('inert')).toBe(true);
    const links = Array.from(el().querySelectorAll<HTMLAnchorElement>('.sidebar-nav a'));
    expect(links).toHaveLength(9);
    expect(links.some((a) => a.getAttribute('href') === '/beneficiario/grupos')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(el().querySelector('.shell.mobile-open')).toBeNull();
  });

  it('keeps compact desktop navigation separate from the mobile drawer', () => {
    montar('BENEFICIARIO', 1440);
    toggle().click();
    fixture.detectChanges();
    expect(el().querySelector('.shell.sidebar-collapsed')).toBeTruthy();

    ancho(390);
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    expect(el().querySelector('.shell.sidebar-collapsed')).toBeNull();
    toggle().click();
    fixture.detectChanges();
    expect(el().querySelector('.mobile-open .logo-text')).toBeTruthy();
    expect(el().querySelectorAll('.sidebar-nav a .nav-label').length).toBe(9);
  });

  it('renders the admin destinations with notifications but without direct messages', () => {
    montar('ADMINISTRADOR');
    expect(el().querySelectorAll('.sidebar-nav a')).toHaveLength(12);
    expect(el().querySelector('.notif-btn')).toBeTruthy();
    expect(el().querySelector('a[aria-label="Mensajes"]')).toBeNull();
  });

  it('routes the account menu to the correct workspace', () => {
    montar('CONSTRUCTORA', 1440);
    el().querySelector<HTMLButtonElement>('.avatar-btn')!.click();
    fixture.detectChanges();
    const cuenta = Array.from(el().querySelectorAll<HTMLAnchorElement>('.user-menu a')).find((a) => a.textContent?.includes('Mi cuenta'));
    expect(cuenta?.getAttribute('href')).toBe('/empresa/perfil');
    expect(el().querySelector('.breadcrumb')?.textContent).toContain('Constructora');
  });
});
