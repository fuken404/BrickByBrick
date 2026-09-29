import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthStore } from '../../core/auth/auth.store';
import { NotificationStore } from '../../core/stores/notification.store';
import { NotificationApiService } from '../../core/services/notification-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';
import { Notificacion, RolUsuario } from '../../core/models';
import { mensajeError } from '../../core/utils/http';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { FechaRelativaPipe } from '../../shared/pipes/fecha-relativa.pipe';

interface NavItem { ruta: string; icon: string; label: string; badge?: 'notif' | 'mensajes'; movil?: boolean }

const NAV: Record<RolUsuario, NavItem[]> = {
  BENEFICIARIO: [
    { ruta: 'dashboard', icon: 'home', label: 'Inicio', movil: true },
    { ruta: 'materiales', icon: 'inventory_2', label: 'Materiales', movil: true },
    { ruta: 'eventos', icon: 'event', label: 'Eventos', movil: true },
    { ruta: 'mis-solicitudes', icon: 'assignment', label: 'Mis solicitudes' },
    { ruta: 'comunidad', icon: 'forum', label: 'Comunidad', movil: true },
    { ruta: 'grupos', icon: 'groups', label: 'Grupos' },
    { ruta: 'mensajes', icon: 'chat', label: 'Mensajes', badge: 'mensajes' },
    { ruta: 'notificaciones', icon: 'notifications', label: 'Notificaciones', badge: 'notif' },
    { ruta: 'perfil', icon: 'person', label: 'Mi perfil' },
  ],
  CONSTRUCTORA: [
    { ruta: 'dashboard', icon: 'home', label: 'Inicio', movil: true },
    { ruta: 'materiales', icon: 'inventory_2', label: 'Mis materiales', movil: true },
    { ruta: 'donaciones', icon: 'volunteer_activism', label: 'Solicitudes', movil: true },
    { ruta: 'eventos', icon: 'event', label: 'Eventos', movil: true },
    { ruta: 'tributario', icon: 'receipt_long', label: 'Beneficio tributario' },
    { ruta: 'comunidad', icon: 'forum', label: 'Comunidad' },
    { ruta: 'grupos', icon: 'groups', label: 'Grupos' },
    { ruta: 'mensajes', icon: 'chat', label: 'Mensajes', badge: 'mensajes' },
    { ruta: 'notificaciones', icon: 'notifications', label: 'Notificaciones', badge: 'notif' },
    { ruta: 'perfil', icon: 'business', label: 'Perfil de empresa' },
  ],
  ADMINISTRADOR: [
    { ruta: 'dashboard', icon: 'dashboard', label: 'Dashboard', movil: true },
    { ruta: 'usuarios', icon: 'manage_accounts', label: 'Usuarios', movil: true },
    { ruta: 'constructoras', icon: 'business', label: 'Constructoras' },
    { ruta: 'materiales', icon: 'inventory_2', label: 'Materiales' },
    { ruta: 'donaciones', icon: 'volunteer_activism', label: 'Solicitudes' },
    { ruta: 'eventos', icon: 'event', label: 'Eventos' },
    { ruta: 'moderacion', icon: 'shield', label: 'Moderación', movil: true },
    { ruta: 'metricas', icon: 'insights', label: 'Métricas', movil: true },
    { ruta: 'comunidad', icon: 'forum', label: 'Comunidad' },
    { ruta: 'configuracion', icon: 'settings', label: 'Configuración' },
    { ruta: 'auditoria', icon: 'history', label: 'Auditoría' },
    { ruta: 'perfil', icon: 'admin_panel_settings', label: 'Mi cuenta' },
  ],
};

const BUSQUEDA: Record<RolUsuario, { ruta: string; placeholder: string }> = {
  BENEFICIARIO: { ruta: 'materiales', placeholder: 'Buscar materiales…' },
  CONSTRUCTORA: { ruta: 'materiales', placeholder: 'Buscar en mis materiales…' },
  ADMINISTRADOR: { ruta: 'usuarios', placeholder: 'Buscar usuarios por nombre, cédula o NIT…' },
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, MatIconModule, MatTooltipModule, AvatarComponent, ClickOutsideDirective, FechaRelativaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly contadores = inject(NotificationStore);
  private readonly notifApi = inject(NotificationApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly colapsado = signal(false);
  protected readonly drawerAbierto = signal(false);
  protected readonly panelNotif = signal(false);
  protected readonly menuUsuario = signal(false);
  protected readonly ultimas = signal<Notificacion[]>([]);
  protected readonly cargandoNotif = signal(false);
  protected readonly reenviando = signal(false);
  protected busqueda = '';

  protected readonly rol = computed(() => this.auth.rol() ?? 'BENEFICIARIO');
  protected readonly prefijo = computed(() => this.auth.prefijo());
  protected readonly items = computed(() => NAV[this.rol()]);
  protected readonly itemsMovil = computed(() => this.items().filter((i) => i.movil));
  protected readonly oscuro = computed(() => this.rol() === 'ADMINISTRADOR');
  protected readonly buscador = computed(() => BUSQUEDA[this.rol()]);
  protected readonly etiquetaRol = computed(() => ({ BENEFICIARIO: 'Beneficiario', CONSTRUCTORA: 'Constructora', ADMINISTRADOR: 'Administrador' })[this.rol()]);
  protected readonly empresaPendiente = computed(() => {
    const p = this.auth.user()?.perfil;
    return p?.tipo === 'constructora' && !p.verificada;
  });

  constructor() {
    this.ajustarAncho();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef))).subscribe(() => {
      this.drawerAbierto.set(false);
      this.panelNotif.set(false);
      this.menuUsuario.set(false);
    });
  }

  protected contador(item: NavItem): number {
    if (item.badge === 'notif') return this.contadores.noLeidas();
    if (item.badge === 'mensajes') return this.contadores.mensajesNoLeidos();
    return 0;
  }

  protected buscar(): void {
    const q = this.busqueda.trim();
    this.router.navigate([this.prefijo(), this.buscador().ruta], { queryParams: q ? { q } : {} });
    this.busqueda = '';
  }

  protected alternarNotificaciones(): void {
    const abrir = !this.panelNotif();
    this.panelNotif.set(abrir);
    this.menuUsuario.set(false);
    if (!abrir) return;
    this.cargandoNotif.set(true);
    this.notifApi.listar({ limit: 8 }).subscribe({
      next: (r) => {
        this.ultimas.set(r.data.items);
        this.contadores.noLeidas.set(r.data.noLeidas);
        this.cargandoNotif.set(false);
      },
      error: () => this.cargandoNotif.set(false),
    });
  }

  protected abrirNotificacion(n: Notificacion): void {
    if (!n.leida) {
      this.notifApi.marcarLeida(n.id).subscribe(() => this.contadores.descontar());
      this.ultimas.update((l) => l.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
    }
    this.panelNotif.set(false);
    if (n.urlDestino) this.router.navigateByUrl(n.urlDestino);
  }

  protected marcarTodas(): void {
    this.notifApi.marcarTodas().subscribe(() => {
      this.ultimas.update((l) => l.map((x) => ({ ...x, leida: true })));
      this.contadores.noLeidas.set(0);
    });
  }

  protected reenviarVerificacion(): void {
    this.reenviando.set(true);
    this.authApi.reenviarVerificacion().subscribe({
      next: (r) => { this.toast.exito(r.message); this.reenviando.set(false); },
      error: (e) => { this.toast.error(mensajeError(e)); this.reenviando.set(false); },
    });
  }

  protected cerrarSesion(): void {
    this.auth.cerrarSesion().subscribe(() => this.router.navigate(['/login']));
  }

  @HostListener('window:resize')
  protected ajustarAncho(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 1280 && window.innerWidth >= 1024) this.colapsado.set(true);
  }

  @HostListener('document:keydown.escape')
  protected cerrarPaneles(): void {
    this.panelNotif.set(false);
    this.menuUsuario.set(false);
    this.drawerAbierto.set(false);
  }
}
