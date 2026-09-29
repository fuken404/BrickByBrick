import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../../core/auth/auth.store';
import { FiltrosFeed, SocialApiService } from '../../../../core/services/social-api.service';
import { Publicacion, TipoPublicacion } from '../../../../core/models';
import { ComposerComponent } from '../composer/composer.component';
import { PostCardComponent } from '../post-card/post-card.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ETIQUETAS_TIPO_PUBLICACION } from '../../../../shared/pipes/etiqueta.pipe';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [FormsModule, MatIconModule, ComposerComponent, PostCardComponent, SkeletonLoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page feed">
      <header class="page-header">
        <div>
          <h1 class="page-title">Comunidad</h1>
          <p class="page-subtitle">Proyectos, tutoriales y productos hechos con materiales reutilizados.</p>
        </div>
      </header>

      @if (!auth.isAdmin()) { <app-composer (creada)="agregar($event)" /> }

      <div class="toolbar">
        <div class="tabs" role="tablist" style="border:none">
          <button type="button" role="tab" class="tab" [class.active]="feed() === 'todos'" (click)="cambiarFeed('todos')">Todo</button>
          <button type="button" role="tab" class="tab" [class.active]="feed() === 'siguiendo'" (click)="cambiarFeed('siguiendo')">Siguiendo</button>
        </div>
        <form class="search" (ngSubmit)="buscar()">
          <mat-icon>search</mat-icon>
          <input class="form-input" name="q" [(ngModel)]="texto" placeholder="Buscar en la comunidad…" aria-label="Buscar publicaciones" />
        </form>
      </div>
      <div class="chips">
        <button type="button" class="chip" [class.active]="!tipo()" (click)="cambiarTipo(undefined)">Todas</button>
        @for (t of tipos; track t[0]) {
          <button type="button" class="chip" [class.active]="tipo() === t[0]" (click)="cambiarTipo(t[0])">{{ t[1] }}</button>
        }
      </div>

      @if (cargando()) {
        <app-skeleton-loader type="list" [count]="4" />
      } @else if (!publicaciones().length) {
        <div class="card">
          <app-empty-state icon="forum" [title]="feed() === 'siguiendo' ? 'Aún no sigues a nadie con publicaciones' : 'Sin publicaciones'"
                           [description]="feed() === 'siguiendo' ? 'Sigue a emprendimientos y constructoras desde su perfil para ver sus novedades aquí.' : 'Sé el primero en compartir un proyecto con la comunidad.'" />
        </div>
      } @else {
        <div class="stack">
          @for (p of publicaciones(); track p.id) {
            <app-post-card [publicacion]="p" (cambiada)="reemplazar($event)" (eliminada)="quitar($event)" (compartida)="agregar($event)" />
          }
        </div>
        @if (hayMas()) {
          <div class="load-more">
            <button type="button" class="btn btn-ghost" (click)="cargar(true)" [disabled]="cargandoMas()">{{ cargandoMas() ? 'Cargando…' : 'Cargar más' }}</button>
          </div>
        }
      }
    </div>
  `,
  styles: ['.feed { max-width: 760px; margin: 0 auto; }'],
})
export class FeedComponent implements OnInit {
  /** ?q= desde la búsqueda global */
  readonly q = input<string>();
  protected readonly auth = inject(AuthStore);
  private readonly api = inject(SocialApiService);

  protected readonly tipos = Object.entries(ETIQUETAS_TIPO_PUBLICACION) as [TipoPublicacion, string][];
  protected readonly publicaciones = signal<Publicacion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly cargandoMas = signal(false);
  protected readonly hayMas = signal(false);
  protected readonly feed = signal<'todos' | 'siguiendo'>('todos');
  protected readonly tipo = signal<TipoPublicacion | undefined>(undefined);
  protected texto = '';
  private pagina = 1;

  ngOnInit(): void {
    this.texto = this.q() ?? '';
    this.cargar();
  }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    (mas ? this.cargandoMas : this.cargando).set(true);
    const filtros: FiltrosFeed = { feed: this.feed(), tipo: this.tipo(), q: this.texto.trim() || undefined, page: this.pagina };
    this.api.feed(filtros).subscribe({
      next: (r) => {
        this.publicaciones.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
        this.cargandoMas.set(false);
      },
      error: () => { this.cargando.set(false); this.cargandoMas.set(false); },
    });
  }

  cambiarFeed(f: 'todos' | 'siguiendo'): void { this.feed.set(f); this.cargar(); }
  cambiarTipo(t: TipoPublicacion | undefined): void { this.tipo.set(t); this.cargar(); }
  buscar(): void { this.cargar(); }

  agregar(p: Publicacion): void { this.publicaciones.update((l) => [p, ...l]); }
  reemplazar(p: Publicacion): void {
    this.publicaciones.update((l) => l.map((x) => {
      if (x.id === p.id) return p;
      // Mantiene sincronizados el original y sus reposts visibles
      const original = p.repostDe ?? p;
      if (x.repostDe?.id === original.id) return { ...x, repostDe: original };
      if (x.id === original.id) return original;
      return x;
    }));
  }
  quitar(id: string): void { this.publicaciones.update((l) => l.filter((x) => x.id !== id && x.repostDe?.id !== id)); }
}
