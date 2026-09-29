import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Material } from '../../../core/models';
import { FechaRelativaPipe } from '../../pipes/fecha-relativa.pipe';
import { UploadUrlPipe } from '../../pipes/upload-url.pipe';
import { EstadoBadgePipe } from '../../pipes/estado-badge.pipe';
import { formatearDia } from '../../../core/utils/fechas';

@Component({
  selector: 'app-material-card',
  standalone: true,
  imports: [MatIconModule, DecimalPipe, FechaRelativaPipe, UploadUrlPipe, EstadoBadgePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './material-card.component.html',
  styleUrl: './material-card.component.scss',
})
export class MaterialCardComponent {
  readonly material = input.required<Material>();
  readonly abrir = output<Material>();

  protected readonly color = computed(() => this.material().categoria?.colorHex ?? '#6B6B6B');
  protected readonly fondo = computed(() => `linear-gradient(145deg, ${this.color()}18 0%, ${this.color()}38 100%)`);
  protected readonly vence = computed(() => formatearDia(this.material().fechaLimite));
}
