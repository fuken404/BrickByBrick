import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Material } from '../../../core/models';
import { FechaRelativaPipe } from '../../pipes/fecha-relativa.pipe';
import { UploadUrlPipe } from '../../pipes/upload-url.pipe';

@Component({
  selector: 'app-material-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, FechaRelativaPipe, UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="material-card card">
      <!-- Header / image area -->
      <div class="card-header" [style.background]="headerGradient">
        @if (material.fotos?.length) {
          <img [src]="material.fotos[0].url | uploadUrl" [alt]="material.nombre" class="card-img" />
        } @else {
          <div class="card-placeholder">
            <div class="placeholder-circle" [style.background]="catColor + '25'">
              <mat-icon [style.color]="catColor">{{ material.categoria.icono || 'inventory_2' }}</mat-icon>
            </div>
          </div>
        }
        <span class="badge cat-badge" [style.background]="catColor + '22'" [style.color]="catColor">
          {{ material.categoria.nombre }}
        </span>
        <span class="badge status-badge" [ngClass]="statusClass">{{ statusLabel }}</span>
      </div>

      <!-- Body -->
      <div class="card-body">
        <h3 class="card-title">{{ material.nombre }}</h3>
        <div class="card-qty">
          {{ material.cantidad | number:'1.0-0':'es-CO' }}
          <span class="card-unit">{{ material.unidadMedida }}</span>
        </div>
        <div class="card-meta">
          <div class="meta-row">
            <mat-icon>business</mat-icon>
            <span>{{ material.constructora.razonSocial }}</span>
          </div>
          @if (material.constructora.localidad) {
            <div class="meta-row">
              <mat-icon>location_on</mat-icon>
              <span>{{ material.constructora.localidad.nombre }}</span>
            </div>
          }
          <div class="meta-row time">{{ material.createdAt | fechaRelativa }}</div>
        </div>
        <button class="btn btn-primary card-btn" (click)="clicked.emit(material)">
          Ver detalle
        </button>
      </div>
    </div>
  `,
  styleUrl: './material-card.component.scss',
})
export class MaterialCardComponent {
  @Input({ required: true }) material!: Material;
  @Output() clicked = new EventEmitter<Material>();

  private readonly catColorMap: Record<string, string> = {
    Ladrillo: '#C0392B', Madera: '#E67E22', Cerámica: '#8E44AD',
    Concreto: '#6B6B6B', Hierro: '#2E86AB', Pintura: '#16A085',
    Vidrio: '#2980B9',
  };

  get catColor(): string {
    return this.catColorMap[this.material.categoria.nombre] ?? this.material.categoria.colorHex ?? '#6B6B6B';
  }

  get headerGradient(): string {
    const c = this.catColor;
    return `linear-gradient(145deg, ${c}18 0%, ${c}38 100%)`;
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      activo: 'Disponible', pausado: 'Pausado',
      agotado: 'Agotado', vencido: 'Vencido', borrador: 'Borrador',
    };
    return map[this.material.estadoPublicacion] ?? 'Disponible';
  }

  get statusClass(): string {
    const map: Record<string, string> = {
      activo: 'badge-disponible', pausado: 'badge-pendiente',
      agotado: 'badge-rechazado', vencido: 'badge-rechazado',
    };
    return map[this.material.estadoPublicacion] ?? 'badge-disponible';
  }
}
