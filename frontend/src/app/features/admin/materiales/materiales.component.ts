import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MaterialApiService } from '../../../core/services/material-api.service';
import { Material } from '../../../core/models';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-materiales',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, SkeletonLoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Materiales</h1>
          <p class="page-subtitle">{{ total() }} publicaciones en la plataforma</p>
        </div>
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input type="text" class="search-input" placeholder="Buscar..." [(ngModel)]="query" (input)="onSearch()" />
        </div>
      </div>

      <div class="filter-chips">
        <button class="chip" [class.active]="!estadoFiltro" (click)="estadoFiltro=''; load()">Todos</button>
        @for (e of estadoOpts; track e.value) {
          <button class="chip" [class.active]="estadoFiltro === e.value" (click)="estadoFiltro=e.value; load()">{{ e.label }}</button>
        }
      </div>

      @if (loading()) {
        <app-skeleton-loader type="list" [count]="8" />
      } @else if (materiales().length === 0) {
        <app-empty-state icon="inventory_2" title="Sin materiales" description="No hay materiales que mostrar." />
      } @else {
        <div class="table-card card">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Empresa</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Estado</th>
                <th>Solicitudes</th>
                <th>Publicado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (m of materiales(); track m.id) {
                <tr>
                  <td><div class="mat-nombre">{{ m.nombre }}</div></td>
                  <td>{{ m.constructora?.razonSocial }}</td>
                  <td>
                    <span class="cat-pill" [style.background]="(m.categoria?.colorHex ?? '#ccc') + '20'" [style.color]="m.categoria?.colorHex ?? '#ccc'">
                      {{ m.categoria?.nombre }}
                    </span>
                  </td>
                  <td>{{ m.cantidad }} {{ m.unidadMedida }}</td>
                  <td><span class="estado-pill estado-{{ m.estadoPublicacion }}">{{ m.estadoPublicacion }}</span></td>
                  <td>{{ m._count?.solicitudes ?? 0 }}</td>
                  <td>{{ m.createdAt | date:'dd/MM/yy' }}</td>
                  <td>
                    <div class="acciones">
                      @if (m.estadoPublicacion === 'activo') {
                        <button class="action-btn warning" (click)="cambiarEstado(m, 'pausado')" title="Pausar">
                          <mat-icon>pause</mat-icon>
                        </button>
                      } @else if (m.estadoPublicacion === 'pausado') {
                        <button class="action-btn success" (click)="cambiarEstado(m, 'activo')" title="Reactivar">
                          <mat-icon>play_arrow</mat-icon>
                        </button>
                      }
                      <button class="action-btn danger" (click)="eliminar(m)" title="Eliminar">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styleUrl: './materiales.component.scss',
})
export class AdminMaterialesComponent implements OnInit {
  private readonly matSvc = inject(MaterialApiService);

  readonly materiales = signal<Material[]>([]);
  readonly loading    = signal(true);
  readonly total      = signal(0);

  query = '';
  estadoFiltro = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly estadoOpts = [
    { value: 'activo',   label: 'Activos' },
    { value: 'pausado',  label: 'Pausados' },
    { value: 'agotado',  label: 'Agotados' },
    { value: 'vencido',  label: 'Vencidos' },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.matSvc.getAll({ q: this.query || undefined, limit: 50 }).subscribe({
      next: r => { this.materiales.set(r.data.items); this.total.set(r.data.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), 400);
  }

  cambiarEstado(m: Material, estado: string) {
    this.matSvc.cambiarEstado(m.id, estado).subscribe({
      next: () => this.materiales.update(list => list.map(x => x.id === m.id ? { ...x, estadoPublicacion: estado as Material['estadoPublicacion'] } : x)),
    });
  }

  eliminar(m: Material) {
    this.matSvc.delete(m.id).subscribe({
      next: () => this.materiales.update(list => list.filter(x => x.id !== m.id)),
    });
  }
}
