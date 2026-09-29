import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../core/auth/auth.store';
import { UserApiService } from '../../core/services/user-api.service';
import { EstadisticasPublicas } from '../../core/models';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, MatIconModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  protected readonly auth = inject(AuthStore);
  /** Cifras reales de la plataforma; la sección no se muestra si el servicio no responde. */
  protected readonly stats = signal<EstadisticasPublicas | null>(null);
  protected readonly anio = new Date().getFullYear();

  readonly steps = [
    { number: '01', icon: 'inventory_2', title: 'Publica lo que puede servir.', description: 'Las constructoras comparten sus materiales excedentes con fotos, cantidades y condiciones de retiro.' },
    { number: '02', icon: 'search', title: 'Encuentra lo que hace falta.', description: 'Explora materiales y envía una solicitud según las necesidades de tu hogar o proyecto comunitario.' },
    { number: '03', icon: 'handshake', title: 'Conecta y construye.', description: 'Coordina la entrega con la empresa y dale un nuevo propósito a cada material que recibes.' },
  ];
  readonly materials = [
    { name: 'Ladrillos', label: 'ESTRUCTURA', style: 'bricks' },
    { name: 'Madera', label: 'VERSATILIDAD', style: 'wood' },
    { name: 'Cerámica', label: 'ACABADOS', style: 'tiles' },
    { name: 'Concreto', label: 'SOLIDEZ', style: 'concrete' },
  ];
  readonly beneficios = [
    { number: '01', icon: 'fact_check', title: 'Entregas trazables.', description: 'Apruebas cada solicitud, registras la entrega y el beneficiario confirma la recepción.' },
    { number: '02', icon: 'picture_as_pdf', title: 'Constancia por entrega.', description: 'Documento PDF con el material, la cantidad, el valor de referencia y el beneficiario.' },
    { number: '03', icon: 'calculate', title: 'Resumen anual estimado.', description: 'El 25 % del valor donado y su tope sobre el impuesto, listos para revisar con tu contador.' },
  ];

  constructor() {
    inject(UserApiService).estadisticasPublicas().subscribe({ next: (r) => this.stats.set(r.data), error: () => undefined });
  }
}
