import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { filter } from 'rxjs';
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
  imports: [RouterOutlet, RouterLink, CommonModule, MatIconModule, MatBadgeModule, MatTooltipModule],
  template: `
    <div class="shell" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar" [class.dark]="isDark()" [class.collapsed]="sidebarCollapsed()">
        <!-- Logo -->
        <div class="sidebar-logo">
          <div class="logo-icon">
            <mat-icon>layers</mat-icon>
          </div>
          @if (!sidebarCollapsed()) {
            <div class="logo-text">
              <span class="brand">BrickByBrick</span>
              <span class="role-label">{{ roleLabel() }}</span>
            </div>
          }
        </div>

        <!-- Nav items -->
        <nav class="sidebar-nav">
          @for (item of navItems(); track item.path) {
            <a class="nav-item" [class.active]="isActive(item.path)"
               [routerLink]="item.path" [matTooltip]="sidebarCollapsed() ? item.label : ''">
              <mat-icon>{{ item.icon }}</mat-icon>
              @if (!sidebarCollapsed()) {
                <span>{{ item.label }}</span>
                @if (item.badge && unreadCount() > 0) {
                  <span class="nav-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
                }
              }
            </a>
          }
        </nav>

        <!-- User section -->
        <div class="sidebar-user">
          @if (!sidebarCollapsed()) {
            <div class="user-info">
              <div class="user-avatar">{{ initials() }}</div>
              <div class="user-details">
                <span class="user-name">{{ userName() }}</span>
                <span class="user-email">{{ userEmail() }}</span>
              </div>
            </div>
          }
          <button class="logout-btn" (click)="logout()" matTooltip="Cerrar sesión">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <div class="main">
        <!-- Topbar -->
        <header class="topbar">
          <button class="menu-toggle" (click)="toggleSidebar()">
            <mat-icon>{{ sidebarCollapsed() ? 'menu_open' : 'menu' }}</mat-icon>
          </button>

          <div class="search-wrapper">
            <mat-icon class="search-icon">search</mat-icon>
            <input class="form-input search-input" placeholder="Buscar materiales, eventos..." />
          </div>

          <div class="topbar-actions">
            <button class="icon-btn notif-btn" (click)="goToNotifications()"
                    [matBadge]="unreadCount() > 0 ? unreadCount() : null"
                    matBadgeColor="warn" matBadgeSize="small">
              <mat-icon>notifications</mat-icon>
            </button>
            <div class="topbar-avatar" (click)="goToProfile()">{{ initials() }}</div>
          </div>
        </header>

        <!-- Page content -->
        <main class="content">
          <div class="content-inner">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>

    <!-- Mobile bottom nav -->
    <nav class="mobile-nav">
      @for (item of mobileNavItems(); track item.path) {
        <a class="mobile-nav-item" [class.active]="isActive(item.path)" [routerLink]="item.path">
          <mat-icon [matBadge]="item.badge && unreadCount() > 0 ? unreadCount() : null"
                    matBadgeColor="warn" matBadgeSize="small">{{ item.icon }}</mat-icon>
          <span>{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  protected readonly auth    = inject(AuthStore);
  protected readonly notifSvc = inject(NotificationService);
  protected readonly router  = inject(Router);

  protected readonly sidebarCollapsed = signal(false);
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
  protected readonly mobileNavItems = computed(() => this.navItems().slice(0, 5));

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

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
    if (window.innerWidth < 1024) this.sidebarCollapsed.set(true);
  }
}
