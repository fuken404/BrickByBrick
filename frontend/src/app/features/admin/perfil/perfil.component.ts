import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UserApiService } from '../../../core/services/user-api.service';
import { Me } from '../../../core/models';
import { SeguridadCuentaComponent } from '../../comun/cuenta/seguridad-cuenta.component';

@Component({
  selector: 'app-admin-perfil',
  standalone: true,
  imports: [MatIconModule, SeguridadCuentaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" style="max-width:820px">
      <header class="page-header">
        <div><h1 class="page-title">Mi cuenta</h1><p class="page-subtitle">Cuenta de administración de BrickByBrick.</p></div>
      </header>
      @if (me(); as m) {
        <div class="stack"><app-seguridad-cuenta [me]="m" (cambiado)="me.set($event)" /></div>
      } @else {
        <div class="card card-pad-lg center muted"><mat-icon class="spin">sync</mat-icon></div>
      }
    </div>
  `,
})
export class AdminPerfilComponent implements OnInit {
  private readonly users = inject(UserApiService);
  protected readonly me = signal<Me | null>(null);

  ngOnInit(): void {
    this.users.me().subscribe({ next: (r) => this.me.set(r.data) });
  }
}
