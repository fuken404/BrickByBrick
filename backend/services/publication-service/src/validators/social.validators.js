const { z } = require('zod');

const TIPOS = ['reutilizacion', 'tutorial', 'proyecto', 'producto', 'noticia', 'recurso'];
const vacioAUndefined = (schema) => z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());

/** multipart/form-data: los campos llegan como string */
const createPublicacionSchema = z.object({
  tipo:        z.enum(TIPOS, { errorMap: () => ({ message: 'Selecciona el tipo de publicación' }) }),
  titulo:      vacioAUndefined(z.string().trim().min(3).max(300)),
  contenido:   z.string().trim().min(10, 'Escribe al menos 10 caracteres').max(5000),
  materialIds: vacioAUndefined(z.preprocess(
    (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v),
    z.array(z.string().uuid()).max(10),
  )),
});

const updatePublicacionSchema = z.object({
  tipo:      z.enum(TIPOS).optional(),
  titulo:    z.string().trim().max(300).nullish(),
  contenido: z.string().trim().min(10).max(5000).optional(),
}).strict();

const repostSchema = z.object({
  comentario: vacioAUndefined(z.string().trim().max(1000)),
}).strict();

const moderacionSchema = z.object({
  estado: z.enum(['publicada', 'suspendida']),
  motivo: z.string().trim().max(500).optional(),
}).strict().refine((d) => d.estado === 'publicada' || (d.motivo && d.motivo.length >= 5), {
  message: 'Indica el motivo de la suspensión', path: ['motivo'],
});

const filtrosPublicacionSchema = z.object({
  feed:    z.enum(['todos', 'siguiendo']).default('todos'),
  tipo:    z.enum(TIPOS).optional(),
  q:       z.string().trim().max(100).optional(),
  autorId: z.string().uuid().optional(),
  estado:  z.enum(['publicada', 'suspendida']).optional(),
  page:    z.string().optional(),
  limit:   z.string().optional(),
});

const comentarioSchema = z.object({
  contenido: z.string().trim().min(1, 'Escribe un comentario').max(2000),
  parentId:  z.string().uuid().optional(),
}).strict();

const editarComentarioSchema = z.object({
  contenido: z.string().trim().min(1).max(2000),
}).strict();

const reporteSchema = z.object({
  tipoContenido: z.enum(['publicacion', 'material', 'comentario', 'usuario']),
  contenidoId:   z.string().uuid(),
  motivo:        z.string().trim().min(10, 'Describe el motivo (mínimo 10 caracteres)').max(500),
}).strict();

const resolverReporteSchema = z.object({
  accion:     z.enum(['ocultar', 'ignorar']),
  resolucion: z.string().trim().min(5, 'Describe la resolución').max(500),
}).strict();

const grupoSchema = z.object({
  nombre:      z.string().trim().min(3).max(150),
  descripcion: vacioAUndefined(z.string().trim().max(1000)),
  privacidad:  z.enum(['publico', 'privado']).default('publico'),
  temas:       z.array(z.string().trim().min(2).max(80)).max(10).default([]),
}).strict();

const updateGrupoSchema = grupoSchema.partial().strict();

const gestionMiembroSchema = z.object({
  accion: z.enum(['aprobar', 'rechazar', 'expulsar', 'hacer_admin', 'quitar_admin']),
}).strict();

const invitacionSchema = z.object({ usuarioId: z.string().uuid() }).strict();

const mensajeSchema = z.object({
  contenido: z.string().trim().min(1, 'Escribe un mensaje').max(3000),
}).strict();

const conversacionSchema = z.object({ usuarioId: z.string().uuid() }).strict();

const cursorSchema = z.object({
  antes: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});

module.exports = {
  createPublicacionSchema, updatePublicacionSchema, repostSchema, moderacionSchema, filtrosPublicacionSchema,
  comentarioSchema, editarComentarioSchema, reporteSchema, resolverReporteSchema,
  grupoSchema, updateGrupoSchema, gestionMiembroSchema, invitacionSchema, mensajeSchema,
  conversacionSchema, cursorSchema,
};
