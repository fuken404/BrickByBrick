import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EventApiService } from '../../../core/services/event-api.service';
import { Evento, FiltrosEvento } from '../../../core/models';
import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

type Alcance = NonNullable<FiltrosEvento['alcance']>;

@Component({
  selector: 'app-empresa-eventos',
  standalone: true,
  imports: [RouterLink, MatIconModule, EventCardComponent, EmptyStateComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div><h1 class="page-title">Mis eventos</h1><p class="page-subtitle">Organiza entregas masivas, talleres y ferias para la comunidad.</p></div>
        <div class="actions"><a class="btn btn-primary" routerLink="/empresa/eventos/nuevo"><mat-icon>add</mat-icon>Crear evento</a></div>
      </header>
      <div class="tabs">
        <button type="button" class="tab" [class.active]="alcance() === 'proximos'" (click)="cambiar('proximos')">Próximos</button>
        <button type="button" class="tab" [class.active]="alcance() === 'pasados'" (click)="cambiar('pasados')">Pasados</button>
        <button type="button" class="tab" [class.active]="alcance() === 'todos'" (click)="cambiar('todos')">Todos</button>
      </div>
      @if (cargando()) {
        <app-skeleton-loader type="card" [count]="6" />
      } @else if (!items().length) {
        <div class="card"><app-empty-state icon="event" title="No hay eventos aquí" description="Crea un evento para entregar materiales a varios beneficiarios a la vez."
          actionLabel="Crear evento" (accion)="router.navigate(['/empresa/eventos/nuevo'])" /></div>
      } @else {
        <div class="grid-cards">
          @for (e of items(); track e.id) { <app-event-card [evento]="e" [mostrarEstado]="true" (abrir)="router.navigate(['/empresa/eventos', $event.id])" /> }
        </div>
        @if (hayMas()) { <div class="load-more"><button type="button" class="btn btn-ghost" (click)="cargar(true)">Cargar más</button></div> }
      }
    </div>
  `,
})
export class EmpresaEventosComponent implements OnInit {
  private readonly api = inject(EventApiService);
  protected readonly router = inject(Router);
  protected readonly alcance = signal<Alcance>('proximos');
  protected readonly items = signal<Evento[]>([]);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  private pagina = 1;

  ngOnInit(): void { this.cargar(); }

  cambiar(a: Alcance): void { this.alcance.set(a); this.cargar(); }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    this.api.misEventos({ alcance: this.alcance(), page: this.pagina, limit: 12 }).subscribe({
      next: (r) => {
        this.items.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
