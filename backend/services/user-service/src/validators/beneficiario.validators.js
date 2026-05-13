const { z } = require('zod');

const updateBeneficiarioSchema = z.object({
  nombreCompleto:  z.string().min(3).max(150).optional(),
  fechaNacimiento: z.string().optional(),
  genero:          z.enum(['masculino','femenino','no_binario','prefiero_no_decir']).optional(),
  estrato:         z.number().int().min(1).max(6).optional(),
  localidadId:     z.number().int().positive().optional(),
}).strict();

module.exports = { updateBeneficiarioSchema };
