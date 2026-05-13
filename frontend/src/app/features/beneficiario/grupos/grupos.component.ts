import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { PublicationApiService } from '../../../core/services/publication-api.service';
import { Grupo } from '../../../core/models';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, SkeletonLoaderComponent, EmptyStateComponent, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Grupos de comunidad</h1>
          <p class="page-subtitle">Únete a grupos de interés y comparte experiencias</p>
        </div>
        <button class="btn btn-primary" (click)="mostrarNuevoGrupo.set(true)">
          <mat-icon>group_add</mat-icon> Crear grupo
        </button>
      </div>

      @if (loading()) {
        <app-skeleton-loader type="card" [count]="6" />
      } @else if (grupos().length === 0) {
        <app-empty-state icon="group" title="Sin grupos" description="Crea el primer grupo de la comunidad." />
      } @else {
        <div class="grid">
          @for (g of grupos(); track g.id) {
            <div class="grupo-card card" (click)="abrirGrupo(g)">
              <div class="grupo-header">
                @if (g.imagenUrl) {
                  <img [src]="g.imagenUrl" [alt]="g.nombre" class="grupo-img" />
                } @else {
                  <div class="grupo-placeholder"><mat-icon>group</mat-icon></div>
                }
              </div>
              <div class="grupo-body">
                <h3 class="grupo-nombre">{{ g.nombre }}</h3>
                @if (g.descripcion) {
                  <p class="grupo-desc">{{ g.descripcion }}</p>
                }
                <div class="grupo-meta">
                  <span><mat-icon>people</mat-icon> {{ g._count.miembros }} miembros</span>
                  @if (g.temas?.length) {
                    <div class="temas">
                      @for (t of g.temas.slice(0,3); track t.tema) {
                        <span class="tema-tag">{{ t.tema }}</span>
                      }
                    </div>
                  }
                </div>
                <button class="btn btn-sm"
                        [class]="uniendoId() === g.id ? 'btn-ghost' : (unidoIds().has(g.id) ? 'btn-danger-outline' : 'btn-primary')"
                        (click)="$event.stopPropagation(); toggleUnirse(g)">
                  {{ uniendoId() === g.id ? 'Procesando...' : (unidoIds().has(g.id) ? 'Salir' : 'Unirse') }}
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal nuevo grupo -->
      @if (mostrarNuevoGrupo()) {
        <div class="modal-overlay" (click)="mostrarNuevoGrupo.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Crear grupo</h3>
              <button class="icon-btn" (click)="mostrarNuevoGrupo.set(false)"><mat-icon>close</mat-icon></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre del grupo *</label>
                <input type="text" class="form-control" [(ngModel)]="nuevoNombre" placeholder="Ej: Recicladores Usaquén" />
              </div>
              <div class="form-group">
                <label class="form-label">Descripción</label>
                <textarea class="form-control" [(ngModel)]="nuevoDesc" rows="3" placeholder="¿De qué trata el grupo?"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Temas (separados por coma)</label>
                <input type="text" class="form-control" [(ngModel)]="nuevoTemas" placeholder="construcción, ladrillo, reutilización" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" (click)="mostrarNuevoGrupo.set(false)">Cancelar</button>
              <button class="btn btn-primary" (click)="crearGrupo()" [disabled]="creando()">
                {{ creando() ? 'Creando...' : 'Crear grupo' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './grupos.component.scss',
})
export class GruposComponent implements OnInit {
  private readonly pubSvc = inject(PublicationApiService);

  readonly grupos          = signal<Grupo[]>([]);
  readonly loading         = signal(true);
  readonly unidoIds        = signal<Set<string>>(new Set());
  readonly uniendoId       = signal<string | null>(null);
  readonly mostrarNuevoGrupo = signal(false);
  readonly creando         = signal(false);

  nuevoNombre = '';
  nuevoDesc   = '';
  nuevoTemas  = '';

  ngOnInit() {
    this.pubSvc.getGrupos({ limit: 20 }).subscribe({
      next: r => { this.grupos.set(r.data.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  abrirGrupo(_g: Grupo) {
    // En una versión futura: navegar a detalle del grupo con chat
  }

  toggleUnirse(g: Grupo) {
    this.uniendoId.set(g.id);
    const isUnido = this.unidoIds().has(g.id);
    const obs = isUnido ? this.pubSvc.salirGrupo(g.id) : this.pubSvc.unirseGrupo(g.id);

    obs.subscribe({
      next: () => {
        this.unidoIds.update(s => {
          const next = new Set(s);
          if (isUnido) { next.delete(g.id); } else { next.add(g.id); }
          return next;
        });
        this.grupos.update(list =>
          list.map(x => x.id === g.id
            ? { ...x, _count: { miembros: x._count.miembros + (isUnido ? -1 : 1) } }
            : x)
        );
        this.uniendoId.set(null);
      },
      error: () => this.uniendoId.set(null),
    });
  }

  crearGrupo() {
    if (!this.nuevoNombre.trim()) return;
    this.creando.set(true);

    const temas = this.nuevoTemas
      ? this.nuevoTemas.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    this.pubSvc.crearGrupo({ nombre: this.nuevoNombre, descripcion: this.nuevoDesc || undefined, temas }).subscribe({
      next: r => {
        this.grupos.update(list => [r.data, ...list]);
        this.mostrarNuevoGrupo.set(false);
        this.nuevoNombre = '';
        this.nuevoDesc = '';
        this.nuevoTemas = '';
        this.creando.set(false);
      },
      error: () => this.creando.set(false),
    });
  }
}
