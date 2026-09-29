import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SocialApiService } from '../../../core/services/social-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { EstadoReporte, Publicacion, Reporte } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { FechaRelativaPipe } from '../../../shared/pipes/fecha-relativa.pipe';

type Vista = EstadoReporte | 'ocultas';

@Component({
  selector: 'app-admin-moderacion',
  standalone: true,
  imports: [RouterLink, MatIconModule, EmptyStateComponent, SkeletonLoaderComponent, AvatarComponent, EstadoBadgePipe, EtiquetaPipe, FechaRelativaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" style="max-width:1000px">
      <header class="page-header">
        <div><h1 class="page-title">Moderación</h1><p class="page-subtitle">Reportes de la comunidad y contenido oculto.</p></div>
        <div class="actions"><a class="btn btn-ghost" routerLink="/admin/comunidad"><mat-icon>forum</mat-icon>Ir a la comunidad</a></div>
      </header>
      <div class="tabs">
        <button type="button" class="tab" [class.active]="vista() === 'pendiente'" (click)="cambiar('pendiente')">Pendientes</button>
        <button type="button" class="tab" [class.active]="vista() === 'resuelto'" (click)="cambiar('resuelto')">Contenido retirado</button>
        <button type="button" class="tab" [class.active]="vista() === 'ignorado'" (click)="cambiar('ignorado')">Descartados</button>
        <button type="button" class="tab" [class.active]="vista() === 'ocultas'" (click)="cambiar('ocultas')">Publicaciones ocultas</button>
      </div>

      @if (cargando()) {
        <app-skeleton-loader type="list" [count]="5" />
      } @else if (vista() === 'ocultas') {
        @if (!ocultas().length) {
          <div class="card"><app-empty-state icon="visibility" title="No hay publicaciones ocultas" /></div>
        } @else {
          <ul class="list-card">
            @for (p of ocultas(); track p.id) {
              <li class="list-item">
                <app-avatar [name]="p.autor.nombre" [src]="p.autor.avatarUrl" [size]="36" />
                <div class="grow">
                  <div class="strong">{{ p.titulo ?? (p.tipo | etiqueta:'tipoPublicacion') }}</div>
                  <div class="small muted clamp-2">{{ p.contenido }}</div>
                  <div class="xsmall muted">{{ p.autor.nombre }} · {{ p.createdAt | fechaRelativa }}</div>
                </div>
                <a class="btn btn-sm btn-ghost" [routerLink]="['/admin/comunidad', p.id]">Ver</a>
                <button type="button" class="btn btn-sm btn-accent" (click)="restaurar(p)">Restaurar</button>
              </li>
            }
          </ul>
        }
      } @else if (!reportes().length) {
        <div class="card"><app-empty-state icon="verified_user" [title]="vista() === 'pendiente' ? 'No hay reportes pendientes' : 'Sin registros'" description="La comunidad está en orden." /></div>
      } @else {
        <div class="stack">
          @for (r of reportes(); track r.id) {
            <article class="card card-pad stack-sm">
              <div class="row-between">
                <div class="row">
                  <span class="badge badge-secundario">{{ r.tipoContenido | etiqueta:'reporte' }}</span>
                  @if (r.totalReportes > 1) { <span class="badge badge-warning">{{ r.totalReportes }} reportes</span> }
                  <span class="xsmall muted">{{ r.createdAt | fechaRelativa }} · por {{ r.reportadoPor.nombre }}</span>
                </div>
                @let b = r.estado | estadoBadge:'reporte';
                <span class="badge" [class]="b.cssClass">{{ b.label }}</span>
              </div>
              <p><strong>Motivo:</strong> {{ r.motivo }}</p>
              @if (r.contenido; as c) {
                <div class="card card-pad" style="background:var(--bg-base)">
                  <div class="small strong">{{ c.titulo ?? c.autor.nombre }}</div>
                  @if (c.texto) { <p class="small clamp-3">{{ c.texto }}</p> }
                  <div class="xsmall muted">Autor: {{ c.autor.nombre ?? '—' }} · estado actual: {{ c.estado }}</div>
                  <a class="btn-link small" [routerLink]="enlace(r)" [queryParams]="parametros(r)">Ver contenido</a>
                </div>
              } @else {
                <p class="small muted">El contenido ya no existe.</p>
              }
              @if (r.resolucion) { <p class="small muted">Resolución: {{ r.resolucion }}</p> }
              @if (r.estado === 'pendiente') {
                <div class="row">
                  <button type="button" class="btn btn-sm btn-danger" (click)="resolver(r, 'ocultar')" [disabled]="procesando() === r.id"><mat-icon>visibility_off</mat-icon>{{ r.tipoContenido === 'usuario' ? 'Suspender usuario' : 'Ocultar contenido' }}</button>
                  <button type="button" class="btn btn-sm btn-ghost" (click)="resolver(r, 'ignorar')" [disabled]="procesando() === r.id">Descartar reporte</button>
                </div>
              }
            </article>
          }
        </div>
      }
      @if (hayMas() && !cargando()) { <div class="load-more"><button type="button" class="btn btn-ghost" (click)="cargar(true)">Cargar más</button></div> }
    </div>
  `,
})
export class AdminModeracionComponent implements OnInit {
  private readonly api = inject(SocialApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);

  protected readonly vista = signal<Vista>('pendiente');
  protected readonly reportes = signal<Reporte[]>([]);
  protected readonly ocultas = signal<Publicacion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  protected readonly procesando = signal<string | null>(null);
  private pagina = 1;

  ngOnInit(): void { this.cargar(); }

  cambiar(v: Vista): void { this.vista.set(v); this.cargar(); }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    const v = this.vista();
    if (v === 'ocultas') {
      this.api.feed({ estado: 'suspendida', page: this.pagina, limit: 20 }).subscribe({
        next: (r) => {
          this.ocultas.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
          this.hayMas.set(r.data.page < r.data.totalPages);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
      return;
    }
    this.api.reportes({ estado: v, page: this.pagina }).subscribe({
      next: (r) => {
        this.reportes.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  enlace(r: Reporte): (string | undefined)[] {
    const id = r.contenido?.enlaceId;
    switch (r.tipoContenido) {
      case 'publicacion':
      case 'comentario': return ['/admin/comunidad', id];
      case 'usuario': return ['/admin/usuarios', id];
      default: return ['/admin/materiales'];
    }
  }

  parametros(r: Reporte): Record<string, string> | null {
    return r.tipoContenido === 'material' && r.contenido?.titulo ? { q: r.contenido.titulo } : null;
  }

  resolver(r: Reporte, accion: 'ocultar' | 'ignorar'): void {
    this.dialogo.pedirTexto({
      titulo: accion === 'ocultar' ? 'Retirar contenido' : 'Descartar reporte',
      mensaje: accion === 'ocultar' ? 'El contenido dejará de ser visible y se notificará al autor. Se resolverán todos los reportes de este contenido.' : 'El contenido se mantiene visible.',
      confirmar: accion === 'ocultar' ? 'Retirar' : 'Descartar', peligroso: accion === 'ocultar',
      campo: { etiqueta: 'Resolución (se comunica al autor)', minimo: 5 },
    }).subscribe((resolucion) => {
      this.procesando.set(r.id);
      this.api.resolverReporte(r.id, accion, resolucion).subscribe({
        next: () => {
          this.procesando.set(null);
          this.reportes.update((l) => l.filter((x) => !(x.contenidoId === r.contenidoId && x.tipoContenido === r.tipoContenido)));
          this.toast.exito(accion === 'ocultar' ? 'Contenido retirado' : 'Reporte descartado');
        },
        error: (e) => { this.procesando.set(null); this.toast.error(mensajeError(e)); },
      });
    });
  }

  restaurar(p: Publicacion): void {
    this.dialogo.confirmar({ titulo: 'Restaurar publicación', mensaje: 'Volverá a ser visible en la comunidad.', confirmar: 'Restaurar' }).subscribe(() =>
      this.api.moderar(p.id, 'publicada').subscribe({
        next: () => { this.ocultas.update((l) => l.filter((x) => x.id !== p.id)); this.toast.exito('Publicación restaurada'); },
        error: (e) => this.toast.error(mensajeError(e)),
      }));
  }
}
