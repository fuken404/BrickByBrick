import { AuthHeaderComponent } from '../auth-header/auth-header.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthPanelComponent } from '../auth-panel/auth-panel.component';

@Component({
  selector: 'app-register-select',
  standalone: true,
  imports: [AuthHeaderComponent, RouterLink, MatIconModule, AuthPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-header />
    <div class="auth-layout auth-select">
      <app-auth-panel lema="Únete a la red de economía circular de materiales de construcción en Bogotá." />
      <main class="auth-right">
        <div class="auth-form-container">
          <h1>Un nuevo comienzo.</h1>
          <p class="auth-subtitle">Crea tu cuenta. ¿Cómo quieres ser parte?</p>
          <div class="stack">
            <a routerLink="/registro/beneficiario" class="type-card card">
              <div class="type-icon rojo"><mat-icon>family_restroom</mat-icon></div>
              <div class="grow">
                <div class="type-title">Soy beneficiario</div>
                <div class="type-desc">Busco materiales para mi hogar, mi emprendimiento o un proyecto comunitario.</div>
                <ul class="type-perks">
                  <li><mat-icon>check</mat-icon>Solicita materiales gratuitos</li>
                  <li><mat-icon>check</mat-icon>Inscríbete a jornadas de entrega y talleres</li>
                  <li><mat-icon>check</mat-icon>Muestra tus proyectos en la comunidad</li>
                </ul>
              </div>
              <mat-icon class="type-arrow">arrow_forward</mat-icon>
            </a>
            <a routerLink="/registro/empresa" class="type-card card">
              <div class="type-icon azul"><mat-icon>business</mat-icon></div>
              <div class="grow">
                <div class="type-title">Soy constructora</div>
                <div class="type-desc">Tengo excedentes de obra que quiero donar con trazabilidad y soporte tributario.</div>
                <ul class="type-perks">
                  <li><mat-icon>check</mat-icon>Publica materiales y organiza entregas</li>
                  <li><mat-icon>check</mat-icon>Genera constancias de cada donación</li>
                  <li><mat-icon>check</mat-icon>Estima tu descuento tributario (Art. 255 E.T.)</li>
                </ul>
              </div>
              <mat-icon class="type-arrow">arrow_forward</mat-icon>
            </a>
          </div>
          <p class="auth-switch mt-24">¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
          <a routerLink="/" class="back-link"><mat-icon>chevron_left</mat-icon> Volver al inicio</a>
        </div>
      </main>
    </div>
  `,

})
export class RegisterSelectComponent {}
