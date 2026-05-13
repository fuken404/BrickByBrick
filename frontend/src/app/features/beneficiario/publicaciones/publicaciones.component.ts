import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { PublicationApiService } from '../../../core/services/publication-api.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { Publicacion, TipoPublicacion, Comentario } from '../../../core/models';
import { PostCardComponent } from '../../../shared/components/post-card/post-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, PostCardComponent, SkeletonLoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Comunidad</h1>
        <p class="page-subtitle">Comparte tus proyectos con materiales donados</p>
      </div>

      <!-- Nueva publicación -->
      @if (esAlimentador()) {
        <div class="new-post card">
          <div class="new-post-trigger" (click)="mostrarForm.update(v => !v)">
            <mat-icon>edit_note</mat-icon>
            <span>{{ mostrarForm() ? 'Cancelar' : '¿Qué quieres compartir hoy?' }}</span>
            <mat-icon class="toggle-icon">{{ mostrarForm() ? 'expand_less' : 'expand_more' }}</mat-icon>
          </div>

          @if (mostrarForm()) {
            <div class="new-post-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Título</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoTitulo" placeholder="Título de tu publicación" />
                </div>
                <div class="form-group">
                  <label class="form-label">Tipo</label>
                  <select class="form-control" [(ngModel)]="nuevoTipo">
                    <option value="reutilizacion">Reutilización</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="proyecto">Proyecto</option>
                    <option value="noticia">Noticia</option>
                    <option value="recurso">Recurso</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Contenido</label>
                <textarea class="form-control" [(ngModel)]="nuevoContenido" rows="4"
                          placeholder="Comparte tu experiencia, consejo o proyecto..."></textarea>
              </div>
              <div class="form-actions">
                <button class="btn btn-primary" (click)="publicar()" [disabled]="publicando()">
                  {{ publicando() ? 'Publicando...' : 'Publicar' }}
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Filtros tipo -->
      <div class="filter-chips">
        <button class="chip" [class.active]="!tipoFiltro" (click)="setTipo(undefined)">Todo</button>
        @for (t of tipos; track t.value) {
          <button class="chip" [class.active]="tipoFiltro === t.value" (click)="setTipo(t.value)">{{ t.label }}</button>
        }
      </div>

      @if (loading()) {
        <app-skeleton-loader type="card" [count]="4" />
      } @else if (publicaciones().length === 0) {
        <app-empty-state
          icon="feed"
          title="Sin publicaciones"
          description="Sé el primero en compartir algo con la comunidad."
        />
      } @else {
        <div class="posts-list">
          @for (p of publicaciones(); track p.id) {
            <app-post-card
              [publicacion]="p"
              [autorName]="p.autor.email"
              [currentUserName]="auth.userEmail()"
              [liked]="likedIds().has(p.id)"
              [comentariosAbiertos]="openCommentIds().has(p.id)"
              [comentarios]="comentariosPorPost().get(p.id) ?? []"
              [loadingComentarios]="loadingCommentIds().has(p.id)"
              (like)="toggleLike($event)"
              (comment)="toggleComentarios($event)"
              (addComment)="enviarComentario($event.pubId, $event.texto)"
            />
          }
        </div>

        @if (hasMore()) {
          <div class="load-more">
            <button class="btn btn-ghost" (click)="loadMore()" [disabled]="loadingMore()">
              {{ loadingMore() ? 'Cargando...' : 'Cargar más' }}
            </button>
          </div>
        }
      }
    </div>
  `,
  styleUrl: './publicaciones.component.scss',
})
export class PublicacionesComponent implements OnInit {
  private readonly pubSvc = inject(PublicationApiService);
  protected readonly auth = inject(AuthStore);

  readonly publicaciones    = signal<Publicacion[]>([]);
  readonly loading          = signal(true);
  readonly loadingMore      = signal(false);
  readonly total            = signal(0);
  readonly likedIds         = signal<Set<string>>(new Set());
  readonly mostrarForm      = signal(false);
  readonly publicando       = signal(false);
  readonly openCommentIds   = signal<Set<string>>(new Set());
  readonly loadingCommentIds= signal<Set<string>>(new Set());
  readonly comentariosPorPost = signal<Map<string, Comentario[]>>(new Map());

  nuevoTitulo    = '';
  nuevoContenido = '';
  nuevoTipo: TipoPublicacion = 'reutilizacion';
  tipoFiltro: TipoPublicacion | undefined;
  private page = 1;

  esAlimentador() { return !!this.auth.user(); }

  readonly tipos = [
    { value: 'reutilizacion' as TipoPublicacion, label: 'Reutilización' },
    { value: 'tutorial'      as TipoPublicacion, label: 'Tutorial' },
    { value: 'proyecto'      as TipoPublicacion, label: 'Proyecto' },
    { value: 'noticia'       as TipoPublicacion, label: 'Noticia' },
    { value: 'recurso'       as TipoPublicacion, label: 'Recurso' },
  ];

  hasMore() { return this.publicaciones().length < this.total(); }

  ngOnInit() { this.load(); }

  private load(append = false) {
    if (append) this.loadingMore.set(true);
    else        this.loading.set(true);

    this.pubSvc.getPublicaciones({ tipo: this.tipoFiltro, page: this.page, limit: 10 }).subscribe({
      next: r => {
        this.publicaciones.update(prev => append ? [...prev, ...r.data.items] : r.data.items);
        this.total.set(r.data.total);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); },
    });
  }

  setTipo(t: TipoPublicacion | undefined) {
    this.tipoFiltro = t;
    this.page = 1;
    this.load();
  }

  loadMore() {
    this.page++;
    this.load(true);
  }

  toggleLike(id: string) {
    const liked = this.likedIds().has(id);
    const obs = liked ? this.pubSvc.removeLike(id) : this.pubSvc.addLike(id);
    obs.subscribe({
      next: () => {
        this.likedIds.update(s => {
          const next = new Set(s);
          if (liked) next.delete(id); else next.add(id);
          return next;
        });
        this.publicaciones.update(list =>
          list.map(p => p.id === id
            ? { ...p, _count: { ...p._count, likes: p._count.likes + (liked ? -1 : 1) } }
            : p)
        );
      },
    });
  }

  toggleComentarios(id: string) {
    const isOpen = this.openCommentIds().has(id);

    this.openCommentIds.update(s => {
      const next = new Set(s);
      if (isOpen) next.delete(id); else next.add(id);
      return next;
    });

    // Load comments the first time they're opened
    if (!isOpen && !this.comentariosPorPost().has(id)) {
      this.loadingCommentIds.update(s => { const n = new Set(s); n.add(id); return n; });

      this.pubSvc.getPublicacion(id).subscribe({
        next: r => {
          this.comentariosPorPost.update(m => {
            const next = new Map(m);
            next.set(id, r.data.comentarios ?? []);
            return next;
          });
          this.loadingCommentIds.update(s => { const n = new Set(s); n.delete(id); return n; });
        },
        error: () => {
          this.loadingCommentIds.update(s => { const n = new Set(s); n.delete(id); return n; });
        },
      });
    }
  }

  enviarComentario(pubId: string, texto: string) {
    this.pubSvc.addComentario(pubId, texto).subscribe({
      next: r => {
        this.comentariosPorPost.update(m => {
          const next = new Map(m);
          next.set(pubId, [...(next.get(pubId) ?? []), r.data]);
          return next;
        });
        this.publicaciones.update(list =>
          list.map(p => p.id === pubId
            ? { ...p, _count: { ...p._count, comentarios: p._count.comentarios + 1 } }
            : p)
        );
      },
    });
  }

  publicar() {
    if (!this.nuevoTitulo.trim() || !this.nuevoContenido.trim()) return;
    this.publicando.set(true);

    this.pubSvc.createPublicacion({
      titulo: this.nuevoTitulo,
      contenido: this.nuevoContenido,
      tipo: this.nuevoTipo,
      visibilidad: 'publica',
    }).subscribe({
      next: r => {
        this.publicaciones.update(list => [r.data, ...list]);
        this.nuevoTitulo = '';
        this.nuevoContenido = '';
        this.mostrarForm.set(false);
        this.publicando.set(false);
      },
      error: () => this.publicando.set(false),
    });
  }
}
