import { Routes } from '@angular/router';

/** Rutas compartidas por los tres roles dentro de su propio layout. */
export const RUTAS_COMUNES: Routes = [
  { path: 'comunidad', title: 'Comunidad — BrickByBrick', loadComponent: () => import('./comunidad/feed/feed.component').then((m) => m.FeedComponent) },
  { path: 'comunidad/:id', title: 'Publicación — BrickByBrick', loadComponent: () => import('./comunidad/publicacion-detalle/publicacion-detalle.component').then((m) => m.PublicacionDetalleComponent) },
  { path: 'grupos', title: 'Grupos — BrickByBrick', loadComponent: () => import('./grupos/grupos.component').then((m) => m.GruposComponent) },
  { path: 'grupos/:id', title: 'Grupo — BrickByBrick', loadComponent: () => import('./grupos/grupo-detalle.component').then((m) => m.GrupoDetalleComponent) },
  { path: 'mensajes', title: 'Mensajes — BrickByBrick', loadComponent: () => import('./mensajes/mensajes.component').then((m) => m.MensajesComponent) },
  { path: 'mensajes/:id', title: 'Mensajes — BrickByBrick', loadComponent: () => import('./mensajes/mensajes.component').then((m) => m.MensajesComponent) },
  { path: 'usuarios/:id', title: 'Perfil — BrickByBrick', loadComponent: () => import('./perfil-publico/perfil-publico.component').then((m) => m.PerfilPublicoComponent) },
  { path: 'notificaciones', title: 'Notificaciones — BrickByBrick', loadComponent: () => import('./notificaciones/notificaciones.component').then((m) => m.NotificacionesComponent) },
];
