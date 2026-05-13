const { z } = require('zod');

const eventoBaseSchema = z.object({
  nombre:         z.string().min(3).max(200),
  tipoEvento:     z.enum(['entrega_masiva', 'taller', 'feria', 'otro']),
  descripcion:    z.string().max(3000).optional(),
  fechaInicio:    z.coerce.date(),
  fechaFin:       z.coerce.date(),
  direccion:      z.string().max(500).optional(),
  localidadId:    z.coerce.number().int().positive().optional(),
  capacidadMaxima:z.coerce.number().int().positive().optional(),
  estado:         z.enum(['borrador', 'publicado', 'cancelado', 'finalizado']).optional(),
});

const createEventoSchema = eventoBaseSchema.refine(
  (d) => new Date(d.fechaFin) >= new Date(d.fechaInicio),
  { message: 'La fecha de fin debe ser igual o posterior a la de inicio', path: ['fechaFin'] }
);

const updateEventoSchema = eventoBaseSchema.partial();

const asistenciaSchema = z.object({
  inscritos: z.array(z.object({ id: z.string().uuid(), asistio: z.boolean() })),
});

module.exports = { createEventoSchema, updateEventoSchema, asistenciaSchema };
