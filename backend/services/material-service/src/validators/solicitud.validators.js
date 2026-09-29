const { z } = require('zod');

const createSolicitudSchema = z.object({
  cantidadSolicitada:  z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  propositoUso:        z.string().trim().min(5, 'Describe brevemente el uso (mínimo 5 caracteres)').max(200),
  descripcionProyecto: z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().max(2000).optional()),
}).strict();

const cambioEstadoSolicitudSchema = z.object({
  estado:              z.enum(['aprobada', 'rechazada', 'entregada', 'cancelada']),
  instruccionesRetiro: z.string().trim().max(1000).optional(),
  motivo:              z.string().trim().max(500).optional(),
}).strict()
  .refine((d) => d.estado !== 'aprobada' || (d.instruccionesRetiro && d.instruccionesRetiro.length >= 10), {
    message: 'Indica las instrucciones de retiro (mínimo 10 caracteres)', path: ['instruccionesRetiro'],
  })
  .refine((d) => !['rechazada', 'cancelada'].includes(d.estado) || (d.motivo && d.motivo.length >= 5), {
    message: 'Indica el motivo (mínimo 5 caracteres)', path: ['motivo'],
  });

const cancelarSchema = z.object({
  motivo: z.string().trim().max(500).optional(),
}).strict();

const calificacionSchema = z.object({
  calificacion:           z.coerce.number().int().min(1).max(5),
  comentarioCalificacion: z.string().trim().max(1000).optional(),
}).strict();

const confirmarRecepcionSchema = calificacionSchema.partial().strict();

const filtrosSolicitudSchema = z.object({
  estado:     z.enum(['pendiente', 'aprobada', 'rechazada', 'entregada', 'cancelada']).optional(),
  materialId: z.string().uuid().optional(),
  page:       z.string().optional(),
  limit:      z.string().optional(),
});

module.exports = {
  createSolicitudSchema,
  cambioEstadoSolicitudSchema,
  cancelarSchema,
  calificacionSchema,
  confirmarRecepcionSchema,
  filtrosSolicitudSchema,
};
