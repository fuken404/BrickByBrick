import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SocialApiService } from '../../../../core/services/social-api.service';
import { Publicacion } from '../../../../core/models';
import { PostCardComponent } from '../post-card/post-card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-publicacion-detalle',
  standalone: true,
  imports: [MatIconModule, PostCardComponent, EmptyStateComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" style="max-width:760px;margin:0 auto">
      <button type="button" class="btn-link" (click)="location.back()"><mat-icon>arrow_back</mat-icon>Volver</button>
      @if (cargando()) {
        <app-skeleton-loader type="list" [count]="1" />
      } @else if (publicacion()) {
        <app-post-card [publicacion]="publicacion()!" [comentariosAbiertos]="true" (cambiada)="publicacion.set($event)" (eliminada)="location.back()" />
      } @else {
        <div class="card"><app-empty-state icon="search_off" title="Publicación no disponible" description="Pudo ser eliminada u ocultada por moderación." /></div>
      }
    </div>
  `,
})
export class PublicacionDetalleComponent {
  readonly id = input.required<string>();
  protected readonly location = inject(Location);
  private readonly api = inject(SocialApiService);
  protected readonly publicacion = signal<Publicacion | null>(null);
  protected readonly cargando = signal(true);

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.cargar(id));
    });
  }

  private cargar(id: string): void {
    this.cargando.set(true);
    this.api.publicacion(id).subscribe({
      next: (r) => { this.publicacion.set(r.data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }
}
