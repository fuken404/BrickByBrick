import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';

import { environment } from '../../../../environments/environment';
import { CategoriaMaterial } from '../../../core/models';

interface CategoriaForm {
  nombre: string;
  colorHex: string;
  icono: string;
}

interface ConfigSistema {
  maxFotosXMaterial: number;
  maxSolicitudesXBeneficiario: number;
  diasLimiteRetiro: number;
  emailNotificaciones: string;
  mantenimientoActivo: boolean;
}

@Component({
  selector: 'app-admin-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1 class="page-title">Configuración</h1>
      <p class="page-subtitle">Administra categorías de materiales y parámetros del sistema.</p>

      <div class="config-layout">

        <!-- Categorías -->
        <section class="card section-card">
          <div class="section-header">
            <div class="section-icon" style="background:rgba(192,57,43,.1)">
              <mat-icon style="color:#C0392B">category</mat-icon>
            </div>
            <div>
              <div class="section-title">Categorías de materiales</div>
              <div class="section-sub">{{ categorias().length }} categorías activas</div>
            </div>
            <button class="btn btn-primary btn-sm ml-auto" (click)="abrirNuevaCategoria()">
              <mat-icon>add</mat-icon> Nueva
            </button>
          </div>

          <div class="cat-list">
            @for (c of categorias(); track c.id) {
              <div class="cat-row">
                <div class="cat-swatch" [style.background]="c.colorHex"></div>
                <mat-icon class="cat-ico">{{ c.icono }}</mat-icon>
                <span class="cat-name">{{ c.nombre }}</span>
                <div class="cat-actions">
                  <button class="action-btn edit" (click)="editarCategoria(c)" title="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button class="action-btn danger" (click)="eliminarCategoria(c.id)" title="Eliminar">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            }
            @if (categorias().length === 0 && !loadingCats()) {
              <p class="empty-msg">No hay categorías. Crea la primera.</p>
            }
          </div>

          <!-- Formulario inline -->
          @if (showCatForm()) {
            <div class="cat-form card-inner">
              <div class="form-row">
                <div class="field">
                  <label>Nombre</label>
                  <input class="inp" [(ngModel)]="catForm.nombre" placeholder="Ej. Cerámica" />
                </div>
                <div class="field">
                  <label>Color (hex)</label>
                  <div class="color-row">
                    <input type="color" class="color-picker" [(ngModel)]="catForm.colorHex" />
                    <input class="inp" [(ngModel)]="catForm.colorHex" placeholder="#C0392B" />
                  </div>
                </div>
                <div class="field">
                  <label>Ícono (Material Icons)</label>
                  <input class="inp" [(ngModel)]="catForm.icono" placeholder="Ej. inventory_2" />
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-ghost btn-sm" (click)="cancelarCatForm()">Cancelar</button>
                <button class="btn btn-primary btn-sm" (click)="guardarCategoria()" [disabled]="savingCat()">
                  {{ savingCat() ? 'Guardando…' : (editId() ? 'Actualizar' : 'Crear') }}
                </button>
              </div>
            </div>
          }
        </section>

        <!-- Configuración del sistema -->
        <section class="card section-card">
          <div class="section-header">
            <div class="section-icon" style="background:rgba(46,134,171,.1)">
              <mat-icon style="color:#2E86AB">settings</mat-icon>
            </div>
            <div>
              <div class="section-title">Parámetros del sistema</div>
              <div class="section-sub">Límites operativos y configuración general</div>
            </div>
          </div>

          <div class="sys-grid">
            <div class="field">
              <label>Fotos máx. por material</label>
              <input class="inp" type="number" [(ngModel)]="cfg.maxFotosXMaterial" min="1" max="20" />
            </div>
            <div class="field">
              <label>Solicitudes máx. por beneficiario</label>
              <input class="inp" type="number" [(ngModel)]="cfg.maxSolicitudesXBeneficiario" min="1" />
            </div>
            <div class="field">
              <label>Días límite de retiro</label>
              <input class="inp" type="number" [(ngModel)]="cfg.diasLimiteRetiro" min="1" />
            </div>
            <div class="field">
              <label>Email de notificaciones</label>
              <input class="inp" type="email" [(ngModel)]="cfg.emailNotificaciones" placeholder="admin@brickbybrick.co" />
            </div>
          </div>

          <div class="toggle-row">
            <div>
              <div class="toggle-label">Modo mantenimiento</div>
              <div class="toggle-sub">Bloquea el acceso a todos los usuarios excepto administradores</div>
            </div>
            <label class="switch">
              <input type="checkbox" [(ngModel)]="cfg.mantenimientoActivo" />
              <span class="slider"></span>
            </label>
          </div>

          <div class="sys-actions">
            <button class="btn btn-primary" (click)="guardarConfig()" [disabled]="savingCfg()">
              {{ savingCfg() ? 'Guardando…' : 'Guardar configuración' }}
            </button>
            @if (cfgSaved()) {
              <span class="saved-msg"><mat-icon>check_circle</mat-icon> Guardado</span>
            }
          </div>
        </section>

        <!-- Info del sistema -->
        <section class="card section-card info-section">
          <div class="section-header">
            <div class="section-icon" style="background:rgba(39,174,96,.1)">
              <mat-icon style="color:#27AE60">info</mat-icon>
            </div>
            <div>
              <div class="section-title">Información del sistema</div>
              <div class="section-sub">Versión y estado de los servicios</div>
            </div>
          </div>

          <div class="info-grid">
            @for (svc of servicios; track svc.name) {
              <div class="info-row">
                <span class="info-name">{{ svc.name }}</span>
                <span class="status-dot" [class.ok]="true"></span>
                <span class="info-port">:{{ svc.port }}</span>
              </div>
            }
          </div>

          <div class="version-row">
            <mat-icon>code</mat-icon>
            <span>BrickByBrick v1.0.0 — Angular 17 + Node.js + PostgreSQL</span>
          </div>
        </section>

      </div>
    </div>
  `,
  styleUrl: './configuracion.component.scss',
})
export class AdminConfiguracionComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.services.materials;

  readonly categorias  = signal<CategoriaMaterial[]>([]);
  readonly loadingCats = signal(true);
  readonly showCatForm = signal(false);
  readonly savingCat   = signal(false);
  readonly editId      = signal<number | null>(null);
  readonly savingCfg   = signal(false);
  readonly cfgSaved    = signal(false);

  catForm: CategoriaForm = { nombre: '', colorHex: '#C0392B', icono: 'category' };

  cfg: ConfigSistema = {
    maxFotosXMaterial:           8,
    maxSolicitudesXBeneficiario: 3,
    diasLimiteRetiro:            15,
    emailNotificaciones:         'admin@brickbybrick.co',
    mantenimientoActivo:         false,
  };

  readonly servicios = [
    { name: 'auth-service',         port: 3001 },
    { name: 'user-service',         port: 3002 },
    { name: 'material-service',     port: 3003 },
    { name: 'event-service',        port: 3004 },
    { name: 'publication-service',  port: 3005 },
    { name: 'notification-service', port: 3006 },
  ];

  ngOnInit() {
    this.http.get<{ data: CategoriaMaterial[] }>(`${this.baseUrl}/categorias`).subscribe({
      next: r => { this.categorias.set(r.data); this.loadingCats.set(false); },
      error: () => this.loadingCats.set(false),
    });
  }

  abrirNuevaCategoria() {
    this.editId.set(null);
    this.catForm = { nombre: '', colorHex: '#C0392B', icono: 'category' };
    this.showCatForm.set(true);
  }

  editarCategoria(c: CategoriaMaterial) {
    this.editId.set(c.id);
    this.catForm = { nombre: c.nombre, colorHex: c.colorHex, icono: c.icono };
    this.showCatForm.set(true);
  }

  cancelarCatForm() {
    this.showCatForm.set(false);
    this.editId.set(null);
  }

  guardarCategoria() {
    if (!this.catForm.nombre.trim()) return;
    this.savingCat.set(true);
    const id = this.editId();
    const req = id
      ? this.http.put<{ data: CategoriaMaterial }>(`${this.baseUrl}/categorias/${id}`, this.catForm)
      : this.http.post<{ data: CategoriaMaterial }>(`${this.baseUrl}/categorias`, this.catForm);

    req.subscribe({
      next: r => {
        this.categorias.update(list =>
          id ? list.map(c => c.id === id ? r.data : c) : [...list, r.data]
        );
        this.savingCat.set(false);
        this.showCatForm.set(false);
        this.editId.set(null);
      },
      error: () => this.savingCat.set(false),
    });
  }

  eliminarCategoria(id: number) {
    this.http.delete(`${this.baseUrl}/categorias/${id}`).subscribe({
      next: () => this.categorias.update(list => list.filter(c => c.id !== id)),
    });
  }

  guardarConfig() {
    this.savingCfg.set(true);
    setTimeout(() => {
      this.savingCfg.set(false);
      this.cfgSaved.set(true);
      setTimeout(() => this.cfgSaved.set(false), 3000);
    }, 800);
  }
}
