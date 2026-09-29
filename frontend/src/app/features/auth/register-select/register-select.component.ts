import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthPanelComponent } from '../auth-panel/auth-panel.component';

@Component({
  selector: 'app-register-select',
  standalone: true,
  imports: [RouterLink, MatIconModule, AuthPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-layout">
      <app-auth-panel lema="Únete a la red de economía circular de materiales de construcción en Bogotá." />
      <div class="auth-right">
        <div class="auth-form-container">
          <h2>Crear una cuenta</h2>
          <p class="auth-subtitle">¿Cómo quieres participar en BrickByBrick?</p>
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
      </div>
    </div>
  `,
  styles: [`
    .type-card { display: flex; gap: 16px; padding: 20px; text-decoration: none; color: inherit; align-items: flex-start; transition: border-color .2s, transform .2s;
      &:hover { border-color: var(--primary); transform: translateY(-2px); } }
    .type-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      &.rojo { background: rgba(173,81,56,.1); mat-icon { color: var(--primary); } }
      &.azul { background: rgba(72,99,90,.12); mat-icon { color: var(--secondary); } } }
    .type-title { font-weight: 700; font-size: 16px; margin-bottom: 4px; }
    .type-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
    .type-perks { list-style: none; display: flex; flex-direction: column; gap: 4px; font-size: 13px;
      li { display: flex; align-items: center; gap: 6px; } mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--accent); } }
    .type-arrow { color: var(--text-secondary); align-self: center; }
  `],
})
export class RegisterSelectComponent {}
