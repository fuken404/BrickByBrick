import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { UserApiService } from '../../../core/services/user-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { Constructora, DocumentoEmpresa } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EstadoBadgePipe } from '../../../shared/pipes/estado-badge.pipe';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';

type Filtro = 'pendientes' | 'verificadas' | 'todas';

@Component({
  selector: 'app-admin-constructoras',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, MatIconModule, AvatarComponent, EmptyStateComponent, SkeletonLoaderComponent, EstadoBadgePipe, EtiquetaPipe, UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div><h1 class="page-title">Constructoras</h1><p class="page-subtitle">Verificación de empresas donantes y revisión de documentos.</p></div>
      </header>

      <div class="toolbar">
        <div class="tabs" style="border:none">
          <button type="button" class="tab" [class.active]="filtro() === 'pendientes'" (click)="cambiar('pendientes')">Por verificar</button>
          <button type="button" class="tab" [class.active]="filtro() === 'verificadas'" (click)="cambiar('verificadas')">Verificadas</button>
          <button type="button" class="tab" [class.active]="filtro() === 'todas'" (click)="cambiar('todas')">Todas</button>
        </div>
        <form class="search" (ngSubmit)="cargar()"><mat-icon>search</mat-icon>
          <input class="form-input" name="q" [(ngModel)]="q" placeholder="Razón social o NIT…" aria-label="Buscar constructoras" /></form>
      </div>

      @if (cargando()) {
        <app-skeleton-loader type="list" [count]="5" />
      } @else if (!items().length) {
        <div class="card"><app-empty-state icon="business" [title]="filtro() === 'pendientes' ? 'No hay constructoras por verificar' : 'Sin resultados'" /></div>
      } @else {
        <div class="stack">
          @for (c of items(); track c.id) {
            <article class="card card-pad-lg stack-sm" [id]="'c-' + c.id" [style.outline]="resaltada() === c.id ? '2px solid var(--secondary)' : null">
              <div class="row-between">
                <div class="row">
                  <app-avatar [name]="c.razonSocial" [src]="c.logoUrl" [size]="44" />
                  <div>
                    <div class="strong">{{ c.razonSocial }}</div>
                    <div class="xsmall muted">NIT {{ c.nit }} · {{ c.localidad?.nombre ?? 'Sin localidad' }} · registrada {{ c.usuario?.createdAt | date:'mediumDate' }}</div>
                  </div>
                </div>
                @if (c.verificada) { <span class="badge badge-verificado">Verificada</span> }
                @else if (c.motivoRechazo) { <span class="badge badge-rechazado">Rechazada</span> }
                @else { <span class="badge badge-pendiente-verificacion">Pendiente</span> }
              </div>

              <dl class="dl">
                <dt>Representante</dt><dd>{{ c.representanteLegal ?? '—' }}{{ c.cargoRepresentante ? ' (' + c.cargoRepresentante + ')' : '' }}</dd>
                <dt>Contacto</dt><dd>{{ c.usuario?.email }}{{ c.usuario?.telefono ? ' · ' + c.usuario?.telefono : '' }}</dd>
                <dt>Dirección</dt><dd>{{ c.direccion ?? '—' }}</dd>
                @if (c.sitioWeb) { <dt>Sitio web</dt><dd><a [href]="c.sitioWeb" target="_blank" rel="noopener noreferrer">{{ c.sitioWeb }}</a></dd> }
                @if (c.motivoRechazo && !c.verificada) { <dt>Motivo de rechazo</dt><dd>{{ c.motivoRechazo }}</dd> }
              </dl>

              <h3 class="mt-8">Documentos</h3>
              @for (d of c.documentosEmpresa ?? []; track d.id) {
                <div class="row-between small" style="padding:6px 0;border-bottom:1px solid var(--border)">
                  <span class="row">
                    <mat-icon>description</mat-icon>
                    <a [href]="d.url | uploadUrl" target="_blank" rel="noopener">{{ d.tipo | etiqueta:'documento' }}</a>
                    <span class="muted">{{ d.fechaSubida | date:'mediumDate' }}</span>
                    @let bd = d.estado | estadoBadge:'documento';
                    <span class="badge" [class]="bd.cssClass">{{ bd.label }}</span>
                    @if (d.motivoRechazo && d.estado === 'rechazado') { <span class="muted">— {{ d.motivoRechazo }}</span> }
                  </span>
                  @if (d.estado === 'pendiente') {
                    <span class="row">
                      <button type="button" class="btn btn-sm btn-accent" (click)="revisar(c, d, true)" [disabled]="procesando() === d.id">Aprobar</button>
                      <button type="button" class="btn btn-sm btn-danger-outline" (click)="revisar(c, d, false)" [disabled]="procesando() === d.id">Rechazar</button>
                    </span>
                  }
                </div>
              } @empty { <p class="small muted">No ha cargado documentos.</p> }

              <div class="row mt-8">
                @if (!c.verificada) {
                  <button type="button" class="btn btn-sm btn-accent" (click)="verificar(c, true)" [disabled]="procesando() === c.id"><mat-icon>verified</mat-icon>Verificar empresa</button>
                  <button type="button" class="btn btn-sm btn-danger-outline" (click)="verificar(c, false)" [disabled]="procesando() === c.id">Rechazar verificación</button>
                } @else {
                  <button type="button" class="btn btn-sm btn-danger-outline" (click)="verificar(c, false)" [disabled]="procesando() === c.id">Revocar verificación</button>
                }
                <a class="btn btn-sm btn-ghost" [routerLink]="['/admin/usuarios', c.usuarioId]"><mat-icon>visibility</mat-icon>Perfil público</a>
              </div>
            </article>
          }
        </div>
        @if (hayMas()) { <div class="load-more"><button type="button" class="btn btn-ghost" (click)="cargar(true)">Cargar más</button></div> }
      }
    </div>
  `,
})
export class AdminConstructorasComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly users = inject(UserApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);
  private readonly route = inject(ActivatedRoute);

  protected readonly filtro = signal<Filtro>('pendientes');
  protected readonly items = signal<Constructora[]>([]);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  protected readonly procesando = signal<string | null>(null);
  protected readonly resaltada = signal<string | null>(null);
  protected q = '';
  private pagina = 1;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const id = params.get('id');
    if (params.get('verificada') === 'true') this.filtro.set('verificadas');
    if (id) {
      this.resaltada.set(id);
      this.users.constructora(id).subscribe({
        next: (r) => { this.filtro.set('todas'); this.items.set([r.data]); this.cargando.set(false); },
        error: () => this.cargar(),
      });
      return;
    }
    this.cargar();
  }

  cambiar(f: Filtro): void { this.filtro.set(f); this.resaltada.set(null); this.cargar(); }

  cargar(mas = false): void {
    this.pagina = mas ? this.pagina + 1 : 1;
    if (!mas) this.cargando.set(true);
    const f = this.filtro();
    this.users.constructoras({
      q: this.q.trim() || undefined, verificada: f === 'todas' ? undefined : f === 'verificadas', page: this.pagina, limit: 15,
    }).subscribe({
      next: (r) => {
        this.items.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  private reemplazar(c: Constructora): void {
    this.items.update((l) => l.map((x) => (x.id === c.id ? { ...x, ...c } : x)));
  }

  verificar(c: Constructora, aprobar: boolean): void {
    if (aprobar) {
      const pendientes = (c.documentosEmpresa ?? []).filter((d) => d.estado !== 'aprobado').length;
      this.dialogo.confirmar({
        titulo: `Verificar ${c.razonSocial}`,
        mensaje: pendientes ? `Hay ${pendientes} documento(s) sin aprobar. ¿Verificar de todas formas?` : 'La empresa podrá publicar materiales y eventos.',
        confirmar: 'Verificar',
      }).subscribe(() => this.aplicarVerificacion(c, true));
      return;
    }
    this.dialogo.pedirTexto({
      titulo: c.verificada ? 'Revocar verificación' : 'Rechazar verificación', mensaje: 'La empresa recibirá el motivo por correo y en la plataforma.',
      confirmar: c.verificada ? 'Revocar' : 'Rechazar', peligroso: true, campo: { etiqueta: 'Motivo', minimo: 5 },
    }).subscribe((motivo) => this.aplicarVerificacion(c, false, motivo));
  }

  private aplicarVerificacion(c: Constructora, aprobar: boolean, motivo?: string): void {
    this.procesando.set(c.id);
    this.api.verificarConstructora(c.id, aprobar, motivo).subscribe({
      next: (r) => { this.procesando.set(null); this.reemplazar(r.data); this.toast.exito(aprobar ? 'Empresa verificada' : 'Verificación rechazada'); },
      error: (e) => { this.procesando.set(null); this.toast.error(mensajeError(e)); },
    });
  }

  revisar(c: Constructora, d: DocumentoEmpresa, aprobar: boolean): void {
    const aplicar = (motivo?: string) => {
      this.procesando.set(d.id);
      this.api.revisarDocumento(d.id, aprobar ? 'aprobado' : 'rechazado', motivo).subscribe({
        next: (r) => {
          this.procesando.set(null);
          this.reemplazar({ ...c, documentosEmpresa: (c.documentosEmpresa ?? []).map((x) => (x.id === d.id ? { ...x, ...r.data } : x)) });
          this.toast.exito(aprobar ? 'Documento aprobado' : 'Documento rechazado');
        },
        error: (e) => { this.procesando.set(null); this.toast.error(mensajeError(e)); },
      });
    };
    if (aprobar) { aplicar(); return; }
    this.dialogo.pedirTexto({
      titulo: 'Rechazar documento', mensaje: 'Indica qué debe corregir la empresa.', confirmar: 'Rechazar', peligroso: true,
      campo: { etiqueta: 'Motivo', minimo: 5 },
    }).subscribe((motivo) => aplicar(motivo));
  }
}
