import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { EstadoPubMaterial, Material } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { formatearDia } from '../../../core/utils/fechas';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';

const FILTROS: { estado: EstadoPubMaterial | undefined; label: string }[] = [
  { estado: undefined, label: 'Todos' }, { estado: 'activo', label: 'Publicados' }, { estado: 'borrador', label: 'Borradores' },
  { estado: 'pausado', label: 'Pausados' }, { estado: 'agotado', label: 'Agotados' }, { estado: 'vencido', label: 'Vencidos' },
];

@Component({
  selector: 'app-empresa-materiales',
  standalone: true,
  imports: [RouterLink, DecimalPipe, FormsModule, MatIconModule, EmptyStateComponent, SkeletonLoaderComponent, EstadoBadgePipe, CopCurrencyPipe, UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div><h1 class="page-title">Mis materiales</h1><p class="page-subtitle">{{ total() }} material(es) registrados.</p></div>
        <div class="actions"><a class="btn btn-primary" routerLink="/empresa/materiales/nuevo"><mat-icon>add</mat-icon>Publicar material</a></div>
      </header>

      <div class="toolbar">
        <div class="chips">
          @for (f of filtros; track f.label) {
            <button type="button" class="chip" [class.active]="estado() === f.estado" (click)="estado.set(f.estado); cargar()">{{ f.label }}</button>
          }
        </div>
        <div class="search"><mat-icon>search</mat-icon><input class="form-input" [(ngModel)]="q" (keyup.enter)="cargar()" placeholder="Buscar…" aria-label="Buscar materiales" /></div>
      </div>

      @if (cargando()) {
        <app-skeleton-loader type="list" [count]="6" />
      } @else if (!items().length) {
        <div class="card"><app-empty-state icon="inventory_2" title="No hay materiales aquí" description="Publica el material sobrante de tus obras para que llegue a quien lo necesita."
          actionLabel="Publicar material" (accion)="router.navigate(['/empresa/materiales/nuevo'])" /></div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Material</th><th>Disponible</th><th>Valor unitario</th><th>Vence</th><th>Solicitudes</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              @for (m of items(); track m.id) {
                <tr>
                  <td>
                    <div class="cell-user">
                      @if (m.fotos.length) { <img [src]="m.fotos[0].url | uploadUrl" alt="" style="width:40px;height:40px;border-radius:8px;object-fit:cover" /> }
                      @else { <mat-icon [style.color]="m.categoria.colorHex">{{ m.categoria.icono }}</mat-icon> }
                      <div><div class="strong">{{ m.nombre }}</div><div class="xsmall muted">{{ m.categoria.nombre }}</div></div>
                    </div>
                  </td>
                  <td>{{ m.cantidad | number:'1.0-2' }}{{ m.cantidadInicial && m.cantidadInicial !== m.cantidad ? ' / ' + (m.cantidadInicial | number:'1.0-2') : '' }} {{ m.unidadMedida }}</td>
                  <td>@if (m.valorUnitarioCop !== null) { {{ m.valorUnitarioCop | copCurrency }} } @else { <span class="badge badge-warning">Sin valor</span> }</td>
                  <td class="small">{{ dia(m.fechaLimite) }}</td>
                  <td><a class="btn-link" routerLink="/empresa/donaciones" [queryParams]="{ materialId: m.id }">{{ m._count.solicitudes }}</a></td>
                  <td>@let b = m.estadoPublicacion | estadoBadge:'material'; <span class="badge" [class]="b.cssClass">{{ b.label }}</span></td>
                  <td>
                    <div class="row" style="justify-content:flex-end;flex-wrap:nowrap">
                      @if (m.estadoPublicacion === 'borrador' || m.estadoPublicacion === 'pausado') {
                        <button type="button" class="icon-btn" title="Publicar" aria-label="Publicar" (click)="estadoMaterial(m, 'activo')" [disabled]="procesando() === m.id"><mat-icon>publish</mat-icon></button>
                      }
                      @if (m.estadoPublicacion === 'activo') {
                        <button type="button" class="icon-btn" title="Pausar" aria-label="Pausar" (click)="estadoMaterial(m, 'pausado')" [disabled]="procesando() === m.id"><mat-icon>pause</mat-icon></button>
                      }
                      <a class="icon-btn" title="Editar" aria-label="Editar" [routerLink]="['/empresa/materiales', m.id, 'editar']"><mat-icon>edit</mat-icon></a>
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
export class EmpresaMaterialesComponent implements OnInit {
  private readonly api = inject(MaterialApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);
  protected readonly router = inject(Router);

  protected readonly filtros = FILTROS;
  protected readonly estado = signal<EstadoPubMaterial | undefined>(undefined);
  protected readonly items = signal<Material[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  protected readonly procesando = signal<string | null>(null);
  protected q = '';
  private pagina = 1;

  ngOnInit(): void { this.cargar(); }

  dia(iso: string | null): string { return formatearDia(iso); }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    this.api.misMateriales({ estadoPublicacion: this.estado(), q: this.q.trim() || undefined, page: this.pagina, limit: 20 }).subscribe({
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
      next: (r) => {
        this.procesando.set(null);
        this.items.update((l) => l.map((x) => (x.id === m.id ? { ...x, ...r.data } : x)));
        this.toast.exito(estado === 'activo' ? 'Material publicado' : 'Material pausado');
      },
      error: (e) => { this.procesando.set(null); this.toast.error(mensajeError(e)); },
    });
  }

  eliminar(m: Material): void {
    this.dialogo.confirmar({
      titulo: 'Eliminar material', mensaje: `"${m.nombre}" dejará de estar visible. Las entregas ya realizadas se conservan para tus constancias.`,
      confirmar: 'Eliminar', peligroso: true,
    }).subscribe(() => {
      this.procesando.set(m.id);
      this.api.eliminar(m.id).subscribe({
        next: () => { this.procesando.set(null); this.items.update((l) => l.filter((x) => x.id !== m.id)); this.total.update((t) => t - 1); this.toast.exito('Material eliminado'); },
        error: (e) => { this.procesando.set(null); this.toast.error(mensajeError(e)); },
      });
    });
  }
}
