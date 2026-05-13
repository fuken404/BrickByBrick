import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MaterialApiService } from '../../../core/services/material-api.service';
import { Material, FiltrosMaterial } from '../../../core/models';
import { MaterialCardComponent } from '../../../shared/components/material-card/material-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

interface CatItem { id: number; nombre: string; }

@Component({
  selector: 'app-materiales',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MaterialCardComponent, SkeletonLoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Materiales disponibles</h1>
        <p class="page-subtitle">{{ total() }} materiales encontrados</p>
      </div>

      <div class="filters-bar card">
        <div class="search-wrap">
          <mat-icon class="search-icon">search</mat-icon>
          <input class="search-input" type="text" placeholder="Buscar materiales..."
                 [(ngModel)]="query" (input)="onSearch()" />
          @if (query) {
            <button class="clear-btn" (click)="query=''; onSearch()"><mat-icon>close</mat-icon></button>
          }
        </div>

        <div class="filter-chips">
          <button class="chip" [class.active]="!filtros().categoriaId" (click)="setCat(undefined)">
            Todos
          </button>
          @for (c of categorias; track c.id) {
            <button class="chip" [class.active]="filtros().categoriaId === c.id" (click)="setCat(c.id)">
              {{ c.nombre }}
            </button>
          }
        </div>

        <select class="select-sm" [(ngModel)]="estadoMat" (change)="applyFilters()">
          <option value="">Cualquier estado</option>
          <option value="nuevo">Nuevo</option>
          <option value="buen_estado">Buen estado</option>
          <option value="usado">Usado</option>
        </select>
      </div>

      @if (loading()) {
        <app-skeleton-loader type="card" [count]="8" />
      } @else if (materiales().length === 0) {
        <app-empty-state
          icon="inventory_2"
          title="Sin resultados"
          description="No encontramos materiales con ese filtro."
          actionLabel="Limpiar filtros"
          [actionFn]="resetFiltros.bind(this)"
        />
      } @else {
        <div class="grid">
          @for (m of materiales(); track m.id) {
            <app-material-card [material]="m" (clicked)="goToDetalle($event)" />
          }
        </div>

        @if (hasMore()) {
          <div class="load-more">
            <button class="btn btn-ghost" (click)="loadMore()" [disabled]="loadingMore()">
              {{ loadingMore() ? 'Cargando...' : 'Cargar más' }}
            </button>
          </div>
        }
      }
    </div>
  `,
  styleUrl: './materiales.component.scss',
})
export class MaterialesComponent implements OnInit {
  private readonly matSvc = inject(MaterialApiService);
  private readonly router = inject(Router);

  readonly materiales  = signal<Material[]>([]);
  readonly loading     = signal(true);
  readonly loadingMore = signal(false);
  readonly total       = signal(0);
  readonly filtros     = signal<FiltrosMaterial>({ page: 1, limit: 12 });

  query     = '';
  estadoMat = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly categorias: CatItem[] = [
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

  hasMore() { return this.materiales().length < this.total(); }

  ngOnInit() { this.load(); }

  private load(append = false) {
    if (append) this.loadingMore.set(true);
    else        this.loading.set(true);

    this.matSvc.getAll(this.filtros()).subscribe({
      next: r => {
        const items = r.data.items;
        this.materiales.update(prev => append ? [...prev, ...items] : items);
        this.total.set(r.data.total);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); },
    });
  }

  onSearch() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.applyFilters(), 400);
  }

  applyFilters() {
    this.filtros.update(f => ({
      ...f,
      q: this.query || undefined,
      estado: (this.estadoMat as FiltrosMaterial['estado']) || undefined,
      page: 1,
    }));
    this.load();
  }

  setCat(id: number | undefined) {
    this.filtros.update(f => ({ ...f, categoriaId: id, page: 1 }));
    this.load();
  }

  loadMore() {
    this.filtros.update(f => ({ ...f, page: (f.page ?? 1) + 1 }));
    this.load(true);
  }

  resetFiltros() {
    this.query = '';
    this.estadoMat = '';
    this.filtros.set({ page: 1, limit: 12 });
    this.load();
  }

  goToDetalle(m: Material) {
    this.router.navigate(['/beneficiario/materiales', m.id]);
  }
}
