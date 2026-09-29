import { Component, inject, signal, computed, HostListener, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthStore } from '../../core/auth/auth.store';
import { NotificationService } from '../../core/services/notification.service';
import { RolUsuario } from '../../core/models';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  badge?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, MatIconModule, MatBadgeModule, MatTooltipModule, A11yModule],
  template: `
    <a class="skip-link" href="#main-content">Saltar al contenido</a>
    <div class="shell" [class.sidebar-collapsed]="sidebarCollapsed()" [class.mobile-open]="mobileOpen()">
      @if (mobileOpen()) { <div class="drawer-backdrop" (click)="closeMenu()" aria-hidden="true"></div> }
      <!-- Sidebar -->
      <aside id="main-navigation" class="sidebar" [class.collapsed]="sidebarCollapsed()" [cdkTrapFocus]="mobileOpen()" [cdkTrapFocusAutoCapture]="false" aria-label="Menú de la aplicación" [attr.role]="mobileOpen() ? 'dialog' : null" [attr.aria-modal]="mobileOpen() ? true : null">
        <!-- Logo -->
        <div class="sidebar-logo">
          <img class="logo-icon" src="favicon.svg" width="36" height="36" alt="" />
          @if (!sidebarCollapsed() || mobileOpen()) {
            <div class="logo-text">
              <span class="brand">BrickByBrick</span>
              <span class="role-label">{{ roleLabel() }}</span>
            </div>
          }
        </div>

        <button class="drawer-close" (click)="closeMenu()" aria-label="Cerrar menú"><mat-icon>close</mat-icon></button>
        <div class="nav-caption">TU ESPACIO DE TRABAJO</div>
        <!-- Nav items -->
        <nav class="sidebar-nav" aria-label="Secciones">
          @for (item of navItems(); track item.path) {
            <a class="nav-item" [class.active]="isActive(item.path)"
               [attr.aria-label]="item.label" [routerLink]="item.path" (click)="closeMenu()" [attr.aria-current]="isActive(item.path) ? 'page' : null" [matTooltip]="sidebarCollapsed() ? item.label : ''">
              <mat-icon>{{ item.icon }}</mat-icon>
              @if (!sidebarCollapsed() || mobileOpen()) {
                <span>{{ item.label }}</span>
                @if (item.badge && unreadCount() > 0) {
                  <span class="nav-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
                }
              }
            </a>
          }
        </nav>

        <div class="sidebar-purpose"><mat-icon>all_inclusive</mat-icon><strong>Cada material cuenta.</strong><span>Construyamos su siguiente historia.</span></div>
        <!-- User section -->
        <div class="sidebar-user">
          @if (!sidebarCollapsed() || mobileOpen()) {
            <div class="user-info">
              <div class="user-avatar">{{ initials() }}</div>
              <div class="user-details">
                <span class="user-name">{{ userName() }}</span>
                <span class="user-email">{{ userEmail() }}</span>
              </div>
            </div>
          }
          <button class="logout-btn" (click)="logout()" aria-label="Cerrar sesión" matTooltip="Cerrar sesión">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <div class="main" [attr.inert]="mobileOpen() ? '' : null">
        <!-- Topbar -->
        <header class="topbar">
          <button #menuToggle class="menu-toggle" (click)="toggleSidebar()" aria-label="Alternar menú de navegación" aria-controls="main-navigation" [attr.aria-expanded]="isMobile() ? mobileOpen() : !sidebarCollapsed()">
            <mat-icon>{{ sidebarCollapsed() ? 'menu_open' : 'menu' }}</mat-icon>
          </button>

          <div class="breadcrumb"><span>{{ roleLabel() }}</span><mat-icon>chevron_right</mat-icon><strong>{{ currentSection() }}</strong></div>

          <div class="topbar-actions">
            <span class="workspace-label"><span></span> Mi espacio</span>
            @if (!isDark()) {
            <button aria-label="Ver notificaciones" class="icon-btn notif-btn" (click)="goToNotifications()"
                    [matBadge]="unreadCount() > 0 ? unreadCount() : null"
                    matBadgeColor="warn" matBadgeSize="small">
              <mat-icon>notifications</mat-icon>
            </button>
            }
            <button class="topbar-avatar" (click)="goToProfile()" aria-label="Ver mi perfil">{{ initials() }}</button>
          </div>
        </header>

        <!-- Page content -->
        <main id="main-content" class="content" tabindex="-1">
          <div class="content-inner">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>

    <!-- Mobile bottom nav -->
    <nav class="mobile-nav" aria-label="Accesos rápidos" [attr.inert]="mobileOpen() ? '' : null">
      @for (item of mobileNavItems(); track item.path) {
        <a class="mobile-nav-item" [class.active]="isActive(item.path)" [routerLink]="item.path" [attr.aria-current]="isActive(item.path) ? 'page' : null">
          <mat-icon [matBadge]="item.badge && unreadCount() > 0 ? unreadCount() : null"
                    matBadgeColor="warn" matBadgeSize="small">{{ item.icon }}</mat-icon>
          <span>{{ item.label }}</span>
        </a>
      }
      <button class="mobile-nav-item mobile-more" (click)="toggleSidebar()" aria-label="Abrir todas las secciones" [attr.aria-expanded]="mobileOpen()"><mat-icon>menu</mat-icon><span>Más</span></button>
    </nav>
  `,
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  protected readonly auth    = inject(AuthStore);
  protected readonly notifSvc = inject(NotificationService);
  protected readonly router  = inject(Router);

  protected readonly sidebarCollapsed = signal(false);
  protected readonly mobileOpen = signal(false);
  protected readonly isMobile = signal(window.innerWidth < 1024);
  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;
  protected readonly unreadCount = this.notifSvc.unreadCount;

  protected readonly isDark = computed(() => this.auth.rol() === 'ADMINISTRADOR');

  protected readonly userName = computed(() => {
    const perfil = this.auth.perfil();
    if (!perfil) return 'Usuario';
    return 'nombreCompleto' in perfil ? perfil.nombreCompleto :
           'razonSocial'    in perfil ? perfil.razonSocial    : 'Usuario';
  });

  protected readonly userEmail  = computed(() => this.auth.userEmail());
  protected readonly initials   = computed(() => {
    const name = this.userName();
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  });
  protected readonly roleLabel  = computed(() => {
    const map: Record<RolUsuario, string> = {
      BENEFICIARIO: 'Beneficiario',
      CONSTRUCTORA: 'Constructora',
      ADMINISTRADOR: 'Administrador',
    };
    return map[this.auth.rol() ?? 'BENEFICIARIO'];
  });

  // Navigation definitions per role
  private readonly NAV_ITEMS: Record<RolUsuario, NavItem[]> = {
    BENEFICIARIO: [
      { path: '/beneficiario/dashboard',       icon: 'home',        label: 'Inicio' },
      { path: '/beneficiario/materiales',      icon: 'inventory_2', label: 'Materiales' },
      { path: '/beneficiario/eventos',         icon: 'event',       label: 'Eventos' },
      { path: '/beneficiario/publicaciones',   icon: 'article',     label: 'Publicaciones' },
      { path: '/beneficiario/mis-solicitudes', icon: 'layers',      label: 'Mis Solicitudes' },
      { path: '/beneficiario/grupos',          icon: 'group',       label: 'Grupos' },
      { path: '/beneficiario/notificaciones',  icon: 'notifications',label: 'Notificaciones', badge: true },
      { path: '/beneficiario/perfil',          icon: 'person',      label: 'Mi Perfil' },
    ],
    CONSTRUCTORA: [
      { path: '/empresa/dashboard',      icon: 'home',          label: 'Inicio' },
      { path: '/empresa/materiales',     icon: 'inventory_2',   label: 'Mis Materiales' },
      { path: '/empresa/eventos',        icon: 'event',         label: 'Eventos' },
      { path: '/empresa/publicaciones',   icon: 'article',       label: 'Comunidad' },
      { path: '/empresa/donaciones',     icon: 'volunteer_activism', label: 'Donaciones' },
      { path: '/empresa/tributario',     icon: 'percent',       label: 'Tributario' },
      { path: '/empresa/notificaciones', icon: 'notifications', label: 'Notificaciones', badge: true },
      { path: '/empresa/perfil',         icon: 'business',      label: 'Perfil Empresa' },
    ],
    ADMINISTRADOR: [
      { path: '/admin/dashboard',     icon: 'dashboard',     label: 'Dashboard' },
      { path: '/admin/beneficiarios', icon: 'group',         label: 'Beneficiarios' },
      { path: '/admin/constructoras', icon: 'business',      label: 'Constructoras' },
      { path: '/admin/materiales',    icon: 'inventory_2',   label: 'Materiales' },
      { path: '/admin/donaciones',    icon: 'volunteer_activism', label: 'Donaciones' },
      { path: '/admin/eventos',       icon: 'event',         label: 'Eventos' },
      { path: '/admin/publicaciones', icon: 'article',       label: 'Publicaciones' },
      { path: '/admin/reportes',      icon: 'bar_chart',     label: 'Reportes' },
      { path: '/admin/configuracion', icon: 'settings',      label: 'Configuración' },
      { path: '/admin/perfil',        icon: 'manage_accounts', label: 'Mi perfil' },
    ],
  };

  protected readonly navItems = computed(() => this.NAV_ITEMS[this.auth.rol() ?? 'BENEFICIARIO']);
  protected readonly mobileNavItems = computed(() => this.navItems().slice(0, 4));

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  currentSection(): string {
    return this.navItems().find(item => this.isActive(item.path))?.label ?? 'Mi espacio';
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      if (this.mobileOpen()) this.closeMenu();
      else {
        this.mobileOpen.set(true);
        setTimeout(() => document.querySelector<HTMLButtonElement>('.drawer-close')?.focus());
      }
    } else this.sidebarCollapsed.update(v => !v);
  }

  closeMenu(): void {
    if (this.mobileOpen()) {
      this.mobileOpen.set(false);
      this.menuToggle?.nativeElement.focus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeMenu(); }

  logout(): void {
    this.auth.clearAuth();
    this.notifSvc.disconnect();
    this.router.navigate(['/login']);
  }

  goToNotifications(): void {
    const rol = this.auth.rol();
    if (rol === 'BENEFICIARIO') this.router.navigate(['/beneficiario/notificaciones']);
    else if (rol === 'CONSTRUCTORA') this.router.navigate(['/empresa/notificaciones']);
  }

  goToProfile(): void {
    const rol = this.auth.rol();
    if (rol === 'BENEFICIARIO')   this.router.navigate(['/beneficiario/perfil']);
    else if (rol === 'CONSTRUCTORA')  this.router.navigate(['/empresa/perfil']);
    else if (rol === 'ADMINISTRADOR') this.router.navigate(['/admin/perfil']);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth < 1024);
    if (!this.isMobile()) this.closeMenu();
  }
}
