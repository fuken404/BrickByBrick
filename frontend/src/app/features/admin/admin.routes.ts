import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../layout/app-shell/app-shell.component').then(m => m.AppShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',      loadComponent: () => import('./dashboard/dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'beneficiarios',  loadComponent: () => import('./beneficiarios/beneficiarios.component').then(m => m.AdminBeneficiariosComponent) },
      { path: 'constructoras',  loadComponent: () => import('./constructoras/constructoras.component').then(m => m.AdminConstructorasComponent) },
      { path: 'materiales',     loadComponent: () => import('./materiales/materiales.component').then(m => m.AdminMaterialesComponent) },
      { path: 'donaciones',     loadComponent: () => import('./donaciones/donaciones.component').then(m => m.AdminDonacionesComponent) },
      { path: 'eventos',        loadComponent: () => import('./eventos/eventos.component').then(m => m.AdminEventosComponent) },
      { path: 'publicaciones',  loadComponent: () => import('./publicaciones/publicaciones.component').then(m => m.AdminPublicacionesComponent) },
      { path: 'reportes',       loadComponent: () => import('./reportes/reportes.component').then(m => m.AdminReportesComponent) },
      { path: 'configuracion',  loadComponent: () => import('./configuracion/configuracion.component').then(m => m.AdminConfiguracionComponent) },
      { path: 'perfil',         loadComponent: () => import('./perfil/perfil.component').then(m => m.AdminPerfilComponent) },
    ],
  },
];
