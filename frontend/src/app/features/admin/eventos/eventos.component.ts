import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EventApiService } from '../../../core/services/event-api.service';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { EstadoEvento, Evento } from '../../../core/models';
import { descargarArchivo, mensajeError, nombreArchivo } from '../../../core/utils/http';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';

@Component({
  selector: 'app-admin-eventos',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, MatIconModule, EmptyStateComponent, SkeletonLoaderComponent, EstadoBadgePipe, EtiquetaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div><h1 class="page-title">Eventos</h1><p class="page-subtitle">{{ total() }} evento(s).</p></div>
        <div class="actions"><button type="button" class="btn btn-ghost" (click)="exportar()"><mat-icon>download</mat-icon>Exportar CSV</button></div>
      </header>
      <div class="toolbar">
        <form class="search grow" (ngSubmit)="cargar()"><mat-icon>search</mat-icon>
          <input class="form-input" name="q" [(ngModel)]="q" placeholder="Buscar evento…" aria-label="Buscar eventos" /></form>
        <select class="form-select" [(ngModel)]="estado" (ngModelChange)="cargar()" aria-label="Estado">
          <option [ngValue]="undefined">Todos los estados</option>
          <option value="borrador">Borradores</option><option value="publicado">Publicados</option><option value="en_curso">En curso</option>
          <option value="finalizado">Finalizados</option><option value="cancelado">Cancelados</option>
        </select>
      </div>
      @if (cargando()) {
        <app-skeleton-loader type="list" [count]="8" />
      } @else if (!items().length) {
        <div class="card"><app-empty-state icon="event" title="Sin eventos" /></div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Evento</th><th>Organiza</th><th>Fecha</th><th>Localidad</th><th>Inscritos</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              @for (e of items(); track e.id) {
                <tr>
                  <td><a class="strong" [routerLink]="['/admin/eventos', e.id]">{{ e.nombre }}</a><div class="xsmall muted">{{ e.tipoEvento | etiqueta:'tipoEvento' }}</div></td>
                  <td class="small">{{ e.constructora.razonSocial }}</td>
                  <td class="small">{{ e.fechaInicio | date:'d MMM y, h:mm a' }}</td>
                  <td class="small">{{ e.localidad?.nombre ?? '—' }}</td>
                  <td>{{ e.inscritos }}{{ e.capacidadMaxima ? ' / ' + e.capacidadMaxima : '' }}</td>
                  <td>@let b = e.estado | estadoBadge:'evento'; <span class="badge" [class]="b.cssClass">{{ b.label }}</span></td>
                  <td>
                    <div class="row" style="justify-content:flex-end;flex-wrap:nowrap">
                      <a class="icon-btn" title="Gestionar" aria-label="Gestionar" [routerLink]="['/admin/eventos', e.id]"><mat-icon>open_in_new</mat-icon></a>
                      @if (e.estado === 'publicado' || e.estado === 'en_curso') {
                        <button type="button" class="icon-btn danger" title="Cancelar evento" aria-label="Cancelar evento" (click)="cancelar(e)"><mat-icon>event_busy</mat-icon></button>
                      }
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
export class AdminEventosComponent implements OnInit {
  private readonly api = inject(EventApiService);
  private readonly admin = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);

  protected readonly items = signal<Evento[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  protected q = '';
  protected estado?: EstadoEvento;
  private pagina = 1;

  ngOnInit(): void { this.cargar(); }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    this.api.adminEventos({ q: this.q.trim() || undefined, estado: this.estado, alcance: 'todos', page: this.pagina, limit: 25 }).subscribe({
      next: (r) => {
        this.items.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.total.set(r.data.total);
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  cancelar(e: Evento): void {
    this.dialogo.pedirTexto({
      titulo: `Cancelar "${e.nombre}"`, mensaje: `Se notificará a la constructora y a los ${e.inscritos} inscritos.`,
      confirmar: 'Cancelar evento', peligroso: true, campo: { etiqueta: 'Motivo', minimo: 5 },
    }).subscribe((motivo) => this.api.cambiarEstado(e.id, 'cancelado', motivo).subscribe({
      next: (r) => { this.items.update((l) => l.map((x) => (x.id === e.id ? { ...x, ...r.data } : x))); this.toast.exito('Evento cancelado'); },
      error: (err) => this.toast.error(mensajeError(err)),
    }));
  }

  exportar(): void {
    this.admin.exportar('eventos').subscribe({
      next: (r) => descargarArchivo(r.body!, nombreArchivo(r.headers.get('Content-Disposition'), 'eventos.csv')),
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }
}
