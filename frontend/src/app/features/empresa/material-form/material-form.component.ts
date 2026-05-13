import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MaterialApiService } from '../../../core/services/material-api.service';
import { Material, EstadoMaterial } from '../../../core/models';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';

@Component({
  selector: 'app-material-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <nav class="breadcrumb">
        <a routerLink="/empresa/materiales" class="bc-link">
          <mat-icon>arrow_back</mat-icon> Materiales
        </a>
      </nav>

      <h1 class="page-title">{{ editando() ? 'Editar material' : 'Publicar material' }}</h1>

      @if (loadingMaterial()) {
        <div class="loading-wrap"><div class="spinner"></div></div>
      } @else {
        <div class="form-layout">
          <div class="form-card card">
            <h2 class="form-section-title">Información del material</h2>

            <div class="form-grid">
              <div class="form-group span-2">
                <label class="form-label">Nombre del material *</label>
                <input type="text" class="form-control" [(ngModel)]="form.nombre"
                       placeholder="Ej: Ladrillos de arcilla roja 12x25x6cm" />
              </div>

              <div class="form-group">
                <label class="form-label">Categoría *</label>
                <select class="form-control" [(ngModel)]="form.categoriaId">
                  <option [value]="0">Selecciona categoría</option>
                  @for (c of categorias; track c.id) {
                    <option [value]="c.id">{{ c.nombre }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Estado del material *</label>
                <select class="form-control" [(ngModel)]="form.estadoMaterial">
                  <option value="nuevo">Nuevo</option>
                  <option value="buen_estado">Buen estado</option>
                  <option value="usado">Usado</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Cantidad *</label>
                <input type="number" class="form-control" [(ngModel)]="form.cantidad" min="1" placeholder="0" />
              </div>

              <div class="form-group">
                <label class="form-label">Unidad de medida *</label>
                <select class="form-control" [(ngModel)]="form.unidadMedida">
                  <option value="unidades">Unidades</option>
                  <option value="m²">m²</option>
                  <option value="m³">m³</option>
                  <option value="kg">kg</option>
                  <option value="ton">Toneladas</option>
                  <option value="sacos">Sacos</option>
                  <option value="litros">Litros</option>
                  <option value="ml">ml</option>
                  <option value="m">Metros lineales</option>
                  <option value="rollos">Rollos</option>
                  <option value="bolsas">Bolsas</option>
                  <option value="cajas">Cajas</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Máx. solicitudes</label>
                <input type="number" class="form-control" [(ngModel)]="form.maxSolicitudes" min="1"
                       placeholder="Sin límite" />
              </div>

              <div class="form-group">
                <label class="form-label">Fecha límite</label>
                <input type="date" class="form-control" [(ngModel)]="form.fechaLimite" />
              </div>

              <div class="form-group span-2">
                <label class="form-label">Descripción</label>
                <textarea class="form-control" [(ngModel)]="form.descripcion" rows="3"
                          placeholder="Describe el material, dimensiones, marca, etc."></textarea>
              </div>

              <div class="form-group span-2">
                <label class="form-label">Condiciones de retiro</label>
                <textarea class="form-control" [(ngModel)]="form.condicionesRetiro" rows="2"
                          placeholder="Cómo deben retirar el material, herramientas necesarias, etc."></textarea>
              </div>
            </div>
          </div>

          <!-- Fotos -->
          <div class="form-card card">
            <h2 class="form-section-title">Fotos del material</h2>
            <p class="form-hint-text">Agrega hasta 5 fotos para que los beneficiarios puedan ver el estado real del material.</p>
            <app-file-upload
              [accept]="'image/*'"
              [multiple]="true"
             
              (filesChanged)="fotos = $event"
            />
          </div>

          <!-- Errores / éxito -->
          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }
          @if (exito()) {
            <div class="alert alert-success">Material guardado exitosamente. Redirigiendo…</div>
          }

          <!-- Acciones -->
          <div class="form-actions">
            <a routerLink="/empresa/materiales" class="btn btn-ghost">Cancelar</a>
            <button class="btn btn-ghost" (click)="guardar('borrador')" [disabled]="guardando()">
              Guardar borrador
            </button>
            <button class="btn btn-primary" (click)="guardar('activo')" [disabled]="guardando()">
              {{ guardando() ? 'Publicando...' : 'Publicar' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './material-form.component.scss',
})
export class MaterialFormComponent implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matSvc = inject(MaterialApiService);

  readonly editando      = signal(false);
  readonly loadingMaterial = signal(false);
  readonly guardando     = signal(false);
  readonly error         = signal('');
  readonly exito         = signal(false);

  fotos: File[] = [];
  private materialId: string | null = null;

  form = {
    nombre: '',
    categoriaId: 0,
    estadoMaterial: 'nuevo' as EstadoMaterial,
    cantidad: 1,
    unidadMedida: 'unidades',
    maxSolicitudes: null as number | null,
    fechaLimite: '',
    descripcion: '',
    condicionesRetiro: '',
  };

  readonly categorias = [
    { id: 1,  nombre: 'Ladrillo' },
    { id: 2,  nombre: 'Cemento' },
    { id: 3,  nombre: 'Arena/Grava' },
    { id: 4,  nombre: 'Madera' },
    { id: 5,  nombre: 'Hierro/Acero' },
    { id: 6,  nombre: 'Cerámica' },
    { id: 7,  nombre: 'Pintura' },
    { id: 8,  nombre: 'Ventanas/Puertas' },
    { id: 9,  nombre: 'Plomería' },
    { id: 10, nombre: 'Eléctrico' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.materialId = id;
      this.editando.set(true);
      this.loadingMaterial.set(true);

      this.matSvc.getById(id).subscribe({
        next: r => {
          const m = r.data;
          this.form = {
            nombre:           m.nombre,
            categoriaId:      m.categoria?.id ?? 0,
            estadoMaterial:   m.estadoMaterial,
            cantidad:         m.cantidad,
            unidadMedida:     m.unidadMedida,
            maxSolicitudes:   m.maxSolicitudes ?? null,
            fechaLimite:      m.fechaLimite ? m.fechaLimite.slice(0, 10) : '',
            descripcion:      m.descripcion ?? '',
            condicionesRetiro: m.condicionesRetiro ?? '',
          };
          this.loadingMaterial.set(false);
        },
        error: () => this.loadingMaterial.set(false),
      });
    }
  }

  guardar(estadoPublicacion: 'activo' | 'borrador') {
    if (!this.form.nombre.trim()) { this.error.set('El nombre es requerido.'); return; }
    if (!this.form.categoriaId)   { this.error.set('La categoría es requerida.'); return; }
    if (this.form.cantidad < 1)   { this.error.set('La cantidad debe ser mayor a 0.'); return; }

    this.guardando.set(true);
    this.error.set('');

    const payload = {
      nombre:           this.form.nombre,
      categoriaId:      this.form.categoriaId,
      estadoMaterial:   this.form.estadoMaterial,
      cantidad:         this.form.cantidad,
      unidadMedida:     this.form.unidadMedida,
      maxSolicitudes:   this.form.maxSolicitudes ?? undefined,
      fechaLimite:      this.form.fechaLimite || undefined,
      descripcion:      this.form.descripcion || undefined,
      condicionesRetiro: this.form.condicionesRetiro || undefined,
      estadoPublicacion,
    };

    const obs = this.editando() && this.materialId
      ? this.matSvc.update(this.materialId, payload)
      : this.matSvc.create(payload);

    obs.subscribe({
      next: r => {
        if (this.fotos.length > 0) {
          this.matSvc.uploadFotos(r.data.id, this.fotos).subscribe();
        }
        this.exito.set(true);
        this.guardando.set(false);
        setTimeout(() => this.router.navigate(['/empresa/materiales']), 1500);
      },
      error: e => {
        this.guardando.set(false);
        this.error.set(e.error?.message ?? 'Error al guardar el material.');
      },
    });
  }
}
