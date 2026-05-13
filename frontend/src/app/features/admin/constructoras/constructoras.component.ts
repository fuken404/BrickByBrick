import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { UserApiService } from '../../../core/services/user-api.service';
import { Constructora, DocumentoEmpresa } from '../../../core/models';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';

@Component({
  selector: 'app-admin-constructoras',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, SkeletonLoaderComponent, EmptyStateComponent, AvatarComponent, UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Constructoras</h1>
          <p class="page-subtitle">{{ total() }} registradas · {{ verificadas() }} verificadas</p>
        </div>
        <div class="filter-wrap">
          <button class="chip" [class.active]="!soloNoVerificadas" (click)="soloNoVerificadas=false; load()">Todas</button>
          <button class="chip" [class.active]="soloNoVerificadas" (click)="soloNoVerificadas=true; load()">Pendientes</button>
        </div>
      </div>

      @if (loading()) {
        <app-skeleton-loader type="list" [count]="6" />
      } @else if (constructoras().length === 0) {
        <app-empty-state icon="business" title="Sin constructoras" description="No hay constructoras que mostrar." />
      } @else {
        <div class="table-card card">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>NIT</th>
                <th>Representante</th>
                <th>Localidad</th>
                <th>Estado</th>
                <th>Verificada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (c of constructoras(); track c.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      @if (c.logoUrl) {
                        <img [src]="c.logoUrl | uploadUrl" [alt]="c.razonSocial" class="logo-sm" />
                      } @else {
                        <app-avatar [name]="c.razonSocial" [size]="36" />
                      }
                      <div>
                        <div class="user-name">{{ c.razonSocial }}</div>
                        <div class="user-email">{{ c.usuario?.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ c.nit }}</td>
                  <td>{{ c.representanteLegal ?? '—' }}</td>
                  <td>{{ c.localidad?.nombre ?? '—' }}</td>
                  <td>
                    <span class="estado-pill" [class.activo]="c.usuario?.estado === 'activo'">{{ c.usuario?.estado }}</span>
                  </td>
                  <td>
                    <span class="pill" [class.on]="c.verificada">
                      {{ c.verificada ? 'Verificada' : 'Pendiente' }}
                    </span>
                  </td>
                  <td>
                    @if (!c.verificada) {
                      <button class="action-btn success" (click)="abrirPanel(c)" title="Ver documentos y verificar">
                        <mat-icon>verified</mat-icon>
                      </button>
                    } @else {
                      <span class="verified-check"><mat-icon>check_circle</mat-icon></span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (panelConstructora()) {
        <div class="panel-overlay" (click)="cerrarPanel()"></div>
        <aside class="doc-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">{{ panelConstructora()!.razonSocial }}</h2>
              <p class="panel-sub">{{ panelConstructora()!.nit }} · {{ panelConstructora()!.usuario?.email }}</p>
            </div>
            <button class="action-btn" (click)="cerrarPanel()"><mat-icon>close</mat-icon></button>
          </div>

          <div class="panel-section">
            <h3 class="panel-section-title">Documentos subidos</h3>
            @if ((panelConstructora()!.documentosEmpresa ?? []).length === 0) {
              <p class="no-docs">Esta empresa no ha subido documentos aún.</p>
            } @else {
              <div class="doc-list">
                @for (doc of panelConstructora()!.documentosEmpresa ?? []; track doc.id) {
                  <div class="doc-row">
                    <div class="doc-icon">
                      <mat-icon>description</mat-icon>
                    </div>
                    <div class="doc-info">
                      <div class="doc-tipo">{{ tipoLabel(doc.tipo) }}</div>
                      <div class="doc-meta">
                        Subido {{ doc.fechaSubida | date:'dd/MM/yyyy' }}
                        @if (doc.fechaVencimiento) { · Vence {{ doc.fechaVencimiento | date:'dd/MM/yyyy' }} }
                      </div>
                    </div>
                    <a [href]="doc.url | uploadUrl" target="_blank" class="action-btn" title="Ver documento">
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                  </div>
                }
              </div>
            }
          </div>

          <div class="panel-actions">
            <button class="btn btn-ghost" (click)="cerrarPanel()">Cancelar</button>
            <button class="btn btn-primary" (click)="verificar()">
              <mat-icon>verified</mat-icon> Verificar empresa
            </button>
          </div>
        </aside>
      }
    </div>
  `,
  styleUrl: './constructoras.component.scss',
})
export class AdminConstructorasComponent implements OnInit {
  private readonly userSvc = inject(UserApiService);

  readonly constructoras   = signal<Constructora[]>([]);
  readonly loading         = signal(true);
  readonly total           = signal(0);
  readonly panelConstructora = signal<Constructora | null>(null);

  soloNoVerificadas = false;

  readonly tipoLabels: Record<string, string> = {
    rut:            'RUT',
    camara_comercio: 'Cámara de Comercio',
  };
  tipoLabel(t: string) { return this.tipoLabels[t] ?? t; }

  verificadas() { return this.constructoras().filter(c => c.verificada).length; }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: Record<string, string> = { limit: '50' };
    if (this.soloNoVerificadas) params['verificada'] = 'false';

    this.userSvc.getConstructoras(params).subscribe({
      next: r => { this.constructoras.set(r.data.items); this.total.set(r.data.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  abrirPanel(c: Constructora) { this.panelConstructora.set(c); }
  cerrarPanel() { this.panelConstructora.set(null); }

  verificar() {
    const c = this.panelConstructora();
    if (!c) return;
    this.userSvc.verificarConstructora(c.id).subscribe({
      next: () => {
        this.constructoras.update(list => list.map(x => x.id === c.id ? { ...x, verificada: true } : x));
        this.panelConstructora.set(null);
      },
    });
  }
}
