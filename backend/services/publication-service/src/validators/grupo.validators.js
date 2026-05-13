const { z } = require('zod');

const createGrupoSchema = z.object({
  nombre:      z.string().min(3).max(150),
  descripcion: z.string().max(1000).optional(),
  temas:       z.array(z.string().max(80)).max(10).optional(),
});

const mensajeSchema = z.object({
  contenido:  z.string().min(1).max(3000),
  adjuntoUrl: z.string().url().optional(),
});

module.exports = { createGrupoSchema, mensajeSchema };
