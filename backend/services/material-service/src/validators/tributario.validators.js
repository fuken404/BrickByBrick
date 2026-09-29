const { z } = require('zod');

const anioActual = () => new Date().getFullYear();

const resumenSchema = z.object({
  anio:              z.coerce.number().int().min(2020).max(2100).default(anioActual),
  impuestoEstimado:  z.coerce.number().min(0).optional(),
  constructoraId:    z.string().uuid().optional(), // solo administrador
});

module.exports = { resumenSchema };
