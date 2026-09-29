import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SocialApiService } from '../../../../core/services/social-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { Comentario } from '../../../../core/models';
import { mensajeError } from '../../../../core/utils/http';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { FechaRelativaPipe } from '../../../../shared/pipes/fecha-relativa.pipe';

@Component({
  selector: 'app-comentarios',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet, FormsModule, MatIconModule, AvatarComponent, FechaRelativaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comentarios.component.html',
  styleUrl: './comentarios.component.scss',
})
export class ComentariosComponent implements OnInit {
  readonly publicacionId = input.required<string>();
  readonly autorPublicacionId = input.required<string>();
  readonly cambioTotal = output<number>();

  protected readonly auth = inject(AuthStore);
  private readonly api = inject(SocialApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);

  protected readonly comentarios = signal<Comentario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly hayMas = signal(false);
  protected readonly enviando = signal(false);
  protected readonly respondiendoA = signal<Comentario | null>(null);
  protected readonly editando = signal<string | null>(null);
  protected nuevo = '';
  protected respuesta = '';
  protected textoEdicion = '';
  private pagina = 1;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(mas = false): void {
    if (mas) this.pagina++;
    this.api.comentarios(this.publicacionId(), this.pagina).subscribe({
      next: (r) => {
        this.comentarios.update((l) => (mas ? [...l, ...r.data.items] : r.data.items));
        this.hayMas.set(r.data.page < r.data.totalPages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  comentar(): void {
    const texto = this.nuevo.trim();
    if (!texto || this.enviando()) return;
    this.enviando.set(true);
    this.api.comentar(this.publicacionId(), texto).subscribe({
      next: (r) => {
        this.comentarios.update((l) => [...l, r.data]);
        this.nuevo = '';
        this.enviando.set(false);
        this.cambioTotal.emit(1);
      },
      error: (e) => { this.enviando.set(false); this.toast.error(mensajeError(e)); },
    });
  }

  responder(): void {
    const padre = this.respondiendoA();
    const texto = this.respuesta.trim();
    if (!padre || !texto || this.enviando()) return;
    this.enviando.set(true);
    this.api.comentar(this.publicacionId(), texto, padre.id).subscribe({
      next: (r) => {
        const raiz = r.data.parentId;
        this.comentarios.update((l) => l.map((c) => (c.id === raiz ? { ...c, respuestas: [...c.respuestas, r.data] } : c)));
        this.respuesta = '';
        this.respondiendoA.set(null);
        this.enviando.set(false);
        this.cambioTotal.emit(1);
      },
      error: (e) => { this.enviando.set(false); this.toast.error(mensajeError(e)); },
    });
  }

  alternarLike(c: Comentario): void {
    const obs = c.likedByMe ? this.api.unlikeComentario(c.id) : this.api.likeComentario(c.id);
    this.actualizar(c.id, { likedByMe: !c.likedByMe, likes: c.likes + (c.likedByMe ? -1 : 1) });
    obs.subscribe({
      next: (r) => this.actualizar(c.id, r.data),
      error: (e) => { this.actualizar(c.id, { likedByMe: c.likedByMe, likes: c.likes }); this.toast.error(mensajeError(e)); },
    });
  }

  empezarEdicion(c: Comentario): void {
    this.editando.set(c.id);
    this.textoEdicion = c.contenido ?? '';
  }

  guardarEdicion(c: Comentario): void {
    const texto = this.textoEdicion.trim();
    if (!texto) return;
    this.api.editarComentario(c.id, texto).subscribe({
      next: () => { this.actualizar(c.id, { contenido: texto, editado: true }); this.editando.set(null); },
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }

  eliminar(c: Comentario): void {
    this.dialogo.confirmar({ titulo: 'Eliminar comentario', mensaje: '¿Seguro que quieres eliminar este comentario?', confirmar: 'Eliminar', peligroso: true })
      .subscribe(() => {
        this.api.eliminarComentario(c.id).subscribe({
          next: () => {
            const quitados = c.parentId ? 1 : 1 + c.respuestas.length;
            this.comentarios.update((l) => l
              .filter((x) => x.id !== c.id)
              .map((x) => ({ ...x, respuestas: x.respuestas.filter((r) => r.id !== c.id) })));
            this.cambioTotal.emit(-quitados);
          },
          error: (e) => this.toast.error(mensajeError(e)),
        });
      });
  }

  reportar(c: Comentario): void {
    this.dialogo.pedirTexto({
      titulo: 'Reportar comentario', mensaje: 'Cuéntanos por qué este comentario incumple las normas de la comunidad.',
      confirmar: 'Enviar reporte', campo: { etiqueta: 'Motivo', minimo: 10 },
    }).subscribe((motivo) => this.api.reportar('comentario', c.id, motivo).subscribe({
      next: (r) => this.toast.exito(r.message),
      error: (e) => this.toast.error(mensajeError(e)),
    }));
  }

  puedeEliminar(c: Comentario): boolean {
    const u = this.auth.user();
    return !!u && (u.id === c.autor.id || u.id === this.autorPublicacionId() || u.rol === 'ADMINISTRADOR');
  }

  private actualizar(id: string, cambios: Partial<Comentario>): void {
    this.comentarios.update((l) => l.map((c) => (c.id === id
      ? { ...c, ...cambios }
      : { ...c, respuestas: c.respuestas.map((r) => (r.id === id ? { ...r, ...cambios } : r)) })));
  }
}
