import { FormControl, FormGroup } from '@angular/forms';
import { coinciden, mayorDeEdad, nitValido, passwordFuerte, telefonoColombia } from './validadores';

describe('validadores', () => {
  it('passwordFuerte replica las reglas del backend', () => {
    expect(passwordFuerte(new FormControl('Segura123'))).toBeNull();
    expect(passwordFuerte(new FormControl('corta'))).toHaveProperty('passwordDebil');
  });

  it('telefonoColombia acepta celulares y fijos nacionales', () => {
    expect(telefonoColombia(new FormControl('300 123 4567'))).toBeNull();
    expect(telefonoColombia(new FormControl('6015551234'))).toBeNull();
    expect(telefonoColombia(new FormControl('12345'))).not.toBeNull();
  });

  it('nitValido exige dígito de verificación', () => {
    expect(nitValido(new FormControl('900123456-7'))).toBeNull();
    expect(nitValido(new FormControl('12-3'))).not.toBeNull();
  });

  it('mayorDeEdad', () => {
    expect(mayorDeEdad(new FormControl('1990-01-01'))).toBeNull();
    expect(mayorDeEdad(new FormControl(new Date().toISOString().slice(0, 10)))).not.toBeNull();
  });

  it('coinciden compara dos campos', () => {
    const g = new FormGroup({ a: new FormControl('x'), b: new FormControl('y') }, { validators: coinciden('a', 'b') });
    expect(g.hasError('noCoinciden')).toBe(true);
    g.controls.b.setValue('x');
    expect(g.hasError('noCoinciden')).toBe(false);
  });
});
