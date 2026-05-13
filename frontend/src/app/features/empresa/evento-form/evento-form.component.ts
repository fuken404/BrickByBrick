import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { EventApiService } from '../../../core/services/event-api.service';
import { Evento, TipoEvento } from '../../../core/models';

@Component({
  selector: 'app-evento-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <nav class="breadcrumb">
        <a routerLink="/empresa/eventos" class="bc-link">
          <mat-icon>arrow_back</mat-icon> Eventos
        </a>
      </nav>
      <h1 class="page-title">{{ editando() ? 'Editar evento' : 'Crear evento' }}</h1>

      @if (loadingEvento()) {
        <div class="loading-wrap"><div class="spinner"></div></div>
      } @else {
        <div class="form-card card">
          <div class="form-grid">
            <div class="form-group span-2">
              <label class="form-label">Nombre del evento *</label>
              <input type="text" class="form-control" [(ngModel)]="form.nombre"
                     placeholder="Ej: Entrega de materiales — Localidad Rafael Uribe" />
            </div>

            <div class="form-group">
              <label class="form-label">Tipo de evento *</label>
              <select class="form-control" [(ngModel)]="form.tipoEvento">
                <option value="entrega_masiva">Entrega masiva</option>
                <option value="taller">Taller</option>
                <option value="feria">Feria</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Capacidad máxima</label>
              <input type="number" class="form-control" [(ngModel)]="form.capacidadMaxima"
                     min="1" placeholder="Sin límite" />
            </div>

            <div class="form-group">
              <label class="form-label">Fecha y hora de inicio *</label>
              <input type="datetime-local" class="form-control" [(ngModel)]="form.fechaInicio" />
            </div>

            <div class="form-group">
              <label class="form-label">Fecha y hora de fin *</label>
              <input type="datetime-local" class="form-control" [(ngModel)]="form.fechaFin" />
            </div>

            <div class="form-group span-2">
              <label class="form-label">Dirección</label>
              <input type="text" class="form-control" [(ngModel)]="form.direccion"
                     placeholder="Ej: Calle 13 #28-10, Bogotá" />
            </div>

            <div class="form-group span-2">
              <label class="form-label">Descripción</label>
              <textarea class="form-control" [(ngModel)]="form.descripcion" rows="4"
                        placeholder="Describe el evento, qué se entregará, cómo participar..."></textarea>
            </div>
          </div>

          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }
          @if (exito()) {
            <div class="alert alert-success">Evento guardado. Redirigiendo…</div>
          }

          <div class="form-actions">
            <a routerLink="/empresa/eventos" class="btn btn-ghost">Cancelar</a>
            <button class="btn btn-ghost" (click)="guardar('borrador')" [disabled]="guardando()">
              Guardar borrador
            </button>
            <button class="btn btn-primary" (click)="guardar('publicado')" [disabled]="guardando()">
              {{ guardando() ? 'Publicando...' : 'Publicar' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './evento-form.component.scss',
})
export class EventoFormComponent implements OnInit {
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly eventSvc = inject(EventApiService);

  readonly editando      = signal(false);
  readonly loadingEvento = signal(false);
  readonly guardando     = signal(false);
  readonly error         = signal('');
  readonly exito         = signal(false);

  private eventoId: string | null = null;

  form = {
    nombre: '',
    tipoEvento: 'entrega_masiva' as TipoEvento,
    capacidadMaxima: null as number | null,
    fechaInicio: '',
    fechaFin: '',
    direccion: '',
    descripcion: '',
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventoId = id;
      this.editando.set(true);
      this.loadingEvento.set(true);

      this.eventSvc.getById(id).subscribe({
        next: r => {
          const e = r.data;
          this.form = {
            nombre:          e.nombre,
            tipoEvento:      e.tipoEvento,
            capacidadMaxima: e.capacidadMaxima ?? null,
            fechaInicio:     e.fechaInicio.slice(0, 16),
            fechaFin:        e.fechaFin.slice(0, 16),
            direccion:       e.direccion ?? '',
            descripcion:     e.descripcion ?? '',
          };
          this.loadingEvento.set(false);
        },
        error: () => this.loadingEvento.set(false),
      });
    }
  }

  guardar(estado: 'publicado' | 'borrador') {
    if (!this.form.nombre.trim())   { this.error.set('El nombre es requerido.');           return; }
    if (!this.form.fechaInicio)     { this.error.set('La fecha de inicio es requerida.');  return; }
    if (!this.form.fechaFin)        { this.error.set('La fecha de fin es requerida.');     return; }

    this.guardando.set(true);
    this.error.set('');

    const payload: Partial<Evento> = {
      nombre:          this.form.nombre,
      tipoEvento:      this.form.tipoEvento,
      capacidadMaxima: this.form.capacidadMaxima ?? undefined,
      fechaInicio:     this.form.fechaInicio,
      fechaFin:        this.form.fechaFin,
      direccion:       this.form.direccion || undefined,
      descripcion:     this.form.descripcion || undefined,
      estado,
    };

    const obs = this.editando() && this.eventoId
      ? this.eventSvc.update(this.eventoId, payload)
      : this.eventSvc.create(payload);

    obs.subscribe({
      next: () => {
        this.exito.set(true);
        this.guardando.set(false);
        setTimeout(() => this.router.navigate(['/empresa/eventos']), 1500);
      },
      error: e => {
        this.guardando.set(false);
        this.error.set(e.error?.message ?? 'Error al guardar el evento.');
      },
    });
  }
}
