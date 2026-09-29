import { Routes } from '@angular/router';
import { RUTAS_COMUNES } from '../comun/comun.routes';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', title: 'Administración — BrickByBrick', loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.AdminDashboardComponent) },
      { path: 'usuarios', title: 'Usuarios — BrickByBrick', loadComponent: () => import('./usuarios/usuarios.component').then((m) => m.AdminUsuariosComponent) },
      { path: 'constructoras', title: 'Constructoras — BrickByBrick', loadComponent: () => import('./constructoras/constructoras.component').then((m) => m.AdminConstructorasComponent) },
      { path: 'materiales', title: 'Materiales — BrickByBrick', loadComponent: () => import('./materiales/materiales.component').then((m) => m.AdminMaterialesComponent) },
      { path: 'donaciones', title: 'Solicitudes — BrickByBrick', loadComponent: () => import('./donaciones/donaciones.component').then((m) => m.AdminDonacionesComponent) },
      { path: 'eventos', title: 'Eventos — BrickByBrick', loadComponent: () => import('./eventos/eventos.component').then((m) => m.AdminEventosComponent) },
      { path: 'eventos/:id', title: 'Evento — BrickByBrick', loadComponent: () => import('../comun/evento-gestion/evento-gestion.component').then((m) => m.EventoGestionComponent) },
      { path: 'moderacion', title: 'Moderación — BrickByBrick', loadComponent: () => import('./moderacion/moderacion.component').then((m) => m.AdminModeracionComponent) },
      { path: 'metricas', title: 'Métricas — BrickByBrick', loadComponent: () => import('./metricas/metricas.component').then((m) => m.AdminMetricasComponent) },
      { path: 'configuracion', title: 'Configuración — BrickByBrick', loadComponent: () => import('./configuracion/configuracion.component').then((m) => m.AdminConfiguracionComponent) },
      { path: 'auditoria', title: 'Auditoría — BrickByBrick', loadComponent: () => import('./auditoria/auditoria.component').then((m) => m.AdminAuditoriaComponent) },
      { path: 'perfil', title: 'Mi cuenta — BrickByBrick', loadComponent: () => import('./perfil/perfil.component').then((m) => m.AdminPerfilComponent) },
      ...RUTAS_COMUNES,
    ],
  },
];
