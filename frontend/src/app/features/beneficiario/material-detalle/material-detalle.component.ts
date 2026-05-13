import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MaterialApiService } from '../../../core/services/material-api.service';
import { Material, SolicitudMaterial, EstadoMaterial, EstadoPubMaterial } from '../../../core/models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';

type BadgeType = 'disponible' | 'pendiente' | 'aprobado' | 'entregado' | 'rechazado' | 'verificado' | 'pendiente-verificacion' | 'secundario' | 'primary' | 'warning' | 'danger';

@Component({
  selector: 'app-material-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, BadgeComponent, UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <a routerLink="/beneficiario/materiales" class="bc-link">
          <mat-icon>arrow_back</mat-icon> Materiales
        </a>
      </nav>

      @if (loading()) {
        <div class="loading-wrap">
          <div class="spinner"></div>
          <p>Cargando material…</p>
        </div>
      } @else if (!material()) {
        <div class="not-found">
          <mat-icon>error_outline</mat-icon>
          <h2>Material no encontrado</h2>
          <a routerLink="/beneficiario/materiales" class="btn btn-primary">Volver al catálogo</a>
        </div>
      } @else {
        <div class="detalle-grid">
          <!-- Galería -->
          <div class="gallery-col">
            <div class="main-photo" [style.background]="headerBg()">
              @if (material()!.fotos?.length) {
                <img [src]="material()!.fotos[activePhoto()].url | uploadUrl" [alt]="material()!.nombre" class="main-img" />
              } @else {
                <mat-icon class="placeholder-icon">inventory_2</mat-icon>
              }
            </div>
            @if ((material()!.fotos?.length ?? 0) > 1) {
              <div class="thumbs">
                @for (f of material()!.fotos; track f.id; let i = $index) {
                  <img [src]="f.url | uploadUrl" [alt]="'Foto ' + (i+1)" class="thumb"
                       [class.active]="activePhoto() === i"
                       (click)="activePhoto.set(i)" />
                }
              </div>
            }
          </div>

          <!-- Info -->
          <div class="info-col">
            <div class="cat-badge" [style.background]="material()!.categoria?.colorHex + '18'" [style.color]="material()!.categoria?.colorHex">
              {{ material()!.categoria?.nombre }}
            </div>

            <h1 class="mat-title">{{ material()!.nombre }}</h1>

            <div class="meta-row">
              <app-badge [type]="estadoMatBadge(material()!.estadoMaterial)" />
              <app-badge [type]="estadoPubBadge(material()!.estadoPublicacion)" />
            </div>

            <div class="qty-block">
              <div class="qty-value">{{ material()!.cantidad }}</div>
              <div class="qty-unit">{{ material()!.unidadMedida }}</div>
              <div class="qty-label">disponibles</div>
            </div>

            @if (material()!.descripcion) {
              <p class="mat-desc">{{ material()!.descripcion }}</p>
            }

            @if (material()!.condicionesRetiro) {
              <div class="detail-block">
                <div class="detail-label"><mat-icon>info</mat-icon> Condiciones de retiro</div>
                <p class="detail-text">{{ material()!.condicionesRetiro }}</p>
              </div>
            }

            @if (material()!.fechaLimite) {
              <div class="detail-block">
                <div class="detail-label"><mat-icon>event</mat-icon> Disponible hasta</div>
                <p class="detail-text">{{ material()!.fechaLimite | date:'dd/MM/yyyy' }}</p>
              </div>
            }

            <!-- Empresa -->
            <div class="empresa-block card">
              <div class="empresa-logo">
                @if (material()!.constructora?.logoUrl) {
                  <img [src]="material()!.constructora!.logoUrl! | uploadUrl" alt="logo" />
                } @else {
                  <mat-icon>business</mat-icon>
                }
              </div>
              <div class="empresa-info">
                <div class="empresa-name">{{ material()!.constructora?.razonSocial }}</div>
                @if (material()!.constructora?.localidad) {
                  <div class="empresa-loc">
                    <mat-icon>location_on</mat-icon>
                    {{ material()!.constructora!.localidad!.nombre }}
                  </div>
                }
                @if (material()!.constructora?.verificada) {
                  <span class="verified-badge"><mat-icon>verified</mat-icon> Verificada</span>
                }
              </div>
            </div>

            <!-- Solicitud CTA -->
            @if (material()!.estadoPublicacion === 'activo') {
              <button class="btn btn-primary btn-lg btn-full" (click)="showModal.set(true)">
                <mat-icon>send</mat-icon> Solicitar material
              </button>
            } @else {
              <div class="not-available-msg">
                <mat-icon>block</mat-icon>
                Este material ya no está disponible.
              </div>
            }
          </div>
        </div>

        <!-- Solicitud modal -->
        @if (showModal()) {
          <div class="modal-overlay" (click)="showModal.set(false)">
            <div class="modal" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <h3>Solicitar material</h3>
                <button class="icon-btn" (click)="showModal.set(false)"><mat-icon>close</mat-icon></button>
              </div>

              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Cantidad a solicitar *</label>
                  <div class="qty-input-wrap">
                    <input type="number" class="form-control" [(ngModel)]="cantidadSol"
                           [min]="1" [max]="material()!.cantidad" placeholder="0" />
                    <span class="qty-unit-label">{{ material()!.unidadMedida }}</span>
                  </div>
                  <span class="form-hint">Máximo: {{ material()!.cantidad }} {{ material()!.unidadMedida }}</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Propósito de uso *</label>
                  <input type="text" class="form-control" [(ngModel)]="propositoUso"
                         placeholder="¿Para qué vas a usar el material?" />
                </div>

                <div class="form-group">
                  <label class="form-label">Descripción del proyecto</label>
                  <textarea class="form-control" [(ngModel)]="descripcionProyecto" rows="3"
                            placeholder="Cuéntanos más sobre tu proyecto de construcción..."></textarea>
                </div>

                @if (solicitudError()) {
                  <div class="alert alert-error">{{ solicitudError() }}</div>
                }
                @if (solicitudExito()) {
                  <div class="alert alert-success">¡Solicitud enviada exitosamente!</div>
                }
              </div>

              <div class="modal-footer">
                <button class="btn btn-ghost" (click)="showModal.set(false)">Cancelar</button>
                <button class="btn btn-primary" (click)="enviarSolicitud()" [disabled]="enviando()">
                  {{ enviando() ? 'Enviando...' : 'Enviar solicitud' }}
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styleUrl: './material-detalle.component.scss',
})
export class MaterialDetalleComponent implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matSvc = inject(MaterialApiService);

  readonly material       = signal<Material | null>(null);
  readonly loading        = signal(true);
  readonly activePhoto    = signal(0);
  readonly showModal      = signal(false);
  readonly enviando       = signal(false);
  readonly solicitudError = signal('');
  readonly solicitudExito = signal(false);

  cantidadSol       = 1;
  propositoUso      = '';
  descripcionProyecto = '';

  headerBg() {
    const color = this.material()?.categoria?.colorHex ?? '#C0392B';
    return `linear-gradient(135deg, ${color}18, ${color}08)`;
  }

  estadoMatBadge(e: EstadoMaterial): BadgeType {
    const map: Record<EstadoMaterial, BadgeType> = {
      nuevo:       'disponible',
      buen_estado: 'aprobado',
      usado:       'secundario',
    };
    return map[e] ?? 'secundario';
  }

  estadoPubBadge(e: EstadoPubMaterial): BadgeType {
    const map: Record<EstadoPubMaterial, BadgeType> = {
      borrador: 'pendiente',
      activo:   'disponible',
      pausado:  'warning',
      agotado:  'rechazado',
      vencido:  'danger',
    };
    return map[e] ?? 'secundario';
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/beneficiario/materiales']); return; }

    this.matSvc.getById(id).subscribe({
      next: r => { this.material.set(r.data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  enviarSolicitud() {
    if (!this.propositoUso.trim()) {
      this.solicitudError.set('El propósito de uso es requerido.');
      return;
    }
    if (this.cantidadSol < 1) {
      this.solicitudError.set('La cantidad debe ser mayor a 0.');
      return;
    }

    this.enviando.set(true);
    this.solicitudError.set('');

    this.matSvc.crearSolicitud(this.material()!.id, {
      cantidadSolicitada: this.cantidadSol,
      propositoUso: this.propositoUso,
      descripcionProyecto: this.descripcionProyecto || undefined,
    }).subscribe({
      next: () => {
        this.enviando.set(false);
        this.solicitudExito.set(true);
        setTimeout(() => {
          this.showModal.set(false);
          this.solicitudExito.set(false);
          this.router.navigate(['/beneficiario/mis-solicitudes']);
        }, 1800);
      },
      error: (e) => {
        this.enviando.set(false);
        this.solicitudError.set(e.error?.message ?? 'Error al enviar la solicitud.');
      },
    });
  }
}
