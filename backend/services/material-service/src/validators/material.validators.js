const { z } = require('zod');

const createMaterialSchema = z.object({
  categoriaId:       z.coerce.number().int().positive(),
  nombre:            z.string().min(3).max(200),
  descripcion:       z.string().max(2000).optional(),
  estadoMaterial:    z.enum(['nuevo', 'buen_estado', 'usado']),
  cantidad:          z.coerce.number().positive(),
  unidadMedida:      z.string().min(1).max(30),
  condicionesRetiro: z.string().max(1000).optional(),
  fechaLimite:       z.string().optional(),
  maxSolicitudes:    z.coerce.number().int().positive().optional(),
  estadoPublicacion: z.enum(['borrador', 'activo', 'pausado']).optional(),
});

const updateMaterialSchema = createMaterialSchema.partial();

const cambioEstadoSchema = z.object({
  estado: z.enum(['activo', 'pausado', 'borrador']),
});

const filtrosMaterialSchema = z.object({
  categoriaId:  z.string().optional(),
  localidadId:  z.string().optional(),
  estado:       z.enum(['nuevo', 'buen_estado', 'usado']).optional(),
  page:         z.string().optional(),
  limit:        z.string().optional(),
  q:            z.string().optional(),
}).optional();

module.exports = { createMaterialSchema, updateMaterialSchema, cambioEstadoSchema };
