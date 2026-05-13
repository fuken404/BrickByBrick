import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { MaterialApiService } from '../../../core/services/material-api.service';
import { Material } from '../../../core/models';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';

type BadgeType = 'disponible'|'pendiente'|'aprobado'|'entregado'|'rechazado'|'verificado'|'pendiente-verificacion'|'secundario'|'primary'|'warning'|'danger';

@Component({
  selector: 'app-empresa-materiales',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, SkeletonLoaderComponent, EmptyStateComponent, ConfirmationModalComponent, UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Mis materiales</h1>
          <p class="page-subtitle">{{ total() }} publicaciones en total</p>
        </div>
        <a routerLink="/empresa/materiales/nuevo" class="btn btn-primary">
          <mat-icon>add</mat-icon> Nuevo material
        </a>
      </div>

      <!-- Estado filter -->
      <div class="filter-chips">
        <button class="chip" [class.active]="!estadoFiltro" (click)="setEstado(undefined)">Todos</button>
        @for (e of estadoOpts; track e.value) {
          <button class="chip" [class.active]="estadoFiltro === e.value" (click)="setEstado(e.value)">{{ e.label }}</button>
        }
      </div>

      @if (loading()) {
        <app-skeleton-loader type="list" [count]="6" />
      } @else if (materiales().length === 0) {
        <app-empty-state
          icon="inventory_2"
          title="Sin materiales"
          description="Publica tus primeros materiales excedentes."
          actionLabel="Publicar material"
          [actionFn]="irANuevo.bind(this)"
        />
      } @else {
        <div class="materiales-table card">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Estado pub.</th>
                <th>Solicitudes</th>
                <th>Publicado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (m of materiales(); track m.id) {
                <tr>
                  <td>
                    <div class="mat-cell">
                      @if (m.fotos?.length) {
                        <img [src]="m.fotos[0].url | uploadUrl" [alt]="m.nombre" class="mat-thumb" />
                      } @else {
                        <div class="mat-thumb-ph" [style.background]="(m.categoria?.colorHex ?? '#ccc') + '20'">
                          <mat-icon [style.color]="m.categoria?.colorHex ?? '#ccc'">inventory_2</mat-icon>
                        </div>
                      }
                      <span class="mat-nombre">{{ m.nombre }}</span>
                    </div>
                  </td>
                  <td>{{ m.categoria?.nombre }}</td>
                  <td>{{ m.cantidad }} {{ m.unidadMedida }}</td>
                  <td>
                    <span class="estado-pill estado-{{ m.estadoPublicacion }}">{{ m.estadoPublicacion }}</span>
                  </td>
                  <td>{{ m._count?.solicitudes ?? 0 }}</td>
                  <td>{{ m.createdAt | date:'dd/MM/yy' }}</td>
                  <td>
                    <div class="acciones">
                      <a [routerLink]="['/empresa/materiales', m.id, 'editar']" class="action-btn" title="Editar">
                        <mat-icon>edit</mat-icon>
                      </a>
                      @if (m.estadoPublicacion === 'activo') {
                        <button class="action-btn warning" (click)="cambiarEstado(m, 'pausado')" title="Pausar">
                          <mat-icon>pause</mat-icon>
                        </button>
                      } @else if (m.estadoPublicacion === 'pausado') {
                        <button class="action-btn success" (click)="cambiarEstado(m, 'activo')" title="Activar">
                          <mat-icon>play_arrow</mat-icon>
                        </button>
                      }
                      <button class="action-btn danger" (click)="confirmarEliminar(m)" title="Eliminar">
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

      @if (materialAEliminar()) {
        <app-confirmation-modal
          title="Eliminar material"
          [message]="'¿Estás seguro de que deseas eliminar ' + materialAEliminar()!.nombre + '? Esta acción no se puede deshacer.'"
          confirmLabel="Eliminar"
          [dangerous]="true"
          (confirmed)="eliminar()"
          (cancelled)="materialAEliminar.set(null)"
        />
      }
    </div>
  `,
  styleUrl: './materiales.component.scss',
})
export class EmpresaMaterialesComponent implements OnInit {
  private readonly matSvc = inject(MaterialApiService);
  private readonly router = inject(Router);

  readonly materiales         = signal<Material[]>([]);
  readonly loading            = signal(true);
  readonly total              = signal(0);
  readonly materialAEliminar  = signal<Material | null>(null);

  estadoFiltro: string | undefined;

  readonly estadoOpts = [
    { value: 'activo',   label: 'Activos' },
    { value: 'pausado',  label: 'Pausados' },
    { value: 'borrador', label: 'Borradores' },
    { value: 'agotado',  label: 'Agotados' },
    { value: 'vencido',  label: 'Vencidos' },
  ];

  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    const filtros: { estadoPublicacion?: string; limit: number } = { limit: 50 };
    if (this.estadoFiltro) filtros.estadoPublicacion = this.estadoFiltro;
    this.matSvc.getMisMateriales(filtros).subscribe({
      next: r => {
        this.materiales.set(r.data.items);
        this.total.set(r.data.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setEstado(v: string | undefined) { this.estadoFiltro = v; this.load(); }

  irANuevo() { this.router.navigate(['/empresa/materiales/nuevo']); }

  cambiarEstado(m: Material, estado: string) {
    this.matSvc.cambiarEstado(m.id, estado).subscribe({
      next: () => {
        this.materiales.update(list =>
          list.map(x => x.id === m.id ? { ...x, estadoPublicacion: estado as Material['estadoPublicacion'] } : x)
        );
      },
    });
  }

  confirmarEliminar(m: Material) { this.materialAEliminar.set(m); }

  eliminar() {
    const m = this.materialAEliminar();
    if (!m) return;
    this.matSvc.delete(m.id).subscribe({
      next: () => {
        this.materiales.update(list => list.filter(x => x.id !== m.id));
        this.materialAEliminar.set(null);
      },
    });
  }
}
