import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, input, signal, untracked, viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/auth/auth.store';
import { AccionMiembro, GrupoApiService } from '../../../core/services/grupo-api.service';
import { SocialApiService } from '../../../core/services/social-api.service';
import { RealtimeService } from '../../../core/services/realtime.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { Grupo, MensajeGrupo, MiembroGrupo, UsuarioPublico } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { UploadUrlPipe } from '../../../shared/pipes/upload-url.pipe';

type Pestana = 'chat' | 'miembros' | 'solicitudes' | 'acerca';

@Component({
  selector: 'app-grupo-detalle',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, MatIconModule, AvatarComponent, EmptyStateComponent, FileUploadComponent, UploadUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grupo-detalle.component.html',
  styleUrl: './grupo-detalle.component.scss',
})
export class GrupoDetalleComponent {
  readonly id = input.required<string>();

  protected readonly auth = inject(AuthStore);
  private readonly api = inject(GrupoApiService);
  private readonly social = inject(SocialApiService);
  private readonly realtime = inject(RealtimeService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lista = viewChild<ElementRef<HTMLElement>>('lista');

  protected readonly grupo = signal<Grupo | null>(null);
  protected readonly cargando = signal(true);
  protected readonly pestana = signal<Pestana>('chat');
  protected readonly mensajes = signal<MensajeGrupo[]>([]);
  protected readonly hayAnteriores = signal(false);
  protected readonly miembros = signal<MiembroGrupo[]>([]);
  protected readonly pendientes = signal<MiembroGrupo[]>([]);
  protected readonly enviando = signal(false);
  protected readonly editando = signal(false);
  protected readonly invitando = signal(false);
  protected readonly candidatos = signal<UsuarioPublico[]>([]);
  protected texto = '';
  protected edicion = { nombre: '', descripcion: '', temas: '', privacidad: 'publico' as 'publico' | 'privado' };
  private salaActual: string | null = null;

  protected readonly esMiembro = computed(() => this.grupo()?.miMembresia?.estado === 'activo');
  protected readonly esAdminGrupo = computed(() => (this.esMiembro() && this.grupo()?.miMembresia?.rol === 'admin') || this.auth.isAdmin());
  protected readonly esCreador = computed(() => this.grupo()?.creador.id === this.auth.user()?.id);
  protected readonly puedeChatear = computed(() => this.esMiembro() || this.auth.isAdmin());

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.cargar(id));
    });
    this.realtime.on<MensajeGrupo>('grupo:mensaje').pipe(takeUntilDestroyed()).subscribe((m) => {
      if (m.grupoId !== this.grupo()?.id || this.mensajes().some((x) => x.id === m.id)) return;
      this.mensajes.update((l) => [...l, m]);
      this.bajar();
    });
    this.realtime.on<{ grupoId: string }>('grupo:expulsado').pipe(takeUntilDestroyed()).subscribe((e) => {
      if (e.grupoId === this.grupo()?.id) { this.toast.info('Ya no eres miembro de este grupo'); this.cargar(e.grupoId); }
    });
    this.destroyRef.onDestroy(() => this.salirSala());
  }

  private cargar(id: string): void {
    this.salirSala();
    this.cargando.set(true);
    this.api.obtener(id).subscribe({
      next: (r) => {
        this.grupo.set(r.data);
        this.cargando.set(false);
        if (this.puedeChatear()) {
          this.salaActual = id;
          this.realtime.entrarGrupo(id);
          this.cargarMensajes();
        } else {
          this.pestana.set('acerca');
        }
        if (this.esAdminGrupo()) this.cargarPendientes();
      },
      error: () => { this.grupo.set(null); this.cargando.set(false); },
    });
  }

  private salirSala(): void {
    if (this.salaActual) this.realtime.salirGrupo(this.salaActual);
    this.salaActual = null;
  }

  cambiarPestana(p: Pestana): void {
    this.pestana.set(p);
    if (p === 'miembros') this.cargarMiembros();
    if (p === 'chat') this.bajar();
  }

  cargarMensajes(anteriores = false): void {
    const g = this.grupo();
    if (!g) return;
    const antes = anteriores ? this.mensajes()[0]?.createdAt : undefined;
    this.api.mensajes(g.id, antes).subscribe({
      next: (r) => {
        this.mensajes.update((l) => (anteriores ? [...r.data.items, ...l] : r.data.items));
        this.hayAnteriores.set(r.data.hayMas);
        if (!anteriores) this.bajar();
      },
    });
  }

  enviar(): void {
    const g = this.grupo();
    const contenido = this.texto.trim();
    if (!g || !contenido || this.enviando()) return;
    this.enviando.set(true);
    this.api.enviarMensaje(g.id, contenido).subscribe({
      next: (r) => {
        if (!this.mensajes().some((m) => m.id === r.data.id)) this.mensajes.update((l) => [...l, r.data]);
        this.texto = '';
        this.enviando.set(false);
        this.bajar();
      },
      error: (e) => { this.enviando.set(false); this.toast.error(mensajeError(e)); },
    });
  }

  unirse(): void {
    const g = this.grupo();
    if (!g) return;
    this.api.unirse(g.id).subscribe({
      next: (r) => { this.toast.exito(r.message); this.cargar(g.id); },
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }

  salir(): void {
    const g = this.grupo();
    if (!g) return;
    this.dialogo.confirmar({ titulo: 'Salir del grupo', mensaje: `¿Quieres salir de "${g.nombre}"?`, confirmar: 'Salir' })
      .subscribe(() => this.api.salir(g.id).subscribe({
        next: () => { this.toast.exito('Saliste del grupo'); this.mensajes.set([]); this.cargar(g.id); },
        error: (e) => this.toast.error(mensajeError(e)),
      }));
  }

  cargarMiembros(): void {
    const g = this.grupo();
    if (!g) return;
    this.api.miembros(g.id).subscribe({ next: (r) => this.miembros.set(r.data.items), error: (e) => this.toast.error(mensajeError(e)) });
  }

  cargarPendientes(): void {
    const g = this.grupo();
    if (!g) return;
    this.api.miembros(g.id, 'pendiente').subscribe({ next: (r) => this.pendientes.set(r.data.items), error: () => undefined });
  }

  gestionar(m: MiembroGrupo, accion: AccionMiembro): void {
    const g = this.grupo();
    if (!g) return;
    const ejecutar = () => this.api.gestionarMiembro(g.id, m.id, accion).subscribe({
      next: () => {
        this.toast.exito('Miembro actualizado');
        this.cargarPendientes();
        this.cargarMiembros();
        if (accion === 'aprobar') this.grupo.update((x) => (x ? { ...x, miembros: x.miembros + 1 } : x));
        if (accion === 'expulsar') this.grupo.update((x) => (x ? { ...x, miembros: x.miembros - 1 } : x));
      },
      error: (e) => this.toast.error(mensajeError(e)),
    });
    if (accion === 'expulsar') {
      this.dialogo.confirmar({ titulo: 'Expulsar miembro', mensaje: `${m.nombre} dejará de pertenecer al grupo.`, confirmar: 'Expulsar', peligroso: true })
        .subscribe(ejecutar);
    } else {
      ejecutar();
    }
  }

  abrirInvitaciones(): void {
    const yo = this.auth.user();
    if (!yo) return;
    this.invitando.set(true);
    this.social.siguiendo(yo.id).subscribe({ next: (r) => this.candidatos.set(r.data.items) });
  }

  invitar(u: UsuarioPublico): void {
    const g = this.grupo();
    if (!g) return;
    this.api.invitar(g.id, u.id).subscribe({
      next: () => { this.toast.exito(`Invitaste a ${u.nombre}`); this.candidatos.update((l) => l.filter((x) => x.id !== u.id)); },
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }

  empezarEdicion(): void {
    const g = this.grupo();
    if (!g) return;
    this.edicion = { nombre: g.nombre, descripcion: g.descripcion ?? '', temas: g.temas.join(', '), privacidad: g.privacidad };
    this.editando.set(true);
  }

  guardarEdicion(): void {
    const g = this.grupo();
    if (!g || this.edicion.nombre.trim().length < 3) return;
    this.api.actualizar(g.id, {
      nombre: this.edicion.nombre.trim(), descripcion: this.edicion.descripcion.trim(), privacidad: this.edicion.privacidad,
      temas: this.edicion.temas.split(',').map((t) => t.trim()).filter((t) => t.length >= 2).slice(0, 10),
    }).subscribe({
      next: (r) => { this.grupo.set(r.data); this.editando.set(false); this.toast.exito('Grupo actualizado'); },
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }

  subirImagen(files: File[]): void {
    const g = this.grupo();
    if (!g || !files[0]) return;
    this.api.subirImagen(g.id, files[0]).subscribe({
      next: (r) => { this.grupo.set(r.data); this.toast.exito('Imagen actualizada'); },
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }

  eliminar(): void {
    const g = this.grupo();
    if (!g) return;
    this.dialogo.confirmar({ titulo: 'Eliminar grupo', mensaje: `Se eliminará "${g.nombre}" con todos sus mensajes. No se puede deshacer.`, confirmar: 'Eliminar', peligroso: true })
      .subscribe(() => this.api.eliminar(g.id).subscribe({
        next: () => { this.toast.exito('Grupo eliminado'); this.router.navigate([this.auth.prefijo(), 'grupos']); },
        error: (e) => this.toast.error(mensajeError(e)),
      }));
  }

  esMio(m: MensajeGrupo): boolean {
    return m.autor.id === this.auth.user()?.id;
  }

  private bajar(): void {
    setTimeout(() => {
      const el = this.lista()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
