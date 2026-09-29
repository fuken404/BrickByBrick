const { z } = require('zod');

const opcionalVacio = (schema) =>
  z.preprocess((v) => (v === '' ? null : v), schema.nullish());

const fechaFutura = z.string().refine((v) => {
  const f = new Date(`${v.slice(0, 10)}T23:59:59-05:00`);
  return !Number.isNaN(f.getTime()) && f >= new Date();
}, 'La fecha límite debe ser hoy o posterior');

const baseMaterial = {
  categoriaId:       z.coerce.number({ invalid_type_error: 'Selecciona una categoría' }).int().positive('Selecciona una categoría'),
  nombre:            z.string().trim().min(3, 'Mínimo 3 caracteres').max(200),
  descripcion:       opcionalVacio(z.string().trim().max(2000)),
  estadoMaterial:    z.enum(['nuevo', 'buen_estado', 'usado']),
  cantidad:          z.coerce.number().positive('La cantidad debe ser mayor a 0').max(10_000_000),
  unidadMedida:      z.string().trim().min(1).max(30),
  valorUnitarioCop:  opcionalVacio(z.coerce.number().min(0).max(1_000_000_000)),
  condicionesRetiro: opcionalVacio(z.string().trim().max(1000)),
  fechaLimite:       opcionalVacio(fechaFutura),
  maxSolicitudes:    opcionalVacio(z.coerce.number().int().positive().max(10000)),
};

const createMaterialSchema = z.object({
  ...baseMaterial,
  estadoPublicacion: z.enum(['borrador', 'activo']).default('borrador'),
}).strict();

const updateMaterialSchema = z.object(baseMaterial).partial().strict();

const cambioEstadoSchema = z.object({
  estado: z.enum(['activo', 'pausado', 'borrador']),
}).strict();

const filtrosMaterialSchema = z.object({
  q:              z.string().trim().max(100).optional(),
  categoriaId:    z.coerce.number().int().positive().optional(),
  localidadId:    z.coerce.number().int().positive().optional(),
  constructoraId: z.string().uuid().optional(),
  estadoMaterial: z.enum(['nuevo', 'buen_estado', 'usado']).optional(),
  estadoPublicacion: z.enum(['borrador', 'activo', 'pausado', 'agotado', 'vencido']).optional(),
  orden:          z.enum(['recientes', 'vencen', 'cantidad']).default('recientes'),
  page:           z.string().optional(),
  limit:          z.string().optional(),
});

const categoriaSchema = z.object({
  nombre:   z.string().trim().min(2).max(60),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hexadecimal inválido (#RRGGBB)'),
  icono:    z.string().trim().regex(/^[a-z0-9_]{2,60}$/, 'Nombre de ícono Material inválido'),
}).strict();

module.exports = {
  createMaterialSchema,
  updateMaterialSchema,
  cambioEstadoSchema,
  filtrosMaterialSchema,
  categoriaSchema,
};
