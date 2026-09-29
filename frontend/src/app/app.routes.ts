import { Routes } from '@angular/router';
import { authGuard, noAuthGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', title: 'BrickByBrick — Donación de materiales de construcción', loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent) },

  // ─── Autenticación ───────────────────────────────────────────
  { path: 'login', title: 'Ingresar — BrickByBrick', canActivate: [noAuthGuard], loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent) },
  { path: 'registro', title: 'Crear cuenta — BrickByBrick', canActivate: [noAuthGuard], loadComponent: () => import('./features/auth/register-select/register-select.component').then((m) => m.RegisterSelectComponent) },
  { path: 'registro/beneficiario', title: 'Registro de beneficiario — BrickByBrick', canActivate: [noAuthGuard], loadComponent: () => import('./features/auth/register-beneficiario/register-beneficiario.component').then((m) => m.RegisterBeneficiarioComponent) },
  { path: 'registro/empresa', title: 'Registro de constructora — BrickByBrick', canActivate: [noAuthGuard], loadComponent: () => import('./features/auth/register-empresa/register-empresa.component').then((m) => m.RegisterEmpresaComponent) },
  { path: 'recuperar-password', title: 'Recuperar contraseña — BrickByBrick', loadComponent: () => import('./features/auth/recuperar-password/recuperar-password.component').then((m) => m.RecuperarPasswordComponent) },
  { path: 'restablecer-password/:token', title: 'Nueva contraseña — BrickByBrick', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent) },
  { path: 'verificar-email/:token', title: 'Verificar correo — BrickByBrick', loadComponent: () => import('./features/auth/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent) },

  // ─── Legal ───────────────────────────────────────────────────
  { path: 'terminos', title: 'Términos de uso — BrickByBrick', loadComponent: () => import('./features/legal/terminos.component').then((m) => m.TerminosComponent) },
  { path: 'privacidad', title: 'Tratamiento de datos — BrickByBrick', loadComponent: () => import('./features/legal/privacidad.component').then((m) => m.PrivacidadComponent) },

  // ─── Áreas por rol ───────────────────────────────────────────
  { path: 'beneficiario', canActivate: [authGuard, roleGuard(['BENEFICIARIO'])], loadChildren: () => import('./features/beneficiario/beneficiario.routes').then((m) => m.BENEFICIARIO_ROUTES) },
  { path: 'empresa', canActivate: [authGuard, roleGuard(['CONSTRUCTORA'])], loadChildren: () => import('./features/empresa/empresa.routes').then((m) => m.EMPRESA_ROUTES) },
  { path: 'admin', canActivate: [authGuard, roleGuard(['ADMINISTRADOR'])], loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES) },

  { path: '**', title: 'Página no encontrada — BrickByBrick', loadComponent: () => import('./features/legal/no-encontrado.component').then((m) => m.NoEncontradoComponent) },
];
