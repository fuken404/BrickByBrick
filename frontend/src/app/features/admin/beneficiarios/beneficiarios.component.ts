import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { UserApiService } from '../../../core/services/user-api.service';
import { Beneficiario } from '../../../core/models';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-admin-beneficiarios',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, SkeletonLoaderComponent, EmptyStateComponent, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Beneficiarios</h1>
          <p class="page-subtitle">{{ total() }} registrados en total</p>
        </div>
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input type="text" class="search-input" placeholder="Buscar por nombre o cédula..."
                 [(ngModel)]="query" (input)="onSearch()" />
        </div>
      </div>

      @if (loading()) {
        <app-skeleton-loader type="list" [count]="8" />
      } @else if (beneficiarios().length === 0) {
        <app-empty-state icon="people" title="Sin resultados" description="No se encontraron beneficiarios." />
      } @else {
        <div class="table-card card">
          <table>
            <thead>
              <tr>
                <th>Beneficiario</th>
                <th>Cédula</th>
                <th>Localidad</th>
                <th>Estrato</th>
                <th>Alimentador</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (b of beneficiarios(); track b.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <app-avatar [name]="b.nombreCompleto" [size]="36" />
                      <div>
                        <div class="user-name">{{ b.nombreCompleto }}</div>
                        <div class="user-email">{{ b.usuario?.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ b.cedula }}</td>
                  <td>{{ b.localidad?.nombre ?? '—' }}</td>
                  <td>{{ b.estrato ?? '—' }}</td>
                  <td>
                    <span class="pill" [class.on]="b.esAlimentadorWeb">
                      {{ b.esAlimentadorWeb ? 'Sí' : 'No' }}
                    </span>
                  </td>
                  <td>
                    <span class="estado-pill" [class.activo]="b.usuario?.estado === 'activo'">
                      {{ b.usuario?.estado }}
                    </span>
                  </td>
                  <td>
                    <div class="acciones">
                      <button class="action-btn" (click)="toggleAlimentador(b)" title="Toggle alimentador">
                        <mat-icon>{{ b.esAlimentadorWeb ? 'remove_moderator' : 'add_moderator' }}</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (hasMore()) {
          <div class="load-more">
            <button class="btn btn-ghost" (click)="loadMore()">Cargar más</button>
          </div>
        }
      }
    </div>
  `,
  styleUrl: './beneficiarios.component.scss',
})
export class AdminBeneficiariosComponent implements OnInit {
  private readonly userSvc = inject(UserApiService);

  readonly beneficiarios = signal<Beneficiario[]>([]);
  readonly loading       = signal(true);
  readonly total         = signal(0);

  query = '';
  private page = 1;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  hasMore() { return this.beneficiarios().length < this.total(); }

  ngOnInit() { this.load(); }

  private load(append = false) {
    if (!append) this.loading.set(true);
    const params: Record<string, string> = { page: String(this.page), limit: '20' };
    if (this.query) params['q'] = this.query;

    this.userSvc.getBeneficiarios(params).subscribe({
      next: r => {
        this.beneficiarios.update(prev => append ? [...prev, ...r.data.items] : r.data.items);
        this.total.set(r.data.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page = 1; this.load(); }, 400);
  }

  loadMore() { this.page++; this.load(true); }

  toggleAlimentador(b: Beneficiario) {
    this.userSvc.toggleAlimentador(b.id).subscribe({
      next: () => {
        this.beneficiarios.update(list =>
          list.map(x => x.id === b.id ? { ...x, esAlimentadorWeb: !x.esAlimentadorWeb } : x)
        );
      },
    });
  }
}
