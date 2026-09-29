import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snack = inject(MatSnackBar);

  exito(mensaje: string): void {
    this.snack.open(mensaje, 'Cerrar', { duration: 3500, panelClass: 'toast-exito' });
  }

  error(mensaje: string): void {
    this.snack.open(mensaje, 'Cerrar', { duration: 5000, panelClass: 'toast-error' });
  }

  info(mensaje: string, accion?: string, alAccionar?: () => void): void {
    const ref = this.snack.open(mensaje, accion ?? 'Cerrar', { duration: 6000, panelClass: 'toast-info' });
    if (alAccionar) ref.onAction().subscribe(alAccionar);
  }
}
