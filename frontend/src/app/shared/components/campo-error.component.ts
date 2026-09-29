import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { mensajeCampo } from '../validators/validadores';

/** Muestra el error de validación de un control cuando fue tocado. */
@Component({
  selector: 'app-campo-error',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    @if (mensaje()) {
      <span class="form-error" role="alert"><mat-icon>error_outline</mat-icon>{{ mensaje() }}</span>
    }
  `,
  styles: [':host { display: contents; } mat-icon { font-size: 14px; width: 14px; height: 14px; }'],
})
export class CampoErrorComponent {
  readonly control = input<AbstractControl | null>(null);
  readonly servidor = input<string | undefined>(undefined);

  mensaje(): string {
    return this.servidor() || mensajeCampo(this.control());
  }
}
