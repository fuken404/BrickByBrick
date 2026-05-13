import { Routes } from '@angular/router';
import { authGuard, noAuthGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // ─── Página pública ──────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
  },

  // ─── Auth (solo si NO está autenticado) ─────────────────────
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'registro',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/auth/register-select/register-select.component')
      .then(m => m.RegisterSelectComponent),
  },
  {
    path: 'registro/beneficiario',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/auth/register-beneficiario/register-beneficiario.component')
      .then(m => m.RegisterBeneficiarioComponent),
  },
  {
    path: 'registro/empresa',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/auth/register-empresa/register-empresa.component')
      .then(m => m.RegisterEmpresaComponent),
  },
  {
    path: 'verificar-email/:token',
    loadComponent: () => import('./features/auth/verify-email/verify-email.component')
      .then(m => m.VerifyEmailComponent),
  },
  {
    path: 'restablecer-password/:token',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent),
  },

  // ─── Beneficiario ────────────────────────────────────────────
  {
    path: 'beneficiario',
    canActivate: [authGuard, roleGuard(['BENEFICIARIO'])],
    loadChildren: () => import('./features/beneficiario/beneficiario.routes')
      .then(m => m.BENEFICIARIO_ROUTES),
  },

  // ─── Empresa (Constructora) ───────────────────────────────────
  {
    path: 'empresa',
    canActivate: [authGuard, roleGuard(['CONSTRUCTORA'])],
    loadChildren: () => import('./features/empresa/empresa.routes')
      .then(m => m.EMPRESA_ROUTES),
  },

  // ─── Admin ───────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMINISTRADOR'])],
    loadChildren: () => import('./features/admin/admin.routes')
      .then(m => m.ADMIN_ROUTES),
  },

  // ─── Fallback ────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: '',
  },
];
