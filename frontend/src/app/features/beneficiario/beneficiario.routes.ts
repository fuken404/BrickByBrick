import { Routes } from '@angular/router';

export const BENEFICIARIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../layout/app-shell/app-shell.component').then(m => m.AppShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.BeneficiarioDashboardComponent) },
      { path: 'materiales',       loadComponent: () => import('./materiales/materiales.component').then(m => m.MaterialesComponent) },
      { path: 'materiales/:id',   loadComponent: () => import('./material-detalle/material-detalle.component').then(m => m.MaterialDetalleComponent) },
      { path: 'eventos',          loadComponent: () => import('./eventos/eventos.component').then(m => m.EventosComponent) },
      { path: 'publicaciones',    loadComponent: () => import('./publicaciones/publicaciones.component').then(m => m.PublicacionesComponent) },
      { path: 'grupos',           loadComponent: () => import('./grupos/grupos.component').then(m => m.GruposComponent) },
      { path: 'mis-solicitudes',  loadComponent: () => import('./mis-solicitudes/mis-solicitudes.component').then(m => m.MisSolicitudesComponent) },
      { path: 'notificaciones',   loadComponent: () => import('./notificaciones/notificaciones.component').then(m => m.NotificacionesComponent) },
      { path: 'perfil',           loadComponent: () => import('./perfil/perfil.component').then(m => m.PerfilComponent) },
    ],
  },
];
