import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { EventApiService } from '../../../core/services/event-api.service';
import { TributarioApiService } from '../../../core/services/tributario-api.service';
import { Evento, ResumenSolicitudes, ResumenTributario, SolicitudMaterial } from '../../../core/models';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { FechaRelativaPipe } from '../../../shared/pipes/fecha-relativa.pipe';

@Component({
  selector: 'app-empresa-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, MatIconModule, KpiCardComponent, EventCardComponent, EmptyStateComponent, SkeletonLoaderComponent, FechaRelativaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ auth.nombre() }}</h1>
          <p class="page-subtitle">Resumen de tus donaciones y su impacto.</p>
        </div>
        <div class="actions">
          <a class="btn btn-secondary" routerLink="/empresa/eventos/nuevo"><mat-icon>event</mat-icon>Crear evento</a>
          <a class="btn btn-primary" routerLink="/empresa/materiales/nuevo"><mat-icon>add</mat-icon>Publicar material</a>
        </div>
      </header>

      @if (!auth.user()?.perfil?.verificada) {
        <div class="alert warning"><mat-icon>pending</mat-icon>
          <div><div class="alert-title">Tu empresa está en proceso de verificación</div>
            <span class="small">Puedes preparar materiales y eventos como borrador; podrás publicarlos cuando el equipo apruebe tu RUT y Cámara de Comercio.
              <a class="btn-link" routerLink="/empresa/perfil">Revisar documentos</a></span></div>
        </div>
      }

      @if (cargando()) {
        <app-skeleton-loader type="kpi" [count]="4" />
      } @else {
        <div class="grid-kpi">
          <app-kpi-card label="Materiales publicados" [value]="activos()" icon="inventory_2" color="#AD5138" sub="Disponibles en el catálogo" />
          <app-kpi-card label="Solicitudes por responder" [value]="resumen()?.pendiente ?? 0" icon="pending_actions" color="#996923" [sub]="(resumen()?.aprobada ?? 0) + ' aprobadas por entregar'" />
          <app-kpi-card label="Entregas realizadas" [value]="resumen()?.entregada ?? 0" icon="local_shipping" color="#38745B" />
          <app-kpi-card [label]="'Valor donado ' + anio" [value]="tributario()?.valorDonadoCop ?? 0" formato="cop" icon="savings" color="#48635A"
            [sub]="'Descuento estimado: ' + ((tributario()?.descuentoEstimadoCop ?? 0) | number:'1.0-0') + ' COP'" />
        </div>

        <div class="split">
          <section class="section">
            <div class="section-head">
              <h2 class="section-title">Solicitudes pendientes</h2>
              <a class="btn-link" routerLink="/empresa/donaciones">Ver todas</a>
            </div>
            @if (!pendientes().length) {
              <div class="card"><app-empty-state icon="inbox" title="Sin solicitudes pendientes" description="Cuando un beneficiario solicite tus materiales aparecerá aquí." [compacto]="true" /></div>
            } @else {
              <ul class="list-card">
                @for (s of pendientes(); track s.id) {
                  <li class="list-item clickable" tabindex="0" [routerLink]="['/empresa/donaciones']" [queryParams]="{ id: s.id }">
                    <mat-icon [style.color]="s.material?.categoria?.colorHex">{{ s.material?.categoria?.icono ?? 'inventory_2' }}</mat-icon>
                    <div class="grow">
                      <div class="strong truncate">{{ s.beneficiario?.nombreCompleto }}</div>
                      <div class="xsmall muted">{{ s.cantidadSolicitada | number:'1.0-2' }} {{ s.material?.unidadMedida }} de {{ s.material?.nombre }} · {{ s.fechaSolicitud | fechaRelativa }}</div>
                    </div>
                    <mat-icon class="muted">chevron_right</mat-icon>
                  </li>
                }
              </ul>
            }
          </section>
          <aside class="section">
            <div class="section-head">
              <h2 class="section-title">Próximos eventos</h2>
              <a class="btn-link" routerLink="/empresa/eventos">Gestionar</a>
            </div>
            @for (e of eventos(); track e.id) {
              <app-event-card [evento]="e" [mostrarEstado]="true" (abrir)="router.navigate(['/empresa/eventos', $event.id])" />
            } @empty {
              <div class="card"><app-empty-state icon="event" title="Sin eventos próximos" [compacto]="true" actionLabel="Crear evento" (accion)="router.navigate(['/empresa/eventos/nuevo'])" /></div>
            }
          </aside>
        </div>
      }
    </div>
  `,
})
export class EmpresaDashboardComponent implements OnInit {
  protected readonly auth = inject(AuthStore);
  protected readonly router = inject(Router);
  private readonly materiales = inject(MaterialApiService);
  private readonly eventosApi = inject(EventApiService);
  private readonly tributarioApi = inject(TributarioApiService);

  protected readonly anio = new Date().getFullYear();
  protected readonly cargando = signal(true);
  protected readonly activos = signal(0);
  protected readonly resumen = signal<ResumenSolicitudes | null>(null);
  protected readonly pendientes = signal<SolicitudMaterial[]>([]);
  protected readonly eventos = signal<Evento[]>([]);
  protected readonly tributario = signal<ResumenTributario | null>(null);

  ngOnInit(): void {
    forkJoin({
      materiales: this.materiales.misMateriales({ estadoPublicacion: 'activo', limit: 1 }).pipe(catchError(() => of(null))),
      solicitudes: this.materiales.solicitudesRecibidas({ estado: 'pendiente', limit: 6 }).pipe(catchError(() => of(null))),
      eventos: this.eventosApi.misEventos({ alcance: 'proximos', limit: 3 }).pipe(catchError(() => of(null))),
      tributario: this.tributarioApi.resumen(this.anio).pipe(catchError(() => of(null))),
    }).subscribe(({ materiales, solicitudes, eventos, tributario }) => {
      this.activos.set(materiales?.data.total ?? 0);
      if (solicitudes) { this.resumen.set(solicitudes.data.resumen); this.pendientes.set(solicitudes.data.items); }
      this.eventos.set(eventos?.data.items ?? []);
      this.tributario.set(tributario?.data ?? null);
      this.cargando.set(false);
    });
  }
}
