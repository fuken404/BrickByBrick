import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Evento } from '../../../core/models';
import { UploadUrlPipe } from '../../pipes/upload-url.pipe';
import { EtiquetaPipe } from '../../pipes/etiqueta.pipe';
import { EstadoBadgePipe } from '../../pipes/estado-badge.pipe';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [MatIconModule, DatePipe, UploadUrlPipe, EtiquetaPipe, EstadoBadgePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss',
})
export class EventCardComponent {
  readonly evento = input.required<Evento>();
  /** Muestra el estado del evento en vez del de la inscripción (vistas de empresa/admin). */
  readonly mostrarEstado = input(false);
  readonly procesando = input(false);
  readonly abrir = output<Evento>();
  readonly inscribirse = output<Evento>();

  protected readonly inscrito = computed(() => ['inscrito', 'asistio'].includes(this.evento().miInscripcion ?? ''));
  protected readonly lleno = computed(() => this.evento().cuposDisponibles === 0);
  protected readonly ocupacion = computed(() => {
    const e = this.evento();
    return e.capacidadMaxima ? Math.min(100, Math.round((e.inscritos / e.capacidadMaxima) * 100)) : 0;
  });
  protected readonly abiertoInscripcion = computed(() => ['publicado', 'en_curso'].includes(this.evento().estado));
}
