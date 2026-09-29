import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../core/auth/auth.store';
import { UserApiService } from '../../core/services/user-api.service';
import { MaterialApiService } from '../../core/services/material-api.service';
import { EstadisticasPublicas, Material } from '../../core/models';

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
  protected readonly stats = signal<EstadisticasPublicas | null>(null);
  protected readonly materiales = signal<Material[]>([]);
  protected readonly anio = new Date().getFullYear();

  protected readonly pasos = [
    { icon: 'business', title: 'Las constructoras publican excedentes', desc: 'Registran el material sobrante con fotos, cantidad, valor de referencia y condiciones de retiro.', color: '#C0392B', bg: 'rgba(192,57,43,.08)' },
    { icon: 'search', title: 'Los beneficiarios solicitan lo que necesitan', desc: 'Exploran el catálogo por categoría y localidad, y cuentan para qué usarán el material.', color: '#2E86AB', bg: 'rgba(46,134,171,.08)' },
    { icon: 'fact_check', title: 'Entrega trazable y constancia', desc: 'La empresa aprueba, entrega y obtiene la constancia de donación; el beneficiario confirma la recepción.', color: '#27AE60', bg: 'rgba(39,174,96,.08)' },
  ];

  protected readonly beneficiosTributarios = [
    { icon: 'calculate', title: 'Estimación del descuento', desc: 'Calculamos el 25 % del valor donado y el tope sobre tu impuesto de renta.' },
    { icon: 'picture_as_pdf', title: 'Constancia por cada entrega', desc: 'Documento PDF con el material, el valor de referencia y el beneficiario.' },
    { icon: 'timeline', title: 'Resumen anual', desc: 'Todas tus donaciones del año listas para tu contador.' },
  ];

  constructor() {
    inject(UserApiService).estadisticasPublicas().subscribe({ next: (r) => this.stats.set(r.data), error: () => undefined });
    inject(MaterialApiService).catalogo({ limit: 4 }).subscribe({ next: (r) => this.materiales.set(r.data.items), error: () => undefined });
  }
}
