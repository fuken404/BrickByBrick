import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register-select',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-layout">
      <!-- Left panel -->
      <div class="auth-left">
        <div class="auth-left-inner">
          <div class="auth-brand">
            <div class="brand-icon"><mat-icon>layers</mat-icon></div>
            <h1>BrickByBrick</h1>
          </div>
          <p class="auth-tagline">Únete a la red de economía circular de materiales de construcción en Bogotá.</p>
          <div class="auth-stats">
            <div class="stat-item"><mat-icon>check_circle</mat-icon><span>3.400 familias beneficiadas</span></div>
            <div class="stat-item"><mat-icon>business</mat-icon><span>87 constructoras activas</span></div>
            <div class="stat-item"><mat-icon>volunteer_activism</mat-icon><span>1.240 materiales donados</span></div>
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <div class="auth-right">
        <div class="auth-form-container">
          <h2>Crear una cuenta</h2>
          <p class="auth-subtitle">¿Cómo quieres participar en BrickByBrick?</p>

          <div class="type-cards">

            <a routerLink="/registro/beneficiario" class="type-card type-card--beneficiario">
              <div class="type-icon">
                <mat-icon>family_restroom</mat-icon>
              </div>
              <div class="type-body">
                <div class="type-title">Soy Beneficiario</div>
                <div class="type-desc">Busco materiales de construcción para mi hogar o proyecto comunitario.</div>
                <ul class="type-perks">
                  <li><mat-icon>check</mat-icon> Solicita materiales gratuitos</li>
                  <li><mat-icon>check</mat-icon> Inscríbete a eventos de entrega</li>
                  <li><mat-icon>check</mat-icon> Accede a la comunidad</li>
                </ul>
              </div>
              <mat-icon class="type-arrow">arrow_forward</mat-icon>
            </a>

            <a routerLink="/registro/empresa" class="type-card type-card--empresa">
              <div class="type-icon">
                <mat-icon>business</mat-icon>
              </div>
              <div class="type-body">
                <div class="type-title">Soy Constructora</div>
                <div class="type-desc">Tengo materiales excedentes que quiero donar y generar beneficios tributarios.</div>
                <ul class="type-perks">
                  <li><mat-icon>check</mat-icon> Publica materiales excedentes</li>
                  <li><mat-icon>check</mat-icon> Obtén deducción Art. 255</li>
                  <li><mat-icon>check</mat-icon> Organiza eventos de entrega</li>
                </ul>
              </div>
              <mat-icon class="type-arrow">arrow_forward</mat-icon>
            </a>

          </div>

          <p class="auth-switch">¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
          <a routerLink="/" class="back-link"><mat-icon>chevron_left</mat-icon> Volver al inicio</a>
        </div>
      </div>
    </div>
  `,
  styleUrl: './register-select.component.scss',
})
export class RegisterSelectComponent {}
