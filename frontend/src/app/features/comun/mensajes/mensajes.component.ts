import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, input, signal, untracked, viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/auth/auth.store';
import { MensajeApiService } from '../../../core/services/mensaje-api.service';
import { RealtimeService } from '../../../core/services/realtime.service';
import { ToastService } from '../../../core/services/toast.service';
import { NotificationStore } from '../../../core/stores/notification.store';
import { Conversacion, MensajeDirecto, UsuarioPublico } from '../../../core/models';
import { mensajeError } from '../../../core/utils/http';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { FechaRelativaPipe } from '../../../shared/pipes/fecha-relativa.pipe';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, MatIconModule, AvatarComponent, EmptyStateComponent, FechaRelativaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mensajes.component.html',
  styleUrl: './mensajes.component.scss',
})
export class MensajesComponent {
  /** Conversación abierta (ruta /mensajes/:id) */
  readonly id = input<string>();

  protected readonly auth = inject(AuthStore);
  private readonly api = inject(MensajeApiService);
  private readonly realtime = inject(RealtimeService);
  private readonly toast = inject(ToastService);
  private readonly contadores = inject(NotificationStore);
  private readonly lista = viewChild<ElementRef<HTMLElement>>('lista');

  protected readonly conversaciones = signal<Conversacion[]>([]);
  protected readonly cargandoLista = signal(true);
  protected readonly otro = signal<UsuarioPublico | null>(null);
  protected readonly mensajes = signal<MensajeDirecto[]>([]);
  protected readonly hayAnteriores = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorConversacion = signal(false);
  protected texto = '';

  protected readonly abierta = computed(() => this.id() ?? null);

  constructor() {
    this.cargarLista();
    effect(() => {
      const id = this.id();
      untracked(() => this.abrir(id ?? null));
    });
    this.realtime.on<MensajeDirecto>('dm:mensaje').pipe(takeUntilDestroyed()).subscribe((m) => this.recibir(m));
    inject(DestroyRef).onDestroy(() => this.contadores.conversacionAbierta.set(null));
  }

  private cargarLista(): void {
    this.api.conversaciones().subscribe({
      next: (r) => { this.conversaciones.set(r.data); this.cargandoLista.set(false); },
      error: () => this.cargandoLista.set(false),
    });
  }

  private abrir(id: string | null): void {
    this.contadores.conversacionAbierta.set(id);
    this.mensajes.set([]);
    this.otro.set(null);
    this.errorConversacion.set(false);
    if (!id) return;
    this.api.obtener(id).subscribe({
      next: (r) => this.otro.set(r.data.otroUsuario),
      error: () => this.errorConversacion.set(true),
    });
    this.cargarMensajes(id);
  }

  cargarMensajes(id: string, anteriores = false): void {
    const antes = anteriores ? this.mensajes()[0]?.createdAt : undefined;
    this.api.mensajes(id, antes).subscribe({
      next: (r) => {
        this.mensajes.update((l) => (anteriores ? [...r.data.items, ...l] : r.data.items));
        this.hayAnteriores.set(r.data.hayMas);
        if (!anteriores) { this.bajar(); this.marcarLeida(id); }
      },
    });
  }

  enviar(): void {
    const id = this.abierta();
    const contenido = this.texto.trim();
    if (!id || !contenido || this.enviando()) return;
    this.enviando.set(true);
    this.api.enviar(id, contenido).subscribe({
      next: (r) => { this.texto = ''; this.enviando.set(false); this.recibir(r.data); },
      error: (e) => { this.enviando.set(false); this.toast.error(mensajeError(e)); },
    });
  }

  esMio(m: MensajeDirecto): boolean {
    return m.autorId === this.auth.user()?.id;
  }

  private recibir(m: MensajeDirecto): void {
    const abierta = this.abierta();
    if (m.conversacionId === abierta && !this.mensajes().some((x) => x.id === m.id)) {
      this.mensajes.update((l) => [...l, m]);
      this.bajar();
      if (!this.esMio(m)) this.marcarLeida(abierta);
    }
    const existe = this.conversaciones().some((c) => c.id === m.conversacionId);
    if (!existe) { this.cargarLista(); return; }
    this.conversaciones.update((l) => {
      const actualizadas = l.map((c) => (c.id === m.conversacionId
        ? { ...c, ultimoMensaje: m, ultimoMensajeEn: m.createdAt, noLeidos: c.id === abierta || this.esMio(m) ? 0 : c.noLeidos + 1 }
        : c));
      return actualizadas.sort((a, b) => b.ultimoMensajeEn.localeCompare(a.ultimoMensajeEn));
    });
  }

  private marcarLeida(id: string): void {
    this.api.marcarLeida(id).subscribe({
      next: () => {
        this.conversaciones.update((l) => l.map((c) => (c.id === id ? { ...c, noLeidos: 0 } : c)));
        this.contadores.recargarMensajes();
      },
    });
  }

  private bajar(): void {
    setTimeout(() => {
      const el = this.lista()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
