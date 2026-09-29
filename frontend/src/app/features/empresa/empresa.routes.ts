import { Routes } from '@angular/router';
import { RUTAS_COMUNES } from '../comun/comun.routes';

export const EMPRESA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', title: 'Panel de empresa — BrickByBrick', loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.EmpresaDashboardComponent) },
      { path: 'materiales', title: 'Mis materiales — BrickByBrick', loadComponent: () => import('./materiales/materiales.component').then((m) => m.EmpresaMaterialesComponent) },
      { path: 'materiales/nuevo', title: 'Publicar material — BrickByBrick', loadComponent: () => import('./material-form/material-form.component').then((m) => m.MaterialFormComponent) },
      { path: 'materiales/:id/editar', title: 'Editar material — BrickByBrick', loadComponent: () => import('./material-form/material-form.component').then((m) => m.MaterialFormComponent) },
      { path: 'donaciones', title: 'Solicitudes recibidas — BrickByBrick', loadComponent: () => import('./donaciones/donaciones.component').then((m) => m.DonacionesComponent) },
      { path: 'eventos', title: 'Mis eventos — BrickByBrick', loadComponent: () => import('./eventos/eventos.component').then((m) => m.EmpresaEventosComponent) },
      { path: 'eventos/nuevo', title: 'Crear evento — BrickByBrick', loadComponent: () => import('./evento-form/evento-form.component').then((m) => m.EventoFormComponent) },
      { path: 'eventos/:id/editar', title: 'Editar evento — BrickByBrick', loadComponent: () => import('./evento-form/evento-form.component').then((m) => m.EventoFormComponent) },
      { path: 'eventos/:id', title: 'Evento — BrickByBrick', loadComponent: () => import('../comun/evento-gestion/evento-gestion.component').then((m) => m.EventoGestionComponent) },
      { path: 'tributario', title: 'Beneficio tributario — BrickByBrick', loadComponent: () => import('./tributario/tributario.component').then((m) => m.TributarioComponent) },
      { path: 'perfil', title: 'Perfil de empresa — BrickByBrick', loadComponent: () => import('./perfil/perfil.component').then((m) => m.EmpresaPerfilComponent) },
      ...RUTAS_COMUNES,
    ],
  },
];
