import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { EventApiService } from '../../../core/services/event-api.service';
import { Evento, Material, ResumenSolicitudes, SolicitudMaterial } from '../../../core/models';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { MaterialCardComponent } from '../../../shared/components/material-card/material-card.component';
import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { FechaRelativaPipe } from '../../../shared/pipes/fecha-relativa.pipe';

@Component({
  selector: 'app-beneficiario-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, MatIconModule, KpiCardComponent, MaterialCardComponent, EventCardComponent, EmptyStateComponent, SkeletonLoaderComponent, EstadoBadgePipe, FechaRelativaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
})
export class BeneficiarioDashboardComponent implements OnInit {
  protected readonly auth = inject(AuthStore);
  private readonly materiales = inject(MaterialApiService);
  private readonly eventos = inject(EventApiService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(true);
  protected readonly resumen = signal<ResumenSolicitudes | null>(null);
  protected readonly solicitudes = signal<SolicitudMaterial[]>([]);
  protected readonly recientes = signal<Material[]>([]);
  protected readonly disponibles = signal(0);
  protected readonly misEventos = signal<Evento[]>([]);
  protected readonly proximos = signal<Evento[]>([]);

  protected readonly activas = computed(() => {
    const r = this.resumen();
    return r ? r.pendiente + r.aprobada : 0;
  });
  protected readonly porConfirmar = computed(() => this.solicitudes().filter((s) => s.estado === 'entregada' && !s.fechaConfirmacion).length);
  protected readonly saludo = computed(() => {
    const h = new Date().getHours();
    const primer = this.auth.nombre().split(' ')[0];
    return `${h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'}, ${primer}`;
  });

  ngOnInit(): void {
    const localidadId = this.auth.user()?.perfil?.localidadId ?? undefined;
    forkJoin({
      solicitudes: this.materiales.misSolicitudes({ limit: 5 }).pipe(catchError(() => of(null))),
      catalogo: this.materiales.catalogo({ limit: 4 }).pipe(catchError(() => of(null))),
      inscripciones: this.eventos.misInscripciones({ alcance: 'proximos', limit: 3 }).pipe(catchError(() => of(null))),
      eventos: this.eventos.publicos({ alcance: 'proximos', limit: 3, localidadId }).pipe(catchError(() => of(null))),
    }).subscribe(({ solicitudes, catalogo, inscripciones, eventos }) => {
      if (solicitudes) { this.resumen.set(solicitudes.data.resumen); this.solicitudes.set(solicitudes.data.items); }
      if (catalogo) { this.recientes.set(catalogo.data.items); this.disponibles.set(catalogo.data.total); }
      if (inscripciones) {
        this.misEventos.set(inscripciones.data.items.filter((i) => i.evento).map((i) => ({ ...i.evento!, miInscripcion: i.estado })));
      }
      if (eventos) this.proximos.set(eventos.data.items.filter((e) => !e.miInscripcion || e.miInscripcion === 'cancelada'));
      this.cargando.set(false);
    });
  }

  abrirMaterial(m: Material): void { this.router.navigate(['/beneficiario/materiales', m.id]); }
  abrirEvento(e: Evento): void { this.router.navigate(['/beneficiario/eventos', e.id]); }
}
