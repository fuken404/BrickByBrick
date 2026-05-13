const { z } = require('zod');

const createSolicitudSchema = z.object({
  cantidadSolicitada:  z.number().positive(),
  propositoUso:        z.string().max(200).optional(),
  descripcionProyecto: z.string().max(2000).optional(),
});

const cambioEstadoSolicitudSchema = z.object({
  estado:              z.enum(['aprobada', 'rechazada', 'entregada']),
  instruccionesRetiro: z.string().max(1000).optional(),
});

const calificacionSchema = z.object({
  calificacion:            z.number().int().min(1).max(5),
  comentarioCalificacion:  z.string().max(1000).optional(),
});

module.exports = { createSolicitudSchema, cambioEstadoSolicitudSchema, calificacionSchema };
