import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { mensajeError } from '../../../core/utils/http';
import { CampoErrorComponent } from '../../../shared/components/campo-error.component';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, CampoErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="simple-page">
      <div class="simple-card card">
        @if (!enviado()) {
          <div class="status-icon neutro"><mat-icon>lock_reset</mat-icon></div>
          <h2 class="center mb-8">Recuperar contraseña</h2>
          <p class="muted center mb-24">Escribe el correo con el que te registraste y te enviaremos un enlace para crear una nueva contraseña.</p>
          <form class="stack" (submit)="$event.preventDefault(); enviar()" novalidate>
            <div class="form-group">
              <label class="form-label" for="email">Correo electrónico</label>
              <input id="email" class="form-input" type="email" [formControl]="email" autocomplete="email" placeholder="correo@ejemplo.com" />
              <app-campo-error [control]="email" />
            </div>
            @if (error()) { <div class="alert danger" role="alert"><mat-icon>warning</mat-icon><span>{{ error() }}</span></div> }
            <button type="submit" class="btn btn-primary btn-block" [disabled]="cargando()">
              @if (cargando()) { <mat-icon class="spin">sync</mat-icon> } Enviar enlace
            </button>
          </form>
        } @else {
          <div class="status-icon ok"><mat-icon>mark_email_read</mat-icon></div>
          <h2 class="center mb-8">Revisa tu correo</h2>
          <p class="muted center">Si <strong>{{ email.value }}</strong> está registrado, recibirás un enlace válido por 1 hora. Revisa también la carpeta de spam.</p>
        }
        <div class="center"><a routerLink="/login" class="back-link"><mat-icon>chevron_left</mat-icon> Volver al inicio de sesión</a></div>
      </div>
    </div>
  `,
})
export class RecuperarPasswordComponent {
  private readonly api = inject(AuthApiService);
  protected readonly email = inject(FormBuilder).nonNullable.control('', [Validators.required, Validators.email]);
  protected readonly cargando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly error = signal('');

  enviar(): void {
    this.email.markAsTouched();
    if (this.email.invalid) return;
    this.cargando.set(true);
    this.error.set('');
    this.api.forgotPassword(this.email.value.trim().toLowerCase()).subscribe({
      next: () => { this.cargando.set(false); this.enviado.set(true); },
      error: (e) => { this.cargando.set(false); this.error.set(mensajeError(e)); },
    });
  }
}
