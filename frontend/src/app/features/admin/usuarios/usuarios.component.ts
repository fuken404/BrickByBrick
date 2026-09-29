import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { UserApiService } from '../../../core/services/user-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { EstadoUsuario, RolUsuario, UsuarioAdmin } from '../../../core/models';
import { descargarArchivo, mensajeError, nombreArchivo } from '../../../core/utils/http';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { FechaRelativaPipe } from '../../../shared/pipes/fecha-relativa.pipe';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, MatIconModule, EmptyStateComponent, SkeletonLoaderComponent, EstadoBadgePipe, EtiquetaPipe, FechaRelativaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div><h1 class="page-title">Usuarios</h1><p class="page-subtitle">{{ total() }} usuario(s) encontrados.</p></div>
        <div class="actions"><button type="button" class="btn btn-ghost" (click)="exportar()"><mat-icon>download</mat-icon>Exportar CSV</button></div>
      </header>

      <div class="toolbar">
        <form class="search grow" (ngSubmit)="cargar()">
          <mat-icon>search</mat-icon>
          <input class="form-input" name="q" [(ngModel)]="q" placeholder="Nombre, correo, cédula o NIT…" aria-label="Buscar usuarios" />
        </form>
        <select class="form-select" [(ngModel)]="rol" (ngModelChange)="cargar()" aria-label="Rol">
          <option [ngValue]="undefined">Todos los roles</option>
          <option value="BENEFICIARIO">Beneficiarios</option>
          <option value="CONSTRUCTORA">Constructoras</option>
          <option value="ADMINISTRADOR">Administradores</option>
        </select>
        <select class="form-select" [(ngModel)]="estado" (ngModelChange)="cargar()" aria-label="Estado">
          <option [ngValue]="undefined">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="suspendido">Suspendidos</option>
          <option value="inactivo">Eliminados</option>
        </select>
      </div>

      @if (cargando()) {
        <app-skeleton-loader type="list" [count]="8" />
      } @else if (!items().length) {
        <div class="card"><app-empty-state icon="person_search" title="Sin resultados" /></div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Documento</th><th>Localidad</th><th>Estado</th><th>Último ingreso</th><th><span class="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              @for (u of items(); track u.id) {
                <tr>
                  <td>
                    <div class="strong">{{ nombre(u) }}</div>
                    <div class="xsmall muted">{{ u.email }}{{ u.emailVerificado ? '' : ' · sin verificar' }}</div>
                  </td>
                  <td>
                    {{ u.rol | etiqueta:'rol' }}
                    @if (u.beneficiario?.esAlimentadorWeb) { <span class="badge badge-secundario">Creador destacado</span> }
                    @if (u.constructora) { @if (u.constructora.verificada) { <mat-icon style="color:var(--accent);font-size:16px;width:16px;height:16px" title="Verificada">verified</mat-icon> } }
                  </td>
                  <td class="small">{{ u.beneficiario ? 'C.C. ' + u.beneficiario.cedula : u.constructora ? 'NIT ' + u.constructora.nit : '—' }}</td>
                  <td class="small">{{ u.beneficiario?.localidad?.nombre ?? u.constructora?.localidad?.nombre ?? '—' }}</td>
                  <td>@let b = u.estado | estadoBadge:'usuario'; <span class="badge" [class]="b.cssClass">{{ b.label }}</span></td>
                  <td class="small" [title]="u.ultimoLogin ? (u.ultimoLogin | date:'medium') : ''">{{ u.ultimoLogin ? (u.ultimoLogin | fechaRelativa) : 'Nunca' }}</td>
                  <td>
                    <div class="row" style="justify-content:flex-end;flex-wrap:nowrap">
                      @if (u.rol !== 'ADMINISTRADOR') {
                        <a class="icon-btn" title="Perfil público" aria-label="Perfil público" [routerLink]="['/admin/usuarios', u.id]"><mat-icon>visibility</mat-icon></a>
                      }
                      @if (u.constructora) {
                        <a class="icon-btn" title="Verificación" aria-label="Verificación" routerLink="/admin/constructoras" [queryParams]="{ id: u.constructora.id }"><mat-icon>fact_check</mat-icon></a>
                      }
                      @if (u.beneficiario && u.estado === 'activo') {
                        <button type="button" class="icon-btn" [title]="u.beneficiario.esAlimentadorWeb ? 'Quitar distintivo de creador' : 'Marcar como creador destacado'" aria-label="Alternar creador destacado" (click)="alimentador(u)" [disabled]="procesando() === u.id"><mat-icon>{{ u.beneficiario.esAlimentadorWeb ? 'star' : 'star_border' }}</mat-icon></button>
                      }
                      @if (u.rol !== 'ADMINISTRADOR' && u.estado === 'activo') {
                        <button type="button" class="icon-btn danger" title="Suspender" aria-label="Suspender" (click)="suspender(u)" [disabled]="procesando() === u.id"><mat-icon>block</mat-icon></button>
                      }
                      @if (u.estado === 'suspendido') {
                        <button type="button" class="icon-btn" title="Reactivar" aria-label="Reactivar" (click)="reactivar(u)" [disabled]="procesando() === u.id"><mat-icon>lock_open</mat-icon></button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (hayMas()) { <div class="load-more"><button type="button" class="btn btn-ghost" (click)="cargar(true)">Cargar más</button></div> }
      }
    </div>
  `,
})
export class AdminUsuariosComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly users = inject(UserApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);
  private readonly route = inject(ActivatedRoute);

  protected readonly items = signal<UsuarioAdmin[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  protected readonly procesando = signal<string | null>(null);
  protected q = '';
  protected rol?: RolUsuario;
  protected estado?: EstadoUsuario;
  private pagina = 1;

  ngOnInit(): void {
    this.q = this.route.snapshot.queryParamMap.get('q') ?? '';
    this.cargar();
  }

  nombre(u: UsuarioAdmin): string {
    return u.beneficiario?.nombreCompleto ?? u.constructora?.razonSocial ?? (u.rol === 'ADMINISTRADOR' ? 'Administrador' : u.email);
  }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    this.api.usuarios({ q: this.q.trim() || undefined, rol: this.rol, estado: this.estado, page: this.pagina, limit: 25 }).subscribe({
      next: (r) => {
        this.items.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.total.set(r.data.total);
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  private actualizar(id: string, cambios: Partial<UsuarioAdmin>): void {
    this.items.update((l) => l.map((u) => (u.id === id ? { ...u, ...cambios } : u)));
  }

  suspender(u: UsuarioAdmin): void {
    this.dialogo.pedirTexto({
      titulo: `Suspender a ${this.nombre(u)}`, mensaje: 'Se cerrarán sus sesiones y no podrá ingresar. Sus solicitudes pendientes se cancelarán.',
      confirmar: 'Suspender', peligroso: true, campo: { etiqueta: 'Motivo (se envía al usuario)', minimo: 5 },
    }).subscribe((motivo) => {
      this.procesando.set(u.id);
      this.api.cambiarEstadoUsuario(u.id, 'suspendido', motivo).subscribe({
        next: (r) => { this.procesando.set(null); this.actualizar(u.id, { estado: r.data.estado }); this.toast.exito('Usuario suspendido'); },
        error: (e) => { this.procesando.set(null); this.toast.error(mensajeError(e)); },
      });
    });
  }

  reactivar(u: UsuarioAdmin): void {
    this.dialogo.confirmar({ titulo: 'Reactivar usuario', mensaje: `${this.nombre(u)} podrá volver a ingresar.`, confirmar: 'Reactivar' }).subscribe(() => {
      this.procesando.set(u.id);
      this.api.cambiarEstadoUsuario(u.id, 'activo').subscribe({
        next: (r) => { this.procesando.set(null); this.actualizar(u.id, { estado: r.data.estado }); this.toast.exito('Usuario reactivado'); },
        error: (e) => { this.procesando.set(null); this.toast.error(mensajeError(e)); },
      });
    });
  }

  alimentador(u: UsuarioAdmin): void {
    if (!u.beneficiario) return;
    this.procesando.set(u.id);
    this.users.toggleAlimentador(u.beneficiario.id).subscribe({
      next: (r) => {
        this.procesando.set(null);
        this.actualizar(u.id, { beneficiario: { ...u.beneficiario!, esAlimentadorWeb: r.data.esAlimentadorWeb } });
        this.toast.exito(r.data.esAlimentadorWeb ? 'Marcado como creador destacado' : 'Distintivo retirado');
      },
      error: (e) => { this.procesando.set(null); this.toast.error(mensajeError(e)); },
    });
  }

  exportar(): void {
    this.api.exportar('usuarios').subscribe({
      next: (r) => descargarArchivo(r.body!, nombreArchivo(r.headers.get('Content-Disposition'), 'usuarios.csv')),
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }
}
