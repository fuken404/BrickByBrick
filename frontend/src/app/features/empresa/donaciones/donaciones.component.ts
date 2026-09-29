import { ChangeDetectionStrategy, Component, ElementRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { TributarioApiService } from '../../../core/services/tributario-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { EstadoSolicitud, ResumenSolicitudes, SolicitudMaterial } from '../../../core/models';
import { descargarArchivo, mensajeError, nombreArchivo } from '../../../core/utils/http';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { FechaRelativaPipe } from '../../../shared/pipes/fecha-relativa.pipe';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';

const PESTANAS: { estado: EstadoSolicitud | undefined; label: string }[] = [
  { estado: 'pendiente', label: 'Pendientes' }, { estado: 'aprobada', label: 'Por entregar' }, { estado: 'entregada', label: 'Entregadas' },
  { estado: 'rechazada', label: 'Rechazadas' }, { estado: 'cancelada', label: 'Canceladas' }, { estado: undefined, label: 'Todas' },
];

@Component({
  selector: 'app-donaciones',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatIconModule, EmptyStateComponent, SkeletonLoaderComponent, EstadoBadgePipe, FechaRelativaPipe, CopCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './donaciones.component.html',
  styles: [`
    .sol.resaltada { outline: 2px solid var(--secondary); }
    .estrellas mat-icon { font-size: 16px; width: 16px; height: 16px; color: #d6ccc2; }
    .estrellas mat-icon.on { color: #F1C40F; }
  `],
})
export class DonacionesComponent implements OnInit {
  private readonly api = inject(MaterialApiService);
  private readonly tributario = inject(TributarioApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly pestanas = PESTANAS;
  protected readonly estado = signal<EstadoSolicitud | undefined>('pendiente');
  protected readonly items = signal<SolicitudMaterial[]>([]);
  protected readonly resumen = signal<ResumenSolicitudes | null>(null);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  protected readonly procesando = signal<string | null>(null);
  protected readonly resaltada = signal<string | null>(null);
  protected readonly materialId = signal<string | null>(null);
  private pagina = 1;

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.materialId.set(q.get('materialId'));
    const id = q.get('id');
    if (id) {
      this.resaltada.set(id);
      this.api.solicitud(id).subscribe({ next: (r) => { this.estado.set(r.data.estado); this.cargar(); }, error: () => this.cargar() });
    } else {
      if (this.materialId()) this.estado.set(undefined);
      this.cargar();
    }
  }

  cambiar(estado: EstadoSolicitud | undefined): void { this.estado.set(estado); this.cargar(); }

  quitarFiltroMaterial(): void {
    this.materialId.set(null);
    this.router.navigate([], { queryParams: {} });
    this.cargar();
  }

  conteo(estado: EstadoSolicitud | undefined): number | null {
    const r = this.resumen();
    if (!r) return null;
    return estado ? r[estado] : Object.values(r).reduce((a, b) => a + b, 0);
  }

  estrellas(n: number | null): boolean[] { return [1, 2, 3, 4, 5].map((i) => i <= (n ?? 0)); }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    this.api.solicitudesRecibidas({ estado: this.estado(), materialId: this.materialId() ?? undefined, page: this.pagina, limit: 15 }).subscribe({
      next: (r) => {
        this.items.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.resumen.set(r.data.resumen);
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
        const id = this.resaltada();
        if (id && !mas) setTimeout(() => this.host.nativeElement.querySelector(`#sol-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      },
      error: () => this.cargando.set(false),
    });
  }

  private aplicar(s: SolicitudMaterial, data: Parameters<MaterialApiService['cambiarEstadoSolicitud']>[1], exito: string): void {
    this.procesando.set(s.id);
    this.api.cambiarEstadoSolicitud(s.id, data).subscribe({
      next: () => { this.procesando.set(null); this.toast.exito(exito); this.cargar(); },
      error: (e) => { this.procesando.set(null); this.toast.error(mensajeError(e)); },
    });
  }

  aprobar(s: SolicitudMaterial): void {
    this.dialogo.pedirTexto({
      titulo: `Aprobar solicitud de ${s.beneficiario?.nombreCompleto}`,
      mensaje: `Se reservarán ${s.cantidadSolicitada} ${s.material?.unidadMedida} de "${s.material?.nombre}". Indica cómo y cuándo retirar el material.`,
      confirmar: 'Aprobar',
      campo: { etiqueta: 'Instrucciones de retiro', minimo: 10, valorInicial: s.material?.condicionesRetiro ?? '', placeholder: 'Dirección, horario, persona de contacto…' },
    }).subscribe((instruccionesRetiro) => this.aplicar(s, { estado: 'aprobada', instruccionesRetiro }, 'Solicitud aprobada. Avisamos al beneficiario.'));
  }

  rechazar(s: SolicitudMaterial): void {
    this.dialogo.pedirTexto({
      titulo: 'Rechazar solicitud', mensaje: 'El beneficiario verá el motivo.', confirmar: 'Rechazar', peligroso: true,
      campo: { etiqueta: 'Motivo', minimo: 5 },
    }).subscribe((motivo) => this.aplicar(s, { estado: 'rechazada', motivo }, 'Solicitud rechazada'));
  }

  entregar(s: SolicitudMaterial): void {
    this.dialogo.confirmar({
      titulo: 'Confirmar entrega',
      mensaje: `¿Entregaste ${s.cantidadSolicitada} ${s.material?.unidadMedida} a ${s.beneficiario?.nombreCompleto}? Se generará la constancia de donación.`,
      confirmar: 'Marcar como entregada',
    }).subscribe(() => this.aplicar(s, { estado: 'entregada' }, 'Entrega registrada. Constancia generada.'));
  }

  cancelar(s: SolicitudMaterial): void {
    this.dialogo.pedirTexto({
      titulo: 'Cancelar solicitud aprobada', mensaje: 'La cantidad reservada vuelve a estar disponible.', confirmar: 'Cancelar solicitud', peligroso: true,
      campo: { etiqueta: 'Motivo', minimo: 5 },
    }).subscribe((motivo) => this.aplicar(s, { estado: 'cancelada', motivo }, 'Solicitud cancelada'));
  }

  constancia(s: SolicitudMaterial): void {
    this.tributario.constanciaPdf(s.id).subscribe({
      next: (r) => descargarArchivo(r.body!, nombreArchivo(r.headers.get('Content-Disposition'), `constancia-${s.numeroConstancia}.pdf`)),
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }
}
