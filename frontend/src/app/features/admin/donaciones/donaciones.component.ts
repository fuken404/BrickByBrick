import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { EstadoSolicitud, ResumenSolicitudes, SolicitudMaterial } from '../../../core/models';
import { descargarArchivo, mensajeError, nombreArchivo } from '../../../core/utils/http';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';

const PESTANAS: { estado: EstadoSolicitud | undefined; label: string }[] = [
  { estado: undefined, label: 'Todas' }, { estado: 'pendiente', label: 'Pendientes' }, { estado: 'aprobada', label: 'Aprobadas' },
  { estado: 'entregada', label: 'Entregadas' }, { estado: 'rechazada', label: 'Rechazadas' }, { estado: 'cancelada', label: 'Canceladas' },
];

@Component({
  selector: 'app-admin-donaciones',
  standalone: true,
  imports: [DatePipe, DecimalPipe, MatIconModule, EmptyStateComponent, SkeletonLoaderComponent, EstadoBadgePipe, CopCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div><h1 class="page-title">Solicitudes de material</h1><p class="page-subtitle">Seguimiento de todas las donaciones de la plataforma.</p></div>
        <div class="actions"><button type="button" class="btn btn-ghost" (click)="exportar()"><mat-icon>download</mat-icon>Exportar CSV</button></div>
      </header>
      <div class="tabs">
        @for (p of pestanas; track p.label) {
          <button type="button" class="tab" [class.active]="estado() === p.estado" (click)="estado.set(p.estado); cargar()">
            {{ p.label }} @if (conteo(p.estado) !== null) { <span class="count">{{ conteo(p.estado) }}</span> }
          </button>
        }
      </div>
      @if (cargando()) {
        <app-skeleton-loader type="list" [count]="8" />
      } @else if (!items().length) {
        <div class="card"><app-empty-state icon="inbox" title="Sin solicitudes" /></div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Fecha</th><th>Material</th><th>Constructora</th><th>Beneficiario</th><th>Cantidad</th><th>Valor</th><th>Estado</th></tr></thead>
            <tbody>
              @for (s of items(); track s.id) {
                <tr>
                  <td class="small">{{ s.fechaSolicitud | date:'short' }}</td>
                  <td>{{ s.material?.nombre }}<div class="xsmall muted">{{ s.material?.categoria?.nombre }}</div></td>
                  <td class="small">{{ s.material?.constructora?.razonSocial }}</td>
                  <td class="small">{{ s.beneficiario?.nombreCompleto }}<div class="xsmall muted">{{ s.beneficiario?.localidad?.nombre }}</div></td>
                  <td>{{ s.cantidadSolicitada | number:'1.0-2' }} {{ s.material?.unidadMedida }}</td>
                  <td class="small">{{ s.valorDonadoCop !== null ? (s.valorDonadoCop | copCurrency) : '—' }}@if (s.numeroConstancia) { <div class="xsmall muted">{{ s.numeroConstancia }}</div> }</td>
                  <td>
                    @let b = s.estado | estadoBadge:'solicitud';
                    <span class="badge" [class]="b.cssClass">{{ b.label }}</span>
                    @if (s.estado === 'entregada' && s.fechaConfirmacion) { <mat-icon style="color:var(--accent);font-size:16px;width:16px;height:16px" title="Recepción confirmada">task_alt</mat-icon> }
                    @if (s.motivoRechazo && (s.estado === 'rechazada' || s.estado === 'cancelada')) { <div class="xsmall muted">{{ s.motivoRechazo }}</div> }
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
export class AdminDonacionesComponent implements OnInit {
  private readonly api = inject(MaterialApiService);
  private readonly admin = inject(AdminApiService);
  private readonly toast = inject(ToastService);

  protected readonly pestanas = PESTANAS;
  protected readonly estado = signal<EstadoSolicitud | undefined>(undefined);
  protected readonly items = signal<SolicitudMaterial[]>([]);
  protected readonly resumen = signal<ResumenSolicitudes | null>(null);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  private pagina = 1;

  ngOnInit(): void { this.cargar(); }

  conteo(estado: EstadoSolicitud | undefined): number | null {
    const r = this.resumen();
    if (!r) return null;
    return estado ? r[estado] : Object.values(r).reduce((a, b) => a + b, 0);
  }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    this.api.todasLasSolicitudes({ estado: this.estado(), page: this.pagina, limit: 25 }).subscribe({
      next: (r) => {
        this.items.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.resumen.set(r.data.resumen);
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  exportar(): void {
    this.admin.exportar('solicitudes').subscribe({
      next: (r) => descargarArchivo(r.body!, nombreArchivo(r.headers.get('Content-Disposition'), 'solicitudes.csv')),
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }
}
