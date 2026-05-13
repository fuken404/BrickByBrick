const { z } = require('zod');

const createPublicacionSchema = z.object({
  tipo:        z.enum(['reutilizacion', 'tutorial', 'proyecto', 'noticia', 'recurso']),
  titulo:      z.string().min(3).max(300),
  contenido:   z.string().min(10),
  visibilidad: z.enum(['publica', 'grupo']).default('publica'),
});

const updatePublicacionSchema = createPublicacionSchema
  .extend({ estado: z.enum(['publicada', 'suspendida', 'eliminada']).optional() })
  .partial();

const comentarioSchema = z.object({
  contenido: z.string().min(1).max(2000),
  parentId:  z.string().uuid().optional(),
});

const reporteSchema = z.object({
  tipoContenido: z.enum(['publicacion', 'material', 'comentario', 'usuario']),
  contenidoId:   z.string().uuid(),
  motivo:        z.string().min(10).max(500),
});

module.exports = { createPublicacionSchema, updatePublicacionSchema, comentarioSchema, reporteSchema };
