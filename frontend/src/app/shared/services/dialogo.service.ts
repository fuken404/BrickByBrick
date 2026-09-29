import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, filter, map } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogoService {
  private readonly dialog = inject(MatDialog);

  private abrir(data: ConfirmDialogData): Observable<string | true | null | undefined> {
    return this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, string | true | null>(ConfirmDialogComponent, {
      data, panelClass: 'bbb-dialog', autoFocus: 'first-tabbable', width: '520px', maxWidth: '94vw',
    }).afterClosed();
  }

  /** Emite solo si el usuario confirma. */
  confirmar(data: Omit<ConfirmDialogData, 'campo'>): Observable<true> {
    return this.abrir(data).pipe(filter((r): r is true => r === true));
  }

  /** Pide un texto (motivo, instrucciones...) y lo emite si el usuario acepta. */
  pedirTexto(data: ConfirmDialogData & { campo: NonNullable<ConfirmDialogData['campo']> }): Observable<string> {
    return this.abrir(data).pipe(filter((r): r is string => typeof r === 'string'), map((r) => r));
  }
}
