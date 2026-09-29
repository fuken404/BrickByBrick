const { z } = require('zod');

const opcionalVacio = (schema) =>
  z.preprocess((v) => (v === '' ? null : v), schema.nullish());

const baseEvento = {
  nombre:          z.string().trim().min(5, 'Mínimo 5 caracteres').max(200),
  tipoEvento:      z.enum(['entrega_masiva', 'taller', 'feria', 'otro']),
  descripcion:     opcionalVacio(z.string().trim().max(3000)),
  fechaInicio:     z.coerce.date({ invalid_type_error: 'Fecha de inicio inválida' }),
  fechaFin:        z.coerce.date({ invalid_type_error: 'Fecha de fin inválida' }),
  direccion:       z.string().trim().min(5, 'Indica la dirección del evento').max(300),
  localidadId:     z.coerce.number().int().positive('Selecciona la localidad'),
  capacidadMaxima: opcionalVacio(z.coerce.number().int().positive().max(100000)),
  materialIds:     z.array(z.string().uuid()).max(30).optional(),
};

const fechasCoherentes = (d) => !d.fechaInicio || !d.fechaFin || d.fechaFin > d.fechaInicio;
const mensajeFechas = { message: 'La fecha de fin debe ser posterior a la de inicio', path: ['fechaFin'] };

const createEventoSchema = z.object({ ...baseEvento, estado: z.enum(['borrador', 'publicado']).default('borrador') })
  .strict()
  .refine(fechasCoherentes, mensajeFechas);

const updateEventoSchema = z.object(baseEvento).partial().strict().refine(fechasCoherentes, mensajeFechas);

const cambioEstadoSchema = z.object({
  estado: z.enum(['publicado', 'en_curso', 'finalizado', 'cancelado']),
  motivo: z.string().trim().max(500).optional(),
}).strict().refine((d) => d.estado !== 'cancelado' || (d.motivo && d.motivo.length >= 5), {
  message: 'Indica el motivo de la cancelación', path: ['motivo'],
});

const asistenciaSchema = z.object({
  inscripciones: z.array(z.object({ id: z.string().uuid(), asistio: z.boolean() })).min(1).max(1000),
}).strict();

const filtrosEventoSchema = z.object({
  q:           z.string().trim().max(100).optional(),
  tipoEvento:  z.enum(['entrega_masiva', 'taller', 'feria', 'otro']).optional(),
  localidadId: z.coerce.number().int().positive().optional(),
  estado:      z.enum(['borrador', 'publicado', 'en_curso', 'finalizado', 'cancelado']).optional(),
  alcance:     z.enum(['proximos', 'pasados', 'todos']).default('proximos'),
  page:        z.string().optional(),
  limit:       z.string().optional(),
});

module.exports = {
  createEventoSchema, updateEventoSchema, cambioEstadoSchema, asistenciaSchema, filtrosEventoSchema,
};
