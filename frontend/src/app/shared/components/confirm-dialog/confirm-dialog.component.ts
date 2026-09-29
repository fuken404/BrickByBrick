import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  titulo: string;
  mensaje: string;
  confirmar?: string;
  cancelar?: string;
  peligroso?: boolean;
  /** Si se define, se pide un texto (motivo, instrucciones...). */
  campo?: { etiqueta: string; placeholder?: string; minimo?: number; requerido?: boolean; valorInicial?: string };
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="dialog" (submit)="$event.preventDefault(); aceptar()">
      <h2>{{ data.titulo }}</h2>
      <p class="muted pre-line">{{ data.mensaje }}</p>
      @if (data.campo) {
        <div class="form-group">
          <label class="form-label" for="dialog-campo">{{ data.campo.etiqueta }}</label>
          <textarea id="dialog-campo" class="form-textarea" rows="3" [formControl]="texto"
                    [placeholder]="data.campo.placeholder ?? ''" cdkFocusInitial></textarea>
          @if (texto.touched && texto.invalid) {
            <span class="form-error"><mat-icon>error_outline</mat-icon>
              {{ data.campo.minimo ? 'Escribe al menos ' + data.campo.minimo + ' caracteres' : 'Este campo es obligatorio' }}
            </span>
          }
        </div>
      }
      <div class="dialog-actions">
        <button type="button" class="btn btn-ghost" (click)="ref.close(null)">{{ data.cancelar ?? 'Cancelar' }}</button>
        <button type="submit" class="btn" [class.btn-danger]="data.peligroso" [class.btn-primary]="!data.peligroso">
          {{ data.confirmar ?? 'Confirmar' }}
        </button>
      </div>
    </form>
  `,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject<MatDialogRef<ConfirmDialogComponent, string | true | null>>(MatDialogRef);
  protected readonly texto = new FormControl(this.data.campo?.valorInicial ?? '', {
    nonNullable: true,
    validators: this.data.campo?.requerido === false
      ? [Validators.minLength(this.data.campo?.minimo ?? 0)]
      : [Validators.required, Validators.minLength(this.data.campo?.minimo ?? 1)],
  });

  aceptar(): void {
    if (!this.data.campo) {
      this.ref.close(true);
      return;
    }
    this.texto.markAsTouched();
    if (this.texto.invalid) return;
    this.ref.close(this.texto.value.trim());
  }
}
