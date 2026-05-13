import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { PublicationApiService } from '../../../core/services/publication-api.service';
import { Publicacion } from '../../../core/models';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-publicaciones',
  standalone: true,
  imports: [CommonModule, MatIconModule, SkeletonLoaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1 class="page-title">Publicaciones</h1>
      <p class="page-subtitle">{{ total() }} publicaciones en la plataforma</p>

      @if (loading()) {
        <app-skeleton-loader type="list" [count]="6" />
      } @else if (pubs().length === 0) {
        <app-empty-state icon="feed" title="Sin publicaciones" description="No hay publicaciones que moderar." />
      } @else {
        <div class="table-card card">
          <table>
            <thead>
              <tr>
                <th>Publicación</th>
                <th>Autor</th>
                <th>Tipo</th>
                <th>Likes</th>
                <th>Comentarios</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (p of pubs(); track p.id) {
                <tr>
                  <td><div class="pub-titulo">{{ p.titulo }}</div></td>
                  <td>{{ p.autor?.email }}</td>
                  <td><span class="tipo-pill">{{ p.tipo }}</span></td>
                  <td>{{ p._count.likes }}</td>
                  <td>{{ p._count.comentarios }}</td>
                  <td><span class="estado-pill estado-{{ p.estado }}">{{ p.estado }}</span></td>
                  <td>{{ p.createdAt | date:'dd/MM/yy' }}</td>
                  <td>
                    @if (p.estado === 'publicada') {
                      <button class="action-btn warning" (click)="suspender(p)" title="Suspender">
                        <mat-icon>block</mat-icon>
                      </button>
                    } @else if (p.estado === 'suspendida') {
                      <button class="action-btn success" (click)="restaurar(p)" title="Restaurar">
                        <mat-icon>restore</mat-icon>
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styleUrl: './publicaciones.component.scss',
})
export class AdminPublicacionesComponent implements OnInit {
  private readonly pubSvc = inject(PublicationApiService);

  readonly pubs    = signal<Publicacion[]>([]);
  readonly loading = signal(true);
  readonly total   = signal(0);

  ngOnInit() {
    this.pubSvc.getPublicaciones({ limit: 50 }).subscribe({
      next: r => { this.pubs.set(r.data.items); this.total.set(r.data.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  suspender(p: Publicacion) {
    this.pubSvc.updatePublicacion(p.id, { estado: 'suspendida' }).subscribe({
      next: () => this.pubs.update(list => list.map(x => x.id === p.id ? { ...x, estado: 'suspendida' } : x)),
    });
  }

  restaurar(p: Publicacion) {
    this.pubSvc.updatePublicacion(p.id, { estado: 'publicada' }).subscribe({
      next: () => this.pubs.update(list => list.map(x => x.id === p.id ? { ...x, estado: 'publicada' } : x)),
    });
  }
}
