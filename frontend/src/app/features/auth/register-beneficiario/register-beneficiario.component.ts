import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../core/services/auth-api.service';

interface RegForm {
  nombreCompleto: string; cedula: string; fechaNacimiento: string;
  genero: string; estrato: string; localidadId: string;
  email: string; telefono: string; password: string; confirmPassword: string;
  acceptTerms: boolean;
}

const LOCALIDADES = [
  { id: 1,  nombre: 'Usaquén' },       { id: 2,  nombre: 'Chapinero' },
  { id: 3,  nombre: 'Santa Fe' },      { id: 4,  nombre: 'San Cristóbal' },
  { id: 5,  nombre: 'Usme' },          { id: 6,  nombre: 'Tunjuelito' },
  { id: 7,  nombre: 'Bosa' },          { id: 8,  nombre: 'Kennedy' },
  { id: 9,  nombre: 'Fontibón' },      { id: 10, nombre: 'Engativá' },
  { id: 11, nombre: 'Suba' },          { id: 12, nombre: 'Barrios Unidos' },
  { id: 13, nombre: 'Teusaquillo' },   { id: 14, nombre: 'Los Mártires' },
  { id: 15, nombre: 'Antonio Nariño' },{ id: 16, nombre: 'Puente Aranda' },
  { id: 17, nombre: 'La Candelaria' }, { id: 18, nombre: 'Rafael Uribe Uribe' },
  { id: 19, nombre: 'Ciudad Bolívar' },{ id: 20, nombre: 'Sumapaz' },
];

const STEPS = ['Datos personales', 'Contacto y cuenta', 'Confirmación'];

@Component({
  selector: 'app-register-beneficiario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="register-page">
      <div class="register-container">
        <!-- Brand -->
        <div class="register-brand">
          <div class="brand-icon"><mat-icon>layers</mat-icon></div>
          <span>BrickByBrick</span>
        </div>

        <!-- Stepper -->
        <div class="stepper">
          @for (s of steps; track s; let i = $index) {
            <div class="step-item">
              <div class="step-circle" [class.done]="step() > i" [class.active]="step() === i">
                @if (step() > i) {
                  <mat-icon>check</mat-icon>
                } @else {
                  {{ i + 1 }}
                }
              </div>
              <span class="step-label" [class.active]="step() === i">{{ s }}</span>
            </div>
            @if (i < steps.length - 1) {
              <div class="step-line" [class.done]="step() > i"></div>
            }
          }
        </div>

        <div class="register-card card">
          <!-- Step 0 -->
          @if (step() === 0) {
            <h2>Datos personales</h2>
            <p class="step-subtitle">Ingresa tus datos para crear tu cuenta de beneficiario.</p>
            <div class="form-fields">
              <div class="form-group">
                <label class="form-label">Nombre completo *</label>
                <input class="form-input" placeholder="Ej: Carlos Andrés Rivera"
                       [(ngModel)]="form.nombreCompleto" name="nombre" />
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Cédula *</label>
                  <input class="form-input" placeholder="Ej: 1020304050"
                         [(ngModel)]="form.cedula" name="cedula" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha de nacimiento *</label>
                  <input class="form-input" type="date" [(ngModel)]="form.fechaNacimiento" name="fecha" />
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Género *</label>
                  <select class="form-select" [(ngModel)]="form.genero" name="genero">
                    <option value="">Seleccionar</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="no_binario">No binario</option>
                    <option value="prefiero_no_decir">Prefiero no decir</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Estrato socioeconómico *</label>
                  <select class="form-select" [(ngModel)]="form.estrato" name="estrato">
                    <option value="">Seleccionar</option>
                    @for (e of [1,2,3,4,5,6]; track e) {
                      <option [value]="e">Estrato {{ e }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Localidad en Bogotá *</label>
                <select class="form-select" [(ngModel)]="form.localidadId" name="localidad">
                  <option value="">Seleccionar localidad</option>
                  @for (l of localidades; track l.id) {
                    <option [value]="l.id">{{ l.nombre }}</option>
                  }
                </select>
              </div>
            </div>
          }

          <!-- Step 1 -->
          @if (step() === 1) {
            <h2>Contacto y cuenta</h2>
            <p class="step-subtitle">Datos de contacto y credenciales de acceso.</p>
            <div class="form-fields">
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Correo electrónico *</label>
                  <input class="form-input" type="email" placeholder="correo@ejemplo.com"
                         [(ngModel)]="form.email" name="email" />
                </div>
                <div class="form-group">
                  <label class="form-label">Teléfono celular *</label>
                  <input class="form-input" placeholder="Ej: 3001234567"
                         [(ngModel)]="form.telefono" name="tel" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Contraseña *</label>
                <div class="pass-wrapper">
                  <input class="form-input" [type]="showPass() ? 'text' : 'password'"
                         placeholder="Mínimo 8 caracteres" [(ngModel)]="form.password" name="pass" />
                  <button type="button" class="pass-toggle" (click)="showPass.update(v => !v)">
                    <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Confirmar contraseña *</label>
                <input class="form-input" type="password" placeholder="Repite tu contraseña"
                       [(ngModel)]="form.confirmPassword" name="confirm"
                       [class.error]="passError()" />
                @if (passError()) {
                  <span class="form-hint" style="color: var(--danger)">Las contraseñas no coinciden</span>
                }
              </div>
            </div>
          }

          <!-- Step 2 -->
          @if (step() === 2) {
            <h2>Confirmación</h2>
            <p class="step-subtitle">Revisa tus datos antes de crear la cuenta.</p>
            <div class="summary-box">
              @for (field of summaryFields; track field.label) {
                <div class="summary-row">
                  <span class="summary-key">{{ field.label }}</span>
                  <span class="summary-val">{{ field.value }}</span>
                </div>
              }
            </div>
            <label class="terms-check">
              <input type="checkbox" [(ngModel)]="form.acceptTerms" name="terms" />
              <span>
                Acepto los <a routerLink="/terminos">Términos de uso</a> y autorizo el
                tratamiento de mis datos según la <a routerLink="/privacidad">Ley 1581 de 2012</a>.
              </span>
            </label>

            @if (errorMsg()) {
              <div class="form-error-banner">
                <mat-icon>warning</mat-icon> {{ errorMsg() }}
              </div>
            }
            @if (successMsg()) {
              <div class="form-success-banner">
                <mat-icon>check_circle</mat-icon> {{ successMsg() }}
              </div>
            }
          }

          <!-- Navigation -->
          <div class="step-nav">
            <button class="btn btn-ghost" type="button" (click)="prev()">
              <mat-icon>chevron_left</mat-icon>
              {{ step() > 0 ? 'Anterior' : 'Volver al login' }}
            </button>
            @if (step() < 2) {
              <button class="btn btn-primary" type="button" (click)="next()">
                Siguiente <mat-icon>chevron_right</mat-icon>
              </button>
            } @else {
              <button class="btn btn-primary" type="button" (click)="submit()"
                      [disabled]="loading() || !form.acceptTerms">
                @if (loading()) { <mat-icon class="spin">sync</mat-icon> }
                @else { <mat-icon>check</mat-icon> }
                Crear cuenta
              </button>
            }
          </div>
        </div>

        <p class="login-link">
          ¿Ya tienes cuenta? <a routerLink="/login">Ingresar aquí</a>
        </p>
      </div>
    </div>
  `,
  styleUrl: './register-beneficiario.component.scss',
})
export class RegisterBeneficiarioComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  protected readonly step = signal(0);
  protected readonly loading = signal(false);
  protected readonly errorMsg = signal('');
  protected readonly successMsg = signal('');
  protected readonly showPass = signal(false);

  protected readonly steps = STEPS;
  protected readonly localidades = LOCALIDADES;

  protected form: RegForm = {
    nombreCompleto: '', cedula: '', fechaNacimiento: '',
    genero: '', estrato: '', localidadId: '',
    email: '', telefono: '', password: '', confirmPassword: '',
    acceptTerms: false,
  };

  passError(): boolean {
    return !!this.form.confirmPassword && this.form.password !== this.form.confirmPassword;
  }

  get summaryFields(): { label: string; value: string }[] {
    return [
      { label: 'Nombre completo', value: this.form.nombreCompleto },
      { label: 'Cédula',          value: this.form.cedula },
      { label: 'Correo',          value: this.form.email },
      { label: 'Teléfono',        value: this.form.telefono },
      { label: 'Localidad',       value: LOCALIDADES.find(l => l.id === Number(this.form.localidadId))?.nombre ?? '' },
      { label: 'Estrato',         value: this.form.estrato ? `Estrato ${this.form.estrato}` : '' },
    ];
  }

  prev(): void {
    if (this.step() === 0) this.router.navigate(['/login']);
    else this.step.update(s => s - 1);
  }

  next(): void {
    this.step.update(s => s + 1);
  }

  submit(): void {
    if (this.passError() || !this.form.acceptTerms) return;
    this.loading.set(true);
    this.errorMsg.set('');

    const payload: Record<string, unknown> = {
      email:          this.form.email,
      password:       this.form.password,
      nombreCompleto: this.form.nombreCompleto,
      cedula:         this.form.cedula,
    };
    if (this.form.fechaNacimiento) payload['fechaNacimiento'] = this.form.fechaNacimiento;
    if (this.form.genero)          payload['genero']          = this.form.genero;
    if (this.form.estrato)         payload['estrato']         = Number(this.form.estrato);
    if (this.form.localidadId)     payload['localidadId']     = Number(this.form.localidadId);

    this.authApi.registerBeneficiario(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMsg.set('¡Cuenta creada! Revisa tu correo para verificarla.');
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Error al crear la cuenta. Intenta nuevamente.');
      },
    });
  }
}
