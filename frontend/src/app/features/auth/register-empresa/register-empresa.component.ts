import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';

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

const STEPS = ['Datos de la empresa', 'Contacto y cuenta', 'Documentación'];

@Component({
  selector: 'app-register-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="register-page">
      <div class="register-container" style="max-width:580px">
        <div class="register-brand">
          <div class="brand-icon secondary"><mat-icon>business</mat-icon></div>
          <span>BrickByBrick · Constructoras</span>
        </div>

        <!-- Stepper -->
        <div class="stepper">
          @for (s of steps; track s; let i = $index) {
            <div class="step-item">
              <div class="step-circle" [class.done]="step() > i" [class.active]="step() === i">
                @if (step() > i) { <mat-icon>check</mat-icon> } @else { {{ i + 1 }} }
              </div>
              <span class="step-label" [class.active]="step() === i">{{ s }}</span>
            </div>
            @if (i < steps.length - 1) {
              <div class="step-line" [class.done]="step() > i"></div>
            }
          }
        </div>

        <div class="register-card card">
          <!-- Step 0: Company data -->
          @if (step() === 0) {
            <h2>Datos de la empresa</h2>
            <p class="step-subtitle">Información de la empresa constructora.</p>
            <div class="form-fields">
              <div class="form-group">
                <label class="form-label">Razón social *</label>
                <input class="form-input" placeholder="Ej: Conconcreto S.A.S." [(ngModel)]="form.razonSocial" name="razon" />
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">NIT *</label>
                  <input class="form-input" placeholder="Ej: 890.903.938-1" [(ngModel)]="form.nit" name="nit" />
                </div>
                <div class="form-group">
                  <label class="form-label">N° de empleados</label>
                  <select class="form-select" [(ngModel)]="form.numEmpleados" name="empleados">
                    <option value="">Seleccionar</option>
                    <option value="10">1 - 10</option>
                    <option value="50">11 - 50</option>
                    <option value="200">51 - 200</option>
                    <option value="1000">201 - 1000</option>
                    <option value="1001">Más de 1000</option>
                  </select>
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Representante legal *</label>
                  <input class="form-input" placeholder="Nombre completo" [(ngModel)]="form.representante" name="rep" />
                </div>
                <div class="form-group">
                  <label class="form-label">Cargo *</label>
                  <input class="form-input" placeholder="Ej: Gerente General" [(ngModel)]="form.cargo" name="cargo" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Dirección sede principal *</label>
                <input class="form-input" placeholder="Ej: Carrera 7 # 72-41, Piso 8" [(ngModel)]="form.direccion" name="dir" />
              </div>
              <div class="form-group">
                <label class="form-label">Localidad *</label>
                <select class="form-select" [(ngModel)]="form.localidadId" name="loc">
                  <option value="">Seleccionar</option>
                  @for (l of localidades; track l.id) { <option [value]="l.id">{{ l.nombre }}</option> }
                </select>
              </div>
            </div>
          }

          <!-- Step 1: Contact & credentials -->
          @if (step() === 1) {
            <h2>Contacto y cuenta</h2>
            <p class="step-subtitle">Datos de contacto y acceso al sistema.</p>
            <div class="form-fields">
              <div class="form-group">
                <label class="form-label">Correo corporativo *</label>
                <input class="form-input" type="email" placeholder="administracion@empresa.com" [(ngModel)]="form.email" name="email" />
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Teléfono *</label>
                  <input class="form-input" placeholder="Ej: 6013201234" [(ngModel)]="form.telefono" name="tel" />
                </div>
                <div class="form-group">
                  <label class="form-label">Sitio web</label>
                  <input class="form-input" placeholder="https://empresa.com" [(ngModel)]="form.sitioWeb" name="web" />
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
                <input class="form-input" type="password" placeholder="Repite la contraseña"
                       [(ngModel)]="form.confirmPassword" name="confirm" [class.error]="passError()" />
              </div>
              <div class="form-group">
                <label class="form-label">Descripción breve de la empresa</label>
                <textarea class="form-textarea" rows="3" placeholder="Actividad principal, experiencia, tipo de proyectos..."
                          [(ngModel)]="form.descripcion" name="desc"></textarea>
              </div>
            </div>
          }

          <!-- Step 2: Documents -->
          @if (step() === 2) {
            <h2>Documentación requerida</h2>
            <p class="step-subtitle">Necesitamos verificar tu empresa. Sube los siguientes documentos.</p>

            <div class="info-box">
              <mat-icon>info</mat-icon>
              <p>Tu empresa será verificada por el equipo de BrickByBrick en un plazo de 1-2 días hábiles. Mientras tanto podrás explorar la plataforma.</p>
            </div>

            <div class="form-fields">
              <div>
                <label class="form-label">RUT de la empresa *</label>
                <app-file-upload accept=".pdf,.jpg,.jpeg,.png" [maxSizeMb]="10" [multiple]="false"
                                 (filesChanged)="rutFiles = $event" />
              </div>
              <div>
                <label class="form-label">Cámara de comercio (vigente) *</label>
                <app-file-upload accept=".pdf,.jpg,.jpeg,.png" [maxSizeMb]="10" [multiple]="false"
                                 (filesChanged)="ccFiles = $event" />
              </div>
            </div>

            <label class="terms-check">
              <input type="checkbox" [(ngModel)]="form.acceptTerms" name="terms" />
              <span>
                Acepto los <a routerLink="/terminos">Términos de uso</a> para constructoras y autorizo
                el tratamiento de datos según la <a routerLink="/privacidad">Ley 1581 de 2012</a>.
              </span>
            </label>

            @if (errorMsg()) {
              <div class="form-error-banner"><mat-icon>warning</mat-icon> {{ errorMsg() }}</div>
            }
            @if (successMsg()) {
              <div class="form-success-banner"><mat-icon>check_circle</mat-icon> {{ successMsg() }}</div>
            }
          }

          <div class="step-nav">
            <button class="btn btn-ghost" type="button" (click)="prev()">
              <mat-icon>chevron_left</mat-icon>
              {{ step() > 0 ? 'Anterior' : 'Volver al login' }}
            </button>
            @if (step() < 2) {
              <button class="btn btn-secondary btn-submit" type="button" (click)="next()">
                Siguiente <mat-icon>chevron_right</mat-icon>
              </button>
            } @else {
              <button class="btn btn-secondary btn-submit" type="button" (click)="submit()"
                      [disabled]="loading() || !form.acceptTerms">
                @if (loading()) { <mat-icon class="spin">sync</mat-icon> }
                @else { <mat-icon>check</mat-icon> }
                Registrar empresa
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
  styleUrl: './register-empresa.component.scss',
})
export class RegisterEmpresaComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  protected readonly step = signal(0);
  protected readonly loading = signal(false);
  protected readonly errorMsg = signal('');
  protected readonly successMsg = signal('');
  protected readonly showPass = signal(false);

  protected readonly steps = STEPS;
  protected readonly localidades = LOCALIDADES;

  protected form = {
    razonSocial: '', nit: '', numEmpleados: '', representante: '', cargo: '',
    direccion: '', localidadId: '', email: '', telefono: '', sitioWeb: '',
    password: '', confirmPassword: '', descripcion: '', acceptTerms: false,
  };

  protected rutFiles: File[] = [];
  protected ccFiles: File[] = [];

  passError(): boolean {
    return !!this.form.confirmPassword && this.form.password !== this.form.confirmPassword;
  }

  prev(): void {
    if (this.step() === 0) this.router.navigate(['/login']);
    else this.step.update(s => s - 1);
  }

  next(): void {
    this.step.update(s => s + 1);
  }

  submit(): void {
    if (!this.form.acceptTerms) return;
    this.loading.set(true);
    this.errorMsg.set('');

    const payload: Record<string, unknown> = {
      email:       this.form.email,
      password:    this.form.password,
      razonSocial: this.form.razonSocial,
      nit:         this.form.nit,
    };
    if (this.form.representante) payload['representanteLegal']  = this.form.representante;
    if (this.form.cargo)         payload['cargoRepresentante']  = this.form.cargo;
    if (this.form.direccion)     payload['direccion']           = this.form.direccion;
    if (this.form.descripcion)   payload['descripcion']         = this.form.descripcion;
    if (this.form.sitioWeb)      payload['sitioWeb']            = this.form.sitioWeb;
    if (this.form.localidadId)   payload['localidadId']         = Number(this.form.localidadId);
    if (this.form.numEmpleados)  payload['numEmpleados']        = Number(this.form.numEmpleados);

    this.authApi.registerConstructora(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMsg.set('¡Registro enviado! Tu empresa está en proceso de verificación.');
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Error al registrar la empresa.');
      },
    });
  }
}
