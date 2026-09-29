import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { CatalogStore } from '../../../core/stores/catalog.store';
import { AuthStore } from '../../../core/auth/auth.store';
import { EstadoMaterial, FiltrosMaterial, Material } from '../../../core/models';
import { MaterialCardComponent } from '../../../shared/components/material-card/material-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

/** Catálogo de materiales disponibles (beneficiario). */
@Component({
  selector: 'app-materiales',
  standalone: true,
  imports: [FormsModule, MatIconModule, MaterialCardComponent, EmptyStateComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Materiales disponibles</h1>
          <p class="page-subtitle">{{ total() }} material(es) donados por constructoras verificadas.</p>
        </div>
      </header>

      <div class="card card-pad stack-sm">
        <div class="toolbar">
          <div class="search grow">
            <mat-icon>search</mat-icon>
            <input class="form-input" [(ngModel)]="q" (ngModelChange)="buscar$.next()" placeholder="Buscar por nombre o descripción…" aria-label="Buscar materiales" />
          </div>
          <select class="form-select" [(ngModel)]="localidadId" (ngModelChange)="cargar()" aria-label="Localidad">
            <option [ngValue]="undefined">Todas las localidades</option>
            @for (l of catalogo.localidades(); track l.id) { <option [ngValue]="l.id">{{ l.nombre }}</option> }
          </select>
          <select class="form-select" [(ngModel)]="estadoMaterial" (ngModelChange)="cargar()" aria-label="Estado del material">
            <option [ngValue]="undefined">Cualquier estado</option>
            <option value="nuevo">Nuevo</option>
            <option value="buen_estado">Buen estado</option>
            <option value="usado">Usado</option>
          </select>
          <select class="form-select" [(ngModel)]="orden" (ngModelChange)="cargar()" aria-label="Ordenar">
            <option value="recientes">Más recientes</option>
            <option value="vencen">Próximos a vencer</option>
            <option value="cantidad">Mayor cantidad</option>
          </select>
        </div>
        <div class="chips" role="group" aria-label="Categorías">
          <button type="button" class="chip" [class.active]="!categoriaId" (click)="categoria(undefined)">Todas</button>
          @for (c of catalogo.categorias(); track c.id) {
            <button type="button" class="chip" [class.active]="categoriaId === c.id" (click)="categoria(c.id)">
              <mat-icon [style.color]="c.colorHex">{{ c.icono }}</mat-icon>{{ c.nombre }}
            </button>
          }
        </div>
      </div>

      @if (cargando()) {
        <app-skeleton-loader type="card" [count]="8" />
      } @else if (!items().length) {
        <div class="card">
          <app-empty-state icon="search_off" title="No encontramos materiales" description="Prueba con otros filtros o vuelve pronto: las constructoras publican material nuevo constantemente."
            [actionLabel]="hayFiltros() ? 'Limpiar filtros' : null" (accion)="limpiar()" />
        </div>
      } @else {
        <div class="grid-cards">
          @for (m of items(); track m.id) { <app-material-card [material]="m" (abrir)="abrir($event)" /> }
        </div>
        @if (hayMas()) {
          <div class="load-more"><button type="button" class="btn btn-ghost" (click)="cargar(true)" [disabled]="cargandoMas()">Cargar más</button></div>
        }
      }
    </div>
  `,
})
export class MaterialesComponent implements OnInit {
  private readonly api = inject(MaterialApiService);
  protected readonly catalogo = inject(CatalogStore);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly items = signal<Material[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly cargandoMas = signal(false);
  protected readonly hayMas = signal(false);
  protected readonly buscar$ = new Subject<void>();

  protected q = '';
  protected categoriaId?: number;
  protected localidadId?: number;
  protected estadoMaterial?: EstadoMaterial;
  protected orden: NonNullable<FiltrosMaterial['orden']> = 'recientes';
  private pagina = 1;

  constructor() {
    this.buscar$.pipe(debounceTime(350), takeUntilDestroyed()).subscribe(() => this.cargar());
  }

  ngOnInit(): void {
    this.catalogo.cargarTodo();
    const params = this.route.snapshot.queryParamMap;
    this.q = params.get('q') ?? '';
    const cat = Number(params.get('categoriaId'));
    if (cat) this.categoriaId = cat;
    this.cargar();
  }

  hayFiltros(): boolean {
    return !!(this.q || this.categoriaId || this.localidadId || this.estadoMaterial);
  }

  categoria(id: number | undefined): void {
    this.categoriaId = id;
    this.cargar();
  }

  limpiar(): void {
    this.q = '';
    this.categoriaId = this.localidadId = this.estadoMaterial = undefined;
    this.cargar();
  }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    (mas ? this.cargandoMas : this.cargando).set(true);
    this.api.catalogo({
      q: this.q.trim() || undefined, categoriaId: this.categoriaId, localidadId: this.localidadId,
      estadoMaterial: this.estadoMaterial, orden: this.orden, page: this.pagina, limit: 12,
    }).subscribe({
      next: (r) => {
        this.items.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.total.set(r.data.total);
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
        this.cargandoMas.set(false);
      },
      error: () => { this.cargando.set(false); this.cargandoMas.set(false); },
    });
  }

  abrir(m: Material): void {
    this.router.navigate([this.auth.prefijo(), 'materiales', m.id]);
  }
}
