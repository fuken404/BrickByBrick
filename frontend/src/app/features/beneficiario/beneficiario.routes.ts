import { Routes } from '@angular/router';
import { RUTAS_COMUNES } from '../comun/comun.routes';

export const BENEFICIARIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', title: 'Inicio — BrickByBrick', loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.BeneficiarioDashboardComponent) },
      { path: 'materiales', title: 'Materiales — BrickByBrick', loadComponent: () => import('./materiales/materiales.component').then((m) => m.MaterialesComponent) },
      { path: 'materiales/:id', title: 'Material — BrickByBrick', loadComponent: () => import('./material-detalle/material-detalle.component').then((m) => m.MaterialDetalleComponent) },
      { path: 'eventos', title: 'Eventos — BrickByBrick', loadComponent: () => import('./eventos/eventos.component').then((m) => m.EventosComponent) },
      { path: 'eventos/:id', title: 'Evento — BrickByBrick', loadComponent: () => import('./evento-detalle/evento-detalle.component').then((m) => m.EventoDetalleComponent) },
      { path: 'mis-solicitudes', title: 'Mis solicitudes — BrickByBrick', loadComponent: () => import('./mis-solicitudes/mis-solicitudes.component').then((m) => m.MisSolicitudesComponent) },
      { path: 'perfil', title: 'Mi perfil — BrickByBrick', loadComponent: () => import('./perfil/perfil.component').then((m) => m.PerfilComponent) },
      ...RUTAS_COMUNES,
    ],
  },
];
