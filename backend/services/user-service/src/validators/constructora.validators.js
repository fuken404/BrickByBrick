const { z } = require('zod');

const updateConstructoraSchema = z.object({
  razonSocial:        z.string().min(3).max(200).optional(),
  representanteLegal: z.string().max(150).optional(),
  cargoRepresentante: z.string().max(100).optional(),
  numEmpleados:       z.coerce.number().int().positive().nullish(),
  direccion:          z.string().max(500).optional(),
  localidadId:        z.number().int().positive().optional(),
  descripcion:        z.string().max(2000).optional(),
  sitioWeb:           z.string().url().optional().or(z.literal('')),
}).strict();

module.exports = { updateConstructoraSchema };
