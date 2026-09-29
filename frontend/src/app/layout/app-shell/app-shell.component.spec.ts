import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { AppShellComponent } from './app-shell.component';
import { AuthStore } from '../../core/auth/auth.store';
import { NotificationService } from '../../core/services/notification.service';

describe('Workspace navigation', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  const role = signal('BENEFICIARIO');
  const originalWidth = window.innerWidth;

  beforeEach(async () => {
    role.set('BENEFICIARIO');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { rol: role, perfil: signal({ nombreCompleto: 'Andrea Martínez' }), userEmail: signal('test@example.test'), clearAuth: vi.fn() } },
        { provide: NotificationService, useValue: { unreadCount: signal(3), disconnect: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
  });

  it('exposes all role destinations from the mobile drawer and closes on Escape', () => {
    const menu: HTMLButtonElement = fixture.nativeElement.querySelector('.menu-toggle');
    menu.click();
    fixture.detectChanges();
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.shell.mobile-open')).toBeTruthy();
    const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('.sidebar-nav a'));
    expect(links).toHaveLength(8);
    expect(links.some(a => a.getAttribute('href') === '/beneficiario/grupos')).toBe(true);
    fixture.componentInstance.onEscape();
    fixture.detectChanges();
    expect(menu.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps compact desktop navigation separate from the mobile drawer', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    fixture.componentInstance.onResize();
    fixture.componentInstance.toggleSidebar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.shell.sidebar-collapsed')).toBeTruthy();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    fixture.componentInstance.onResize();
    fixture.componentInstance.toggleSidebar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mobile-open .logo-text')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.sidebar-nav a span').length).toBeGreaterThan(7);
  });

  it('renders the admin destinations without a notification button that has no destination', () => {
    role.set('ADMINISTRADOR');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.sidebar-nav a')).toHaveLength(10);
    expect(fixture.nativeElement.querySelector('.notif-btn')).toBeNull();
  });

  it('routes the profile action to the correct workspace', () => {
    role.set('CONSTRUCTORA');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.goToProfile();
    expect(navigate).toHaveBeenCalledWith(['/empresa/perfil']);
  });
});
