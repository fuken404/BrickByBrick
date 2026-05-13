import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { AuthStore } from '../../../core/auth/auth.store';
import { UserApiService } from '../../../core/services/user-api.service';
import { Constructora } from '../../../core/models';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';

@Component({
  selector: 'app-empresa-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, FileUploadComponent, AvatarComponent, UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1 class="page-title">Perfil de empresa</h1>

      @if (loading()) {
        <div class="loading-wrap"><div class="spinner"></div></div>
      } @else {
        <div class="perfil-layout">
          <!-- Sidebar -->
          <div class="sidebar-card card">
            <div class="logo-wrap">
              @if (perfil()?.logoUrl) {
                <img [src]="perfil()!.logoUrl! | uploadUrl" [alt]="perfil()!.razonSocial" class="logo-img" />
              } @else {
                <app-avatar [name]="perfil()?.razonSocial ?? email()" [size]="80" />
              }
            </div>
            <div class="razon-social">{{ perfil()?.razonSocial }}</div>
            <div class="nit">NIT: {{ perfil()?.nit }}</div>

            @if (perfil()?.verificada) {
              <div class="verificada-badge">
                <mat-icon>verified</mat-icon> Empresa verificada
              </div>
            } @else {
              <div class="no-verificada-badge">
                <mat-icon>pending</mat-icon> Pendiente verificación
              </div>
            }

            @if (perfil()?.localidad) {
              <div class="loc-chip">
                <mat-icon>location_on</mat-icon> {{ perfil()!.localidad!.nombre }}
              </div>
            }

            <!-- Logo upload -->
            <div class="logo-upload-section">
              <p class="upload-label">Cambiar logo</p>
              <app-file-upload
                accept="image/*"
                [multiple]="false"
               
                (filesChanged)="logoFile = $event[0]"
              />
              @if (logoFile) {
                <button class="btn btn-sm btn-primary" (click)="subirLogo()">Subir logo</button>
              }
            </div>
          </div>

          <!-- Form -->
          <div class="form-card card">
            @if (!editando()) {
              <div>
                <div class="section-header-row">
                  <h2 class="section-title">Información empresarial</h2>
                  <button class="btn btn-ghost btn-sm" (click)="startEdit()"><mat-icon>edit</mat-icon> Editar</button>
                </div>
                <div class="fields-grid">
                  <div class="field"><div class="field-label">Razón social</div><div class="field-value">{{ perfil()?.razonSocial }}</div></div>
                  <div class="field"><div class="field-label">NIT</div><div class="field-value">{{ perfil()?.nit }}</div></div>
                  <div class="field"><div class="field-label">Representante legal</div><div class="field-value">{{ perfil()?.representanteLegal ?? '—' }}</div></div>
                  <div class="field"><div class="field-label">Cargo</div><div class="field-value">{{ perfil()?.cargoRepresentante ?? '—' }}</div></div>
                  <div class="field"><div class="field-label">No. empleados</div><div class="field-value">{{ perfil()?.numEmpleados ?? '—' }}</div></div>
                  <div class="field"><div class="field-label">Sitio web</div><div class="field-value">{{ perfil()?.sitioWeb ?? '—' }}</div></div>
                  <div class="field span-2"><div class="field-label">Dirección</div><div class="field-value">{{ perfil()?.direccion ?? '—' }}</div></div>
                  <div class="field span-2"><div class="field-label">Descripción</div><div class="field-value">{{ perfil()?.descripcion ?? '—' }}</div></div>
                </div>
              </div>
            } @else {
              <div>
                <div class="section-header-row">
                  <h2 class="section-title">Editar perfil</h2>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Razón social *</label>
                    <input type="text" class="form-control" [(ngModel)]="form.razonSocial" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">NIT *</label>
                    <input type="text" class="form-control" [(ngModel)]="form.nit" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Representante legal</label>
                    <input type="text" class="form-control" [(ngModel)]="form.representanteLegal" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Cargo</label>
                    <input type="text" class="form-control" [(ngModel)]="form.cargoRepresentante" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">No. empleados</label>
                    <input type="number" class="form-control" [(ngModel)]="form.numEmpleados" min="1" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Sitio web</label>
                    <input type="url" class="form-control" [(ngModel)]="form.sitioWeb" placeholder="https://..." />
                  </div>
                  <div class="form-group span-2">
                    <label class="form-label">Dirección</label>
                    <input type="text" class="form-control" [(ngModel)]="form.direccion" />
                  </div>
                  <div class="form-group span-2">
                    <label class="form-label">Descripción</label>
                    <textarea class="form-control" [(ngModel)]="form.descripcion" rows="3"></textarea>
                  </div>
                </div>

                @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
                @if (exito()) { <div class="alert alert-success">Perfil actualizado.</div> }

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

        <!-- Documentos -->
        <div class="docs-card card">
          <h2 class="section-title">Documentos de verificación</h2>
          <p class="docs-desc">Sube tu RUT y cámara de comercio para que un administrador pueda verificar tu empresa.</p>
          <div class="docs-grid">
            <div class="doc-section">
              <div class="doc-label">RUT</div>
              <app-file-upload accept=".pdf,image/*" [multiple]="false" (filesChanged)="rutFile = $event[0]" />
              @if (rutFile) {
                <button class="btn btn-sm btn-primary" (click)="subirDocumento('rut')">Subir RUT</button>
              }
            </div>
            <div class="doc-section">
              <div class="doc-label">Cámara de comercio</div>
              <app-file-upload accept=".pdf,image/*" [multiple]="false" (filesChanged)="ccFile = $event[0]" />
              @if (ccFile) {
                <button class="btn btn-sm btn-primary" (click)="subirDocumento('camara_comercio')">Subir cámara de comercio</button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './perfil.component.scss',
})
export class EmpresaPerfilComponent implements OnInit {
  private readonly auth    = inject(AuthStore);
  private readonly userSvc = inject(UserApiService);

  readonly perfil   = signal<Constructora | null>(null);
  readonly loading  = signal(true);
  readonly editando = signal(false);
  readonly guardando= signal(false);
  readonly error    = signal('');
  readonly exito    = signal(false);

  logoFile: File | undefined;
  rutFile:  File | undefined;
  ccFile:   File | undefined;

  form = { razonSocial: '', nit: '', representanteLegal: '', cargoRepresentante: '', numEmpleados: null as number | null, sitioWeb: '', direccion: '', descripcion: '' };

  email() { return this.auth.userEmail(); }

  ngOnInit() {
    const p = this.auth.perfil() as Constructora | null;
    if (!p?.id) { this.loading.set(false); return; }

    this.userSvc.getConstructora(p.id).subscribe({
      next: r => { this.perfil.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  startEdit() {
    const p = this.perfil();
    if (!p) return;
    this.form = {
      razonSocial:         p.razonSocial,
      nit:                 p.nit,
      representanteLegal:  p.representanteLegal ?? '',
      cargoRepresentante:  p.cargoRepresentante ?? '',
      numEmpleados:        p.numEmpleados ?? null,
      sitioWeb:            p.sitioWeb ?? '',
      direccion:           p.direccion ?? '',
      descripcion:         p.descripcion ?? '',
    };
    this.editando.set(true);
  }

  cancelEdit() { this.editando.set(false); this.error.set(''); this.exito.set(false); }

  guardar() {
    const p = this.perfil();
    if (!p?.id) return;
    this.guardando.set(true);
    this.error.set('');

    this.userSvc.updateConstructora(p.id, {
      razonSocial:        this.form.razonSocial,
      nit:                this.form.nit,
      representanteLegal: this.form.representanteLegal || undefined,
      cargoRepresentante: this.form.cargoRepresentante || undefined,
      numEmpleados:       this.form.numEmpleados ?? undefined,
      sitioWeb:           this.form.sitioWeb || undefined,
      direccion:          this.form.direccion || undefined,
      descripcion:        this.form.descripcion || undefined,
    }).subscribe({
      next: r => {
        this.perfil.set(r.data);
        this.guardando.set(false);
        this.exito.set(true);
        setTimeout(() => { this.editando.set(false); this.exito.set(false); }, 1500);
      },
      error: e => { this.guardando.set(false); this.error.set(e.error?.message ?? 'Error al guardar.'); },
    });
  }

  subirLogo() {
    const p = this.perfil();
    if (!p?.id || !this.logoFile) return;
    this.userSvc.uploadLogo(p.id, this.logoFile).subscribe({
      next: r => { this.perfil.update(x => x ? { ...x, logoUrl: r.data.logoUrl } : x); this.logoFile = undefined; },
    });
  }

  subirDocumento(tipo: 'rut' | 'camara_comercio') {
    const p = this.perfil();
    const file = tipo === 'rut' ? this.rutFile : this.ccFile;
    if (!p?.id || !file) return;
    this.userSvc.uploadDocumento(p.id, file, tipo).subscribe({
      next: () => { if (tipo === 'rut') this.rutFile = undefined; else this.ccFile = undefined; },
    });
  }
}
