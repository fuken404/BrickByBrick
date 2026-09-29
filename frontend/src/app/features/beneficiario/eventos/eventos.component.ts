import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EventApiService } from '../../../core/services/event-api.service';
import { CatalogStore } from '../../../core/stores/catalog.store';
import { ToastService } from '../../../core/services/toast.service';
import { Evento, TipoEvento } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { EventCardComponent } from '../../../shared/components/event-card/event-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ETIQUETAS_TIPO_EVENTO } from '../../../shared/pipes/etiqueta.pipe';

type Vista = 'proximos' | 'inscritos' | 'pasados';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [FormsModule, MatIconModule, EventCardComponent, EmptyStateComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Eventos</h1>
          <p class="page-subtitle">Entregas masivas, talleres y ferias organizados por las constructoras.</p>
        </div>
      </header>

      <div class="toolbar">
        <div class="tabs" style="border:none">
          <button type="button" class="tab" [class.active]="vista() === 'proximos'" (click)="cambiarVista('proximos')">Próximos</button>
          <button type="button" class="tab" [class.active]="vista() === 'inscritos'" (click)="cambiarVista('inscritos')">Mis inscripciones</button>
          <button type="button" class="tab" [class.active]="vista() === 'pasados'" (click)="cambiarVista('pasados')">Pasados</button>
        </div>
        @if (vista() !== 'inscritos') {
          <div class="search"><mat-icon>search</mat-icon>
            <input class="form-input" [(ngModel)]="q" (keyup.enter)="cargar()" placeholder="Buscar eventos…" aria-label="Buscar eventos" /></div>
          <select class="form-select" [(ngModel)]="tipoEvento" (ngModelChange)="cargar()" aria-label="Tipo de evento">
            <option [ngValue]="undefined">Todos los tipos</option>
            @for (t of tipos; track t[0]) { <option [value]="t[0]">{{ t[1] }}</option> }
          </select>
          <select class="form-select" [(ngModel)]="localidadId" (ngModelChange)="cargar()" aria-label="Localidad">
            <option [ngValue]="undefined">Todas las localidades</option>
            @for (l of catalogo.localidades(); track l.id) { <option [ngValue]="l.id">{{ l.nombre }}</option> }
          </select>
        }
      </div>

      @if (cargando()) {
        <app-skeleton-loader type="card" [count]="6" />
      } @else if (!items().length) {
        <div class="card"><app-empty-state icon="event" [title]="vista() === 'inscritos' ? 'No tienes inscripciones activas' : 'No hay eventos para mostrar'"
          [description]="vista() === 'inscritos' ? 'Explora los próximos eventos e inscríbete.' : 'Vuelve pronto o cambia los filtros.'" /></div>
      } @else {
        <div class="grid-cards">
          @for (e of items(); track e.id) {
            <app-event-card [evento]="e" [procesando]="procesando() === e.id" (abrir)="abrir($event)" (inscribirse)="inscribirse($event)" />
          }
        </div>
        @if (hayMas()) { <div class="load-more"><button type="button" class="btn btn-ghost" (click)="cargar(true)">Cargar más</button></div> }
      }
    </div>
  `,
})
export class EventosComponent implements OnInit {
  private readonly api = inject(EventApiService);
  protected readonly catalogo = inject(CatalogStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly tipos = Object.entries(ETIQUETAS_TIPO_EVENTO);
  protected readonly vista = signal<Vista>('proximos');
  protected readonly items = signal<Evento[]>([]);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  protected readonly procesando = signal<string | null>(null);
  protected q = '';
  protected tipoEvento?: TipoEvento;
  protected localidadId?: number;
  private pagina = 1;

  ngOnInit(): void {
    this.catalogo.cargarLocalidades().subscribe({ error: () => undefined });
    this.cargar();
  }

  cambiarVista(v: Vista): void { this.vista.set(v); this.cargar(); }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    const fin = (items: Evento[], page: number, totalPages: number) => {
      this.items.update((l) => (mas ? [...l, ...items] : items));
      this.hayMas.set(page < totalPages);
      this.cargando.set(false);
    };
    if (this.vista() === 'inscritos') {
      this.api.misInscripciones({ alcance: 'todos', page: this.pagina, limit: 12 }).subscribe({
        next: (r) => fin(r.data.items.filter((i) => i.evento).map((i) => ({ ...i.evento!, miInscripcion: i.estado })), r.data.page, r.data.totalPages),
        error: () => this.cargando.set(false),
      });
      return;
    }
    this.api.publicos({
      alcance: this.vista() === 'pasados' ? 'pasados' : 'proximos', q: this.q.trim() || undefined,
      tipoEvento: this.tipoEvento, localidadId: this.localidadId, page: this.pagina, limit: 12,
    }).subscribe({
      next: (r) => fin(r.data.items, r.data.page, r.data.totalPages),
      error: () => this.cargando.set(false),
    });
  }

  abrir(e: Evento): void { this.router.navigate(['/beneficiario/eventos', e.id]); }

  inscribirse(e: Evento): void {
    this.procesando.set(e.id);
    this.api.inscribirse(e.id).subscribe({
      next: (r) => {
        this.procesando.set(null);
        this.items.update((l) => l.map((x) => (x.id === e.id ? {
          ...x, miInscripcion: r.data.estado, inscritos: x.inscritos + 1,
          cuposDisponibles: x.cuposDisponibles === null ? null : Math.max(0, x.cuposDisponibles - 1),
        } : x)));
        this.toast.exito('¡Inscripción confirmada!');
      },
      error: (err) => { this.procesando.set(null); this.toast.error(mensajeError(err)); },
    });
  }
}
