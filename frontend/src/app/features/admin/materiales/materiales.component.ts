import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { CatalogStore } from '../../../core/stores/catalog.store';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { EstadoPubMaterial, Material } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { FechaRelativaPipe } from '../../../shared/pipes/fecha-relativa.pipe';

@Component({
  selector: 'app-admin-materiales',
  standalone: true,
  imports: [RouterLink, DecimalPipe, FormsModule, MatIconModule, EmptyStateComponent, SkeletonLoaderComponent, EstadoBadgePipe, CopCurrencyPipe, FechaRelativaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div><h1 class="page-title">Materiales</h1><p class="page-subtitle">{{ total() }} material(es) en todos los estados.</p></div>
      </header>
      <div class="toolbar">
        <form class="search grow" (ngSubmit)="cargar()"><mat-icon>search</mat-icon>
          <input class="form-input" name="q" [(ngModel)]="q" placeholder="Buscar material…" aria-label="Buscar materiales" /></form>
        <select class="form-select" [(ngModel)]="estado" (ngModelChange)="cargar()" aria-label="Estado">
          <option [ngValue]="undefined">Todos los estados</option>
          <option value="activo">Disponibles</option><option value="borrador">Borradores</option><option value="pausado">Pausados</option>
          <option value="agotado">Agotados</option><option value="vencido">Vencidos</option>
        </select>
        <select class="form-select" [(ngModel)]="categoriaId" (ngModelChange)="cargar()" aria-label="Categoría">
          <option [ngValue]="undefined">Todas las categorías</option>
          @for (c of catalogo.categorias(); track c.id) { <option [ngValue]="c.id">{{ c.nombre }}</option> }
        </select>
      </div>
      @if (cargando()) {
        <app-skeleton-loader type="list" [count]="8" />
      } @else if (!items().length) {
        <div class="card"><app-empty-state icon="inventory_2" title="Sin resultados" /></div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Material</th><th>Constructora</th><th>Disponible</th><th>Valor unit.</th><th>Solicitudes</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              @for (m of items(); track m.id) {
                <tr>
                  <td><div class="strong">{{ m.nombre }}</div><div class="xsmall muted">{{ m.categoria.nombre }} · {{ (m.publicadoEn ?? m.createdAt) | fechaRelativa }}</div></td>
                  <td><a class="btn-link" [routerLink]="['/admin/usuarios', m.constructora.usuarioId]">{{ m.constructora.razonSocial }}</a></td>
                  <td>{{ m.cantidad | number:'1.0-2' }} {{ m.unidadMedida }}</td>
                  <td>{{ m.valorUnitarioCop !== null ? (m.valorUnitarioCop | copCurrency) : '—' }}</td>
                  <td>{{ m._count.solicitudes }}</td>
                  <td>@let b = m.estadoPublicacion | estadoBadge:'material'; <span class="badge" [class]="b.cssClass">{{ b.label }}</span></td>
                  <td>
                    <div class="row" style="justify-content:flex-end;flex-wrap:nowrap">
                      @if (m.estadoPublicacion === 'activo') {
                        <button type="button" class="icon-btn" title="Pausar" aria-label="Pausar" (click)="estadoMaterial(m, 'pausado')" [disabled]="procesando() === m.id"><mat-icon>pause</mat-icon></button>
                      }
                      @if (m.estadoPublicacion === 'pausado') {
                        <button type="button" class="icon-btn" title="Reactivar" aria-label="Reactivar" (click)="estadoMaterial(m, 'activo')" [disabled]="procesando() === m.id"><mat-icon>play_arrow</mat-icon></button>
                      }
                      <button type="button" class="icon-btn danger" title="Eliminar" aria-label="Eliminar" (click)="eliminar(m)" [disabled]="procesando() === m.id"><mat-icon>delete</mat-icon></button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (hayMas()) { <div class="load-more"><button type="button" class="btn btn-ghost" (click)="cargar(true)">Cargar más</button></div> }
      }
    </div>
  `,
})
export class AdminMaterialesComponent implements OnInit {
  private readonly api = inject(MaterialApiService);
  protected readonly catalogo = inject(CatalogStore);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);
  private readonly route = inject(ActivatedRoute);

  protected readonly items = signal<Material[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  protected readonly procesando = signal<string | null>(null);
  protected q = '';
  protected estado?: EstadoPubMaterial;
  protected categoriaId?: number;
  private pagina = 1;

  ngOnInit(): void {
    this.catalogo.cargarCategorias().subscribe({ error: () => undefined });
    this.q = this.route.snapshot.queryParamMap.get('q') ?? '';
    this.cargar();
  }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    this.api.adminMateriales({ q: this.q.trim() || undefined, estadoPublicacion: this.estado, categoriaId: this.categoriaId, page: this.pagina, limit: 25 }).subscribe({
      next: (r) => {
        this.items.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.total.set(r.data.total);
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  estadoMaterial(m: Material, estado: 'activo' | 'pausado'): void {
    this.procesando.set(m.id);
    this.api.cambiarEstado(m.id, estado).subscribe({
      next: (r) => { this.procesando.set(null); this.items.update((l) => l.map((x) => (x.id === m.id ? { ...x, ...r.data } : x))); this.toast.exito('Estado actualizado'); },
      error: (e) => { this.procesando.set(null); this.toast.error(mensajeError(e)); },
    });
  }

  eliminar(m: Material): void {
    this.dialogo.confirmar({ titulo: 'Eliminar material', mensaje: `"${m.nombre}" de ${m.constructora.razonSocial} dejará de estar visible.`, confirmar: 'Eliminar', peligroso: true })
      .subscribe(() => {
        this.procesando.set(m.id);
        this.api.eliminar(m.id).subscribe({
          next: () => { this.procesando.set(null); this.items.update((l) => l.filter((x) => x.id !== m.id)); this.total.update((t) => t - 1); this.toast.exito('Material eliminado'); },
          error: (e) => { this.procesando.set(null); this.toast.error(mensajeError(e)); },
        });
      });
  }
}
