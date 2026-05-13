import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { AuthStore } from '../../../core/auth/auth.store';
import { UserApiService } from '../../../core/services/user-api.service';
import { Beneficiario } from '../../../core/models';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1 class="page-title">Mi perfil</h1>

      @if (loading()) {
        <div class="loading-wrap">
          <div class="spinner"></div>
        </div>
      } @else {
        <div class="perfil-layout">
          <!-- Card lateral -->
          <div class="sidebar-card card">
            <div class="avatar-wrap">
              <app-avatar [name]="perfil()?.nombreCompleto ?? email()" [size]="80" />
            </div>
            <div class="nombre">{{ perfil()?.nombreCompleto }}</div>
            <div class="email">{{ email() }}</div>
            @if (perfil()?.esAlimentadorWeb) {
              <div class="alimentador-badge">
                <mat-icon>verified</mat-icon> Alimentador Web
              </div>
            }
            <div class="info-chips">
              @if (perfil()?.localidad) {
                <div class="chip">
                  <mat-icon>location_on</mat-icon> {{ perfil()!.localidad!.nombre }}
                </div>
              }
              @if (perfil()?.estrato) {
                <div class="chip">
                  <mat-icon>home</mat-icon> Estrato {{ perfil()!.estrato }}
                </div>
              }
              @if (perfil()?.genero) {
                <div class="chip">
                  <mat-icon>person</mat-icon> {{ perfil()!.genero }}
                </div>
              }
            </div>
          </div>

          <!-- Formulario -->
          <div class="form-card card">
            @if (!editando()) {
              <div class="view-mode">
                <div class="section-header-row">
                  <h2 class="section-title">Información personal</h2>
                  <button class="btn btn-ghost btn-sm" (click)="startEdit()">
                    <mat-icon>edit</mat-icon> Editar
                  </button>
                </div>

                <div class="fields-grid">
                  <div class="field">
                    <div class="field-label">Nombre completo</div>
                    <div class="field-value">{{ perfil()?.nombreCompleto }}</div>
                  </div>
                  <div class="field">
                    <div class="field-label">Cédula</div>
                    <div class="field-value">{{ perfil()?.cedula }}</div>
                  </div>
                  <div class="field">
                    <div class="field-label">Fecha de nacimiento</div>
                    <div class="field-value">{{ (perfil()?.fechaNacimiento | date:'dd/MM/yyyy') ?? '—' }}</div>
                  </div>
                  <div class="field">
                    <div class="field-label">Género</div>
                    <div class="field-value">{{ perfil()?.genero ?? '—' }}</div>
                  </div>
                  <div class="field">
                    <div class="field-label">Estrato</div>
                    <div class="field-value">{{ perfil()?.estrato ?? '—' }}</div>
                  </div>
                  <div class="field">
                    <div class="field-label">Localidad</div>
                    <div class="field-value">{{ perfil()?.localidad?.nombre ?? '—' }}</div>
                  </div>
                </div>
              </div>
            } @else {
              <div class="edit-mode">
                <div class="section-header-row">
                  <h2 class="section-title">Editar perfil</h2>
                </div>

                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Nombre completo *</label>
                    <input type="text" class="form-control" [(ngModel)]="form.nombreCompleto" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Cédula *</label>
                    <input type="text" class="form-control" [(ngModel)]="form.cedula" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Fecha de nacimiento</label>
                    <input type="date" class="form-control" [(ngModel)]="form.fechaNacimiento" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Género</label>
                    <select class="form-control" [(ngModel)]="form.genero">
                      <option value="">Prefiero no decir</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="No binario">No binario</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Estrato</label>
                    <select class="form-control" [(ngModel)]="form.estrato">
                      <option [value]="null">—</option>
                      @for (e of [1,2,3,4,5,6]; track e) {
                        <option [value]="e">Estrato {{ e }}</option>
                      }
                    </select>
                  </div>
                </div>

                @if (guardadoExito()) {
                  <div class="alert alert-success">Perfil actualizado exitosamente.</div>
                }
                @if (guardadoError()) {
                  <div class="alert alert-error">{{ guardadoError() }}</div>
                }

                <div class="edit-actions">
                  <button class="btn btn-ghost" (click)="cancelEdit()">Cancelar</button>
                  <button class="btn btn-primary" (click)="guardar()" [disabled]="guardando()">
                    {{ guardando() ? 'Guardando...' : 'Guardar cambios' }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Seguridad (cambio de contraseña — próximamente) -->
        <div class="security-card card">
          <div class="section-header-row">
            <div>
              <h2 class="section-title">Seguridad</h2>
              <p class="section-desc">Gestiona tu contraseña y acceso a la plataforma.</p>
            </div>
          </div>
          <div class="security-item">
            <div class="security-icon"><mat-icon>lock</mat-icon></div>
            <div>
              <div class="security-label">Contraseña</div>
              <div class="security-desc">Última actualización hace más de 90 días</div>
            </div>
            <button class="btn btn-ghost btn-sm" disabled>Cambiar (próximamente)</button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  private readonly auth    = inject(AuthStore);
  private readonly userSvc = inject(UserApiService);

  readonly perfil       = signal<Beneficiario | null>(null);
  readonly loading      = signal(true);
  readonly editando     = signal(false);
  readonly guardando    = signal(false);
  readonly guardadoExito= signal(false);
  readonly guardadoError= signal('');

  form = { nombreCompleto: '', cedula: '', fechaNacimiento: '', genero: '', estrato: null as number | null };

  email() { return this.auth.userEmail(); }

  ngOnInit() {
    const p = this.auth.perfil() as Beneficiario | null;
    if (!p?.id) { this.loading.set(false); return; }

    this.userSvc.getBeneficiario(p.id).subscribe({
      next: r => { this.perfil.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  startEdit() {
    const p = this.perfil();
    if (!p) return;
    this.form = {
      nombreCompleto: p.nombreCompleto,
      cedula: p.cedula,
      fechaNacimiento: p.fechaNacimiento ?? '',
      genero: p.genero ?? '',
      estrato: p.estrato ?? null,
    };
    this.editando.set(true);
  }

  cancelEdit() {
    this.editando.set(false);
    this.guardadoError.set('');
    this.guardadoExito.set(false);
  }

  guardar() {
    const p = this.perfil();
    if (!p?.id) return;
    this.guardando.set(true);
    this.guardadoError.set('');

    const payload: Partial<Beneficiario> = {
      nombreCompleto: this.form.nombreCompleto,
      cedula: this.form.cedula,
      fechaNacimiento: this.form.fechaNacimiento || undefined,
      genero: this.form.genero || undefined,
      estrato: this.form.estrato ?? undefined,
    };

    this.userSvc.updateBeneficiario(p.id, payload).subscribe({
      next: r => {
        this.perfil.set(r.data);
        this.guardando.set(false);
        this.guardadoExito.set(true);
        setTimeout(() => { this.editando.set(false); this.guardadoExito.set(false); }, 1500);
      },
      error: e => {
        this.guardando.set(false);
        this.guardadoError.set(e.error?.message ?? 'Error al guardar los cambios.');
      },
    });
  }
}
