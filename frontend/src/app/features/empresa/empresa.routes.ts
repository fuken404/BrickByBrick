import { Routes } from '@angular/router';

export const EMPRESA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../layout/app-shell/app-shell.component').then(m => m.AppShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',     loadComponent: () => import('./dashboard/dashboard.component').then(m => m.EmpresaDashboardComponent) },
      { path: 'materiales',    loadComponent: () => import('./materiales/materiales.component').then(m => m.EmpresaMaterialesComponent) },
      { path: 'materiales/nuevo',     loadComponent: () => import('./material-form/material-form.component').then(m => m.MaterialFormComponent) },
      { path: 'materiales/:id/editar',loadComponent: () => import('./material-form/material-form.component').then(m => m.MaterialFormComponent) },
      { path: 'eventos',       loadComponent: () => import('./eventos/eventos.component').then(m => m.EmpresaEventosComponent) },
      { path: 'eventos/nuevo',        loadComponent: () => import('./evento-form/evento-form.component').then(m => m.EventoFormComponent) },
      { path: 'eventos/:id/editar',   loadComponent: () => import('./evento-form/evento-form.component').then(m => m.EventoFormComponent) },
      { path: 'publicaciones', loadComponent: () => import('../beneficiario/publicaciones/publicaciones.component').then(m => m.PublicacionesComponent) },
      { path: 'donaciones',    loadComponent: () => import('./donaciones/donaciones.component').then(m => m.DonacionesComponent) },
      { path: 'tributario',    loadComponent: () => import('./tributario/tributario.component').then(m => m.TributarioComponent) },
      { path: 'notificaciones',loadComponent: () => import('./notificaciones/notificaciones.component').then(m => m.EmpresaNotificacionesComponent) },
      { path: 'perfil',        loadComponent: () => import('./perfil/perfil.component').then(m => m.EmpresaPerfilComponent) },
    ],
  },
];
