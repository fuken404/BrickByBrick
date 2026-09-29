import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/auth/auth.store';
import { UserApiService } from '../../../core/services/user-api.service';
import { SocialApiService } from '../../../core/services/social-api.service';
import { MensajeApiService } from '../../../core/services/mensaje-api.service';
import { MaterialApiService } from '../../../core/services/material-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { Material, PerfilPublico, Publicacion, UsuarioPublico } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MaterialCardComponent } from '../../../shared/components/material-card/material-card.component';
import { PostCardComponent } from '../comunidad/post-card/post-card.component';
import { EtiquetaPipe } from '../../../shared/pipes/etiqueta.pipe';

type Pestana = 'publicaciones' | 'materiales' | 'seguidores' | 'siguiendo';

@Component({
  selector: 'app-perfil-publico',
  standalone: true,
  imports: [RouterLink, DatePipe, MatIconModule, AvatarComponent, EmptyStateComponent, MaterialCardComponent, PostCardComponent, EtiquetaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfil-publico.component.html',
  styleUrl: './perfil-publico.component.scss',
})
export class PerfilPublicoComponent {
  readonly id = input.required<string>();

  protected readonly auth = inject(AuthStore);
  private readonly users = inject(UserApiService);
  private readonly social = inject(SocialApiService);
  private readonly mensajes = inject(MensajeApiService);
  private readonly materiales = inject(MaterialApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);
  private readonly router = inject(Router);

  protected readonly perfil = signal<PerfilPublico | null>(null);
  protected readonly cargando = signal(true);
  protected readonly pestana = signal<Pestana>('publicaciones');
  protected readonly publicaciones = signal<Publicacion[]>([]);
  protected readonly listaMateriales = signal<Material[]>([]);
  protected readonly personas = signal<UsuarioPublico[]>([]);
  protected readonly procesando = signal(false);

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.cargar(id));
    });
  }

  private cargar(id: string): void {
    this.cargando.set(true);
    this.pestana.set('publicaciones');
    this.users.perfilPublico(id).subscribe({
      next: (r) => { this.perfil.set(r.data); this.cargando.set(false); this.cargarPestana(); },
      error: () => { this.perfil.set(null); this.cargando.set(false); },
    });
  }

  cambiar(p: Pestana): void {
    this.pestana.set(p);
    this.cargarPestana();
  }

  private cargarPestana(): void {
    const p = this.perfil();
    if (!p) return;
    switch (this.pestana()) {
      case 'publicaciones':
        this.social.feed({ autorId: p.id, limit: 20 }).subscribe({ next: (r) => this.publicaciones.set(r.data.items) });
        break;
      case 'materiales':
        if (p.empresa) this.materiales.catalogo({ constructoraId: p.empresa.id, limit: 12 }).subscribe({ next: (r) => this.listaMateriales.set(r.data.items) });
        break;
      case 'seguidores':
        this.social.seguidores(p.id).subscribe({ next: (r) => this.personas.set(r.data.items) });
        break;
      case 'siguiendo':
        this.social.siguiendo(p.id).subscribe({ next: (r) => this.personas.set(r.data.items) });
        break;
    }
  }

  alternarSeguir(): void {
    const p = this.perfil();
    if (!p || this.procesando()) return;
    this.procesando.set(true);
    (p.siguiendoPorMi ? this.social.dejarDeSeguir(p.id) : this.social.seguir(p.id)).subscribe({
      next: (r) => { this.perfil.set({ ...p, ...r.data }); this.procesando.set(false); },
      error: (e) => { this.procesando.set(false); this.toast.error(mensajeError(e)); },
    });
  }

  escribir(): void {
    const p = this.perfil();
    if (!p) return;
    this.mensajes.abrir(p.id).subscribe({
      next: (r) => this.router.navigate([this.auth.prefijo(), 'mensajes', r.data.id]),
      error: (e) => this.toast.error(mensajeError(e)),
    });
  }

  reportar(): void {
    const p = this.perfil();
    if (!p) return;
    this.dialogo.pedirTexto({
      titulo: `Reportar a ${p.nombre}`, mensaje: 'Describe el comportamiento que incumple las normas de la comunidad.',
      confirmar: 'Enviar reporte', campo: { etiqueta: 'Motivo', minimo: 10 },
    }).subscribe((motivo) => this.social.reportar('usuario', p.id, motivo).subscribe({
      next: (r) => this.toast.exito(r.message),
      error: (e) => this.toast.error(mensajeError(e)),
    }));
  }

  abrirMaterial(m: Material): void {
    if (this.auth.isBeneficiario()) this.router.navigate([this.auth.prefijo(), 'materiales', m.id]);
    else if (this.perfil()?.esPropio) this.router.navigate([this.auth.prefijo(), 'materiales', m.id, 'editar']);
  }

  reemplazar(p: Publicacion): void { this.publicaciones.update((l) => l.map((x) => (x.id === p.id ? p : x))); }
  quitar(id: string): void { this.publicaciones.update((l) => l.filter((x) => x.id !== id)); }
}
