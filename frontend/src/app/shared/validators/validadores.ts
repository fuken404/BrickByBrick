import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Mismas reglas de contraseña que el backend. */
export const passwordFuerte: ValidatorFn = (c: AbstractControl<string>): ValidationErrors | null => {
  const v = c.value ?? '';
  if (!v) return null;
  const errores: string[] = [];
  if (v.length < 8) errores.push('mínimo 8 caracteres');
  if (!/[A-Z]/.test(v)) errores.push('una mayúscula');
  if (!/[a-z]/.test(v)) errores.push('una minúscula');
  if (!/[0-9]/.test(v)) errores.push('un número');
  return errores.length ? { passwordDebil: `Debe tener ${errores.join(', ')}` } : null;
};

/** Nivel 0–4 para el medidor visual. */
export function nivelPassword(v: string): number {
  if (!v) return 0;
  return [v.length >= 8, /[A-Z]/.test(v) && /[a-z]/.test(v), /[0-9]/.test(v), /[^A-Za-z0-9]/.test(v) || v.length >= 12].filter(Boolean).length;
}

/** Compara dos campos del mismo grupo. */
export function coinciden(campo: string, confirmacion: string): ValidatorFn {
  return (g: AbstractControl): ValidationErrors | null => {
    const a = g.get(campo)?.value;
    const b = g.get(confirmacion)?.value;
    return a && b && a !== b ? { noCoinciden: true } : null;
  };
}

export const telefonoColombia: ValidatorFn = (c: AbstractControl<string>) => {
  const v = (c.value ?? '').replace(/[\s()-]/g, '');
  if (!v) return null;
  return /^(\+?57)?(3\d{9}|60\d{8})$/.test(v) ? null : { telefono: 'Celular (3XXXXXXXXX) o fijo (60XXXXXXXX)' };
};

export const mayorDeEdad: ValidatorFn = (c: AbstractControl<string>) => {
  if (!c.value) return null;
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 18);
  return new Date(c.value) <= limite ? null : { menor: 'Debes ser mayor de 18 años' };
};

export const nitValido: ValidatorFn = (c: AbstractControl<string>) => {
  const v = (c.value ?? '').replace(/[.\s]/g, '');
  if (!v) return null;
  return /^\d{8,10}-?\d$/.test(v) ? null : { nit: 'NIT inválido (ej: 900123456-7)' };
};

/** Mensaje del primer error de un control para mostrar bajo el campo. */
export function mensajeCampo(c: AbstractControl | null): string {
  if (!c || !c.errors || !(c.touched || c.dirty)) return '';
  const e = c.errors;
  if (e['required']) return 'Este campo es obligatorio';
  if (e['email']) return 'Correo electrónico inválido';
  if (e['minlength']) return `Mínimo ${e['minlength'].requiredLength} caracteres`;
  if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres`;
  if (e['min']) return `El valor mínimo es ${e['min'].min}`;
  if (e['max']) return `El valor máximo es ${e['max'].max}`;
  if (e['pattern']) return 'Formato inválido';
  const texto = Object.values(e).find((v) => typeof v === 'string');
  return (texto as string) ?? 'Valor inválido';
}
