import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { RegistroAuditoria } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

const ENTIDADES = ['usuario', 'constructora', 'documento', 'material', 'solicitud', 'evento', 'publicacion', 'comentario', 'reporte', 'configuracion', 'categoria'];

@Component({
  selector: 'app-admin-auditoria',
  standalone: true,
  imports: [DatePipe, JsonPipe, FormsModule, MatIconModule, EmptyStateComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div><h1 class="page-title">Auditoría</h1><p class="page-subtitle">Registro de acciones administrativas y sensibles.</p></div>
        <div class="actions">
          <select class="form-select" [(ngModel)]="entidad" (ngModelChange)="cargar()" aria-label="Entidad">
            <option [ngValue]="undefined">Todas las entidades</option>
            @for (e of entidades; track e) { <option [value]="e">{{ e }}</option> }
          </select>
        </div>
      </header>
      @if (cargando()) {
        <app-skeleton-loader type="list" [count]="10" />
      } @else if (!items().length) {
        <div class="card"><app-empty-state icon="history" title="Sin registros" /></div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Detalle</th></tr></thead>
            <tbody>
              @for (a of items(); track a.id) {
                <tr>
                  <td class="small">{{ a.createdAt | date:'medium' }}</td>
                  <td class="small">{{ a.usuario?.email ?? 'Sistema' }}</td>
                  <td><code>{{ a.accion }}</code></td>
                  <td class="small">{{ a.entidad }}@if (a.entidadId) { <div class="xsmall muted truncate" style="max-width:160px">{{ a.entidadId }}</div> }</td>
                  <td class="xsmall">@if (a.detalle) { <code class="truncate" style="display:block;max-width:320px" [title]="a.detalle | json">{{ a.detalle | json }}</code> }</td>
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
export class AdminAuditoriaComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  protected readonly entidades = ENTIDADES;
  protected readonly items = signal<RegistroAuditoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  protected entidad?: string;
  private pagina = 1;

  ngOnInit(): void { this.cargar(); }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    this.api.auditoria({ entidad: this.entidad, page: this.pagina, limit: 50 }).subscribe({
      next: (r) => {
        this.items.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
