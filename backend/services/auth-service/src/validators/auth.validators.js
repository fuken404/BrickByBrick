const { z } = require('zod');

const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');

const registerBeneficiarioSchema = z.object({
  email:          z.string().email('Email inválido'),
  password:       passwordSchema,
  nombreCompleto: z.string().min(3).max(150),
  cedula:         z.string().min(6).max(20),
  fechaNacimiento:z.string().optional(),
  genero:         z.enum(['masculino','femenino','no_binario','prefiero_no_decir']).optional(),
  estrato:        z.coerce.number().int().min(1).max(6).nullish(),
  localidadId:    z.coerce.number().int().positive().nullish(),
});

const registerConstructoraSchema = z.object({
  email:              z.string().email('Email inválido'),
  password:           passwordSchema,
  razonSocial:        z.string().min(3).max(200),
  nit:                z.string().min(9).max(20),
  representanteLegal: z.string().max(150).optional(),
  cargoRepresentante: z.string().max(100).optional(),
  numEmpleados:       z.coerce.number().int().positive().nullish(),
  direccion:          z.string().max(500).optional(),
  localidadId:        z.coerce.number().int().positive().nullish(),
  descripcion:        z.string().max(2000).optional(),
});

const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

const resetPasswordSchema = z.object({
  password: passwordSchema,
});

module.exports = {
  registerBeneficiarioSchema,
  registerConstructoraSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
