import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Evento } from '../../../core/models';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="event-card card" (click)="clicked.emit(evento)" role="button" tabindex="0"
         (keydown.enter)="clicked.emit(evento)">
      <!-- Header -->
      <div class="event-header">
        @if (evento.imagenUrl) {
          <img [src]="evento.imagenUrl" [alt]="evento.nombre" class="event-img" />
        } @else {
          <mat-icon class="event-placeholder-icon">event</mat-icon>
        }
        <span class="badge status-badge" [ngClass]="inscrito ? 'badge-aprobado' : 'badge-secundario'">
          {{ inscrito ? '✓ Inscrito' : 'Abierto' }}
        </span>
      </div>

      <!-- Body -->
      <div class="event-body">
        <div class="event-date">{{ evento.fechaInicio | date:'EEE d MMM yyyy, h:mm a':'':'es-CO' }}</div>
        <h3 class="event-title">{{ evento.nombre }}</h3>
        <div class="event-company">{{ evento.constructora.razonSocial }}</div>

        @if (evento.direccion) {
          <div class="meta-row">
            <mat-icon>location_on</mat-icon>
            <span>{{ evento.direccion }}</span>
          </div>
        }

        <!-- Capacity bar -->
        @if (evento.capacidadMaxima) {
          <div class="capacity">
            <div class="capacity-label">
              <span>Cupos disponibles</span>
              <span>{{ disponibles }} de {{ evento.capacidadMaxima }}</span>
            </div>
            <div class="capacity-bar">
              <div class="capacity-fill" [style.width.%]="fillPct"
                   [style.background]="fillPct > 80 ? 'var(--warning)' : 'var(--accent)'"></div>
            </div>
          </div>
        }

        <!-- CTA -->
        @if (inscrito) {
          <button class="btn btn-sm event-btn inscribed">
            <mat-icon>check_circle</mat-icon> Ya inscrito
          </button>
        } @else if (agotado) {
          <button class="btn btn-sm event-btn" disabled>Cupos agotados</button>
        } @else {
          <button class="btn btn-primary btn-sm event-btn"
                  (click)="$event.stopPropagation(); inscribirse.emit(evento)">
            Inscribirme
          </button>
        }
      </div>
    </div>
  `,
  styleUrl: './event-card.component.scss',
})
export class EventCardComponent {
  @Input({ required: true }) evento!: Evento;
  @Input() inscrito = false;
  @Output() clicked = new EventEmitter<Evento>();
  @Output() inscribirse = new EventEmitter<Evento>();

  get disponibles(): number {
    return (this.evento.capacidadMaxima ?? 0) - (this.evento._count?.inscripciones ?? 0);
  }

  get fillPct(): number {
    if (!this.evento.capacidadMaxima) return 0;
    return Math.min(100, ((this.evento._count?.inscripciones ?? 0) / this.evento.capacidadMaxima) * 100);
  }

  get agotado(): boolean {
    return this.disponibles <= 0;
  }
}
