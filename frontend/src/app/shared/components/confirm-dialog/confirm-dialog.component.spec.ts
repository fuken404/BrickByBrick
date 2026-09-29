import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

function montar(data: ConfirmDialogData) {
  const close = vi.fn();
  TestBed.configureTestingModule({
    imports: [ConfirmDialogComponent],
    providers: [{ provide: MAT_DIALOG_DATA, useValue: data }, { provide: MatDialogRef, useValue: { close } }],
  });
  const fixture = TestBed.createComponent(ConfirmDialogComponent);
  fixture.detectChanges();
  const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
  const enviar = () => {
    const evento = new Event('submit', { cancelable: true });
    form.dispatchEvent(evento);
    return evento;
  };
  return { fixture, close, enviar };
}

describe('ConfirmDialogComponent', () => {
  it('al enviar no recarga la página y confirma', () => {
    const { close, enviar } = montar({ titulo: 'Eliminar', mensaje: '¿Seguro?' });
    const evento = enviar();
    expect(evento.defaultPrevented).toBe(true);
    expect(close).toHaveBeenCalledWith(true);
  });

  it('con campo de texto valida el mínimo y devuelve el texto', () => {
    const { fixture, close, enviar } = montar({ titulo: 'Rechazar', mensaje: '', campo: { etiqueta: 'Motivo', minimo: 5 } });
    const area = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    area.value = 'no';
    area.dispatchEvent(new Event('input'));
    enviar();
    expect(close).not.toHaveBeenCalled();

    area.value = '  Material comprometido  ';
    area.dispatchEvent(new Event('input'));
    enviar();
    expect(close).toHaveBeenCalledWith('Material comprometido');
  });

  it('usa el valor inicial del campo', () => {
    const { close, enviar } = montar({ titulo: 'Aprobar', mensaje: '', campo: { etiqueta: 'Instrucciones', minimo: 10, valorInicial: 'Retiro en obra de 8 a 16 h' } });
    enviar();
    expect(close).toHaveBeenCalledWith('Retiro en obra de 8 a 16 h');
  });
});
