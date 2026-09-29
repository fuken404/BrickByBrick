const { z } = require('zod');

const passwordSchema = z
  .string({ required_error: 'La contraseña es obligatoria' })
  .min(8, 'Mínimo 8 caracteres')
  .max(72, 'Máximo 72 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');

const emailSchema = z.string().trim().toLowerCase().email('Correo electrónico inválido').max(255);

const telefonoSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .refine((v) => /^(\+?57)?(3\d{9}|60\d{8})$/.test(v), 'Teléfono colombiano inválido (celular 3XXXXXXXXX o fijo 60XXXXXXXX)');

const opcionalVacio = (schema) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());

const esMayorDeEdad = (fecha) => {
  const f = new Date(fecha);
  if (Number.isNaN(f.getTime())) return false;
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 18);
  return f <= limite;
};

const registerBeneficiarioSchema = z.object({
  email:           emailSchema,
  password:        passwordSchema,
  nombreCompleto:  z.string().trim().min(3, 'Mínimo 3 caracteres').max(150),
  cedula:          z.string().trim().regex(/^\d{6,10}$/, 'La cédula debe tener entre 6 y 10 dígitos'),
  fechaNacimiento: z.string().refine(esMayorDeEdad, 'Debes ser mayor de 18 años'),
  genero:          opcionalVacio(z.enum(['masculino', 'femenino', 'no_binario', 'prefiero_no_decir'])),
  estrato:         opcionalVacio(z.coerce.number().int().min(1).max(6)),
  localidadId:     z.coerce.number({ invalid_type_error: 'Selecciona una localidad' }).int().positive('Selecciona una localidad'),
  telefono:        telefonoSchema,
  aceptaTerminos:  z.literal(true, { errorMap: () => ({ message: 'Debes aceptar los términos y la política de datos' }) }),
});

/** multipart/form-data: todos los campos llegan como string */
const registerConstructoraSchema = z.object({
  email:              emailSchema,
  password:           passwordSchema,
  razonSocial:        z.string().trim().min(3).max(200),
  nit:                z.string().trim()
    .transform((v) => v.replace(/[.\s]/g, ''))
    .refine((v) => /^\d{8,10}-?\d$/.test(v), 'NIT inválido (ej: 900123456-7)')
    .transform((v) => (v.includes('-') ? v : `${v.slice(0, -1)}-${v.slice(-1)}`)),
  representanteLegal: z.string().trim().min(3).max(150),
  cargoRepresentante: z.string().trim().min(2).max(100),
  numEmpleados:       opcionalVacio(z.coerce.number().int().positive()),
  direccion:          z.string().trim().min(5).max(300),
  localidadId:        z.coerce.number().int().positive('Selecciona una localidad'),
  telefono:           telefonoSchema,
  sitioWeb:           opcionalVacio(z.string().trim().url('URL inválida (incluye https://)')),
  descripcion:        opcionalVacio(z.string().trim().max(2000)),
  aceptaTerminos:     z.enum(['true'], { errorMap: () => ({ message: 'Debes aceptar los términos y la política de datos' }) }),
});

const loginSchema = z.object({
  email:    emailSchema,
  password: z.string().min(1, 'Contraseña requerida'),
});

const mfaVerifySchema = z.object({
  desafioId: z.string().uuid(),
  codigo:    z.string().regex(/^\d{6}$/, 'El código tiene 6 dígitos'),
});

const mfaResendSchema = z.object({ desafioId: z.string().uuid() });

const mfaToggleSchema = z.object({
  habilitar: z.boolean(),
  password:  z.string().min(1, 'Confirma tu contraseña'),
});

const forgotPasswordSchema = z.object({ email: emailSchema });

const resetPasswordSchema = z.object({ password: passwordSchema });

const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'Ingresa tu contraseña actual'),
  passwordNueva:  passwordSchema,
}).refine((d) => d.passwordActual !== d.passwordNueva, {
  message: 'La nueva contraseña debe ser distinta a la actual', path: ['passwordNueva'],
});

module.exports = {
  passwordSchema,
  registerBeneficiarioSchema,
  registerConstructoraSchema,
  loginSchema,
  mfaVerifySchema,
  mfaResendSchema,
  mfaToggleSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  cambiarPasswordSchema,
};
