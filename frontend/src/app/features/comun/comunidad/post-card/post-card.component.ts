import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SocialApiService } from '../../../../core/services/social-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { Publicacion, TipoPublicacion } from '../../../../core/models';
import { mensajeError } from '../../../../core/utils/http';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { FechaRelativaPipe } from '../../../../shared/pipes/fecha-relativa.pipe';
import { UploadUrlPipe } from '../../../../shared/pipes/upload-url.pipe';
import { EtiquetaPipe, ETIQUETAS_TIPO_PUBLICACION } from '../../../../shared/pipes/etiqueta.pipe';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside.directive';
import { ComentariosComponent } from '../comentarios/comentarios.component';

const COLOR_TIPO: Record<TipoPublicacion, string> = {
  reutilizacion: 'badge-aprobado', tutorial: 'badge-secundario', proyecto: 'badge-primary',
  producto: 'badge-warning', noticia: 'badge-entregado', recurso: 'badge-verificado',
};

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [RouterLink, FormsModule, MatIconModule, MatTooltipModule, AvatarComponent, FechaRelativaPipe, UploadUrlPipe, EtiquetaPipe, ClickOutsideDirective, ComentariosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
})
export class PostCardComponent implements OnInit {
  readonly publicacion = input.required<Publicacion>();
  readonly comentariosAbiertos = input(false);
  readonly cambiada = output<Publicacion>();
  readonly eliminada = output<string>();
  readonly compartida = output<Publicacion>();

  protected readonly auth = inject(AuthStore);
  private readonly api = inject(SocialApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);

  protected readonly tipos = Object.entries(ETIQUETAS_TIPO_PUBLICACION);
  protected readonly menu = signal(false);
  protected readonly verComentarios = signal(false);
  protected readonly expandida = signal(false);
  protected readonly editando = signal(false);
  protected edicion = { titulo: '', contenido: '', tipo: 'reutilizacion' as TipoPublicacion };

  /** En un repost, la tarjeta muestra el original y se interactúa con él. */
  protected readonly original = computed(() => this.publicacion().repostDe ?? this.publicacion());
  protected readonly esRepost = computed(() => !!this.publicacion().repostDe);
  protected readonly propia = computed(() => this.publicacion().autor.id === this.auth.user()?.id);
  protected readonly originalPropio = computed(() => this.original().autor.id === this.auth.user()?.id);
  protected readonly claseTipo = computed(() => COLOR_TIPO[this.original().tipo]);
  protected readonly larga = computed(() => this.original().contenido.length > 320);

  ngOnInit(): void {
    this.verComentarios.set(this.comentariosAbiertos());
  }

  alternarLike(): void {
    const p = this.original();
    const previo = { likes: p.likes, likedByMe: p.likedByMe };
    this.emitirOriginal({ likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) });
    (p.likedByMe ? this.api.unlike(p.id) : this.api.like(p.id)).subscribe({
      next: (r) => this.emitirOriginal(r.data),
      error: (e) => { this.emitirOriginal(previo); this.toast.error(mensajeError(e)); },
    });
  }

  compartir(): void {
    const p = this.original();
    if (p.repostedByMe) {
      this.dialogo.confirmar({ titulo: 'Dejar de compartir', mensaje: 'La publicación dejará de aparecer en tu perfil.', confirmar: 'Dejar de compartir' })
        .subscribe(() => this.api.quitarRepost(p.id).subscribe({
          next: () => { this.emitirOriginal({ repostedByMe: false, reposts: Math.max(0, p.reposts - 1) }); this.toast.exito('Dejaste de compartir la publicación'); },
          error: (e) => this.toast.error(mensajeError(e)),
        }));
      return;
    }
    this.dialogo.pedirTexto({
      titulo: 'Compartir publicación', mensaje: `Compartirás la publicación de ${p.autor.nombre} con tus seguidores.`,
      confirmar: 'Compartir', campo: { etiqueta: 'Agrega un comentario (opcional)', requerido: false, minimo: 0 },
    }).subscribe((comentario) => this.api.repost(p.id, comentario || undefined).subscribe({
      next: (r) => {
        this.emitirOriginal({ repostedByMe: true, reposts: p.reposts + 1 });
        this.compartida.emit(r.data);
        this.toast.exito('Publicación compartida');
      },
      error: (e) => this.toast.error(mensajeError(e)),
    }));
  }

  empezarEdicion(): void {
    const p = this.publicacion();
    this.edicion = { titulo: p.titulo ?? '', contenido: p.contenido, tipo: p.tipo };
    this.editando.set(true);
    this.menu.set(false);
  }

  guardarEdicion(): void {
    const p = this.publicacion();
    const datos = this.esRepost()
      ? { contenido: this.edicion.contenido.trim() }
      : { titulo: this.edicion.titulo.trim() || null, contenido: this.edicion.contenido.trim(), tipo: this.edicion.tipo };
    if (!this.esRepost() && datos.contenido.length < 10) { this.toast.error('El contenido debe tener al menos 10 caracteres'); return; }
    this.api.editar(p.id, datos).subscribe({
      next: (r) => { this.cambiada.emit(r.data); this.editando.set(false); this.toast.exito('Publicación actualizada'); },
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }

  eliminar(): void {
    this.menu.set(false);
    this.dialogo.confirmar({ titulo: 'Eliminar publicación', mensaje: 'Esta acción no se puede deshacer.', confirmar: 'Eliminar', peligroso: true })
      .subscribe(() => this.api.eliminar(this.publicacion().id).subscribe({
        next: () => { this.eliminada.emit(this.publicacion().id); this.toast.exito('Publicación eliminada'); },
        error: (e) => this.toast.error(mensajeError(e)),
      }));
  }

  reportar(): void {
    this.menu.set(false);
    this.dialogo.pedirTexto({
      titulo: 'Reportar publicación', mensaje: 'Nuestro equipo revisará el contenido. Cuéntanos qué norma incumple.',
      confirmar: 'Enviar reporte', campo: { etiqueta: 'Motivo', minimo: 10, placeholder: 'Ej: contenido ofensivo, publicidad engañosa…' },
    }).subscribe((motivo) => this.api.reportar('publicacion', this.original().id, motivo).subscribe({
      next: (r) => this.toast.exito(r.message),
      error: (e) => this.toast.error(mensajeError(e)),
    }));
  }

  ocultar(): void {
    this.menu.set(false);
    this.dialogo.pedirTexto({
      titulo: 'Ocultar publicación', mensaje: 'La publicación dejará de ser visible y se notificará a su autor.',
      confirmar: 'Ocultar', peligroso: true, campo: { etiqueta: 'Motivo', minimo: 5 },
    }).subscribe((motivo) => this.api.moderar(this.original().id, 'suspendida', motivo).subscribe({
      next: () => { this.eliminada.emit(this.publicacion().id); this.toast.exito('Publicación ocultada'); },
      error: (e) => this.toast.error(mensajeError(e)),
    }));
  }

  ajustarComentarios(delta: number): void {
    this.emitirOriginal({ comentarios: Math.max(0, this.original().comentarios + delta) });
  }

  private emitirOriginal(cambios: Partial<Publicacion>): void {
    const p = this.publicacion();
    this.cambiada.emit(p.repostDe ? { ...p, repostDe: { ...p.repostDe, ...cambios } } : { ...p, ...cambios });
  }
}
