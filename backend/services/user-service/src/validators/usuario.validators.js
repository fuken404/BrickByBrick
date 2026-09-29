const { z } = require('zod');

const opcionalVacio = (schema) =>
  z.preprocess((v) => (v === '' ? null : v), schema.nullish());

const telefonoSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .refine((v) => /^(\+?57)?(3\d{9}|60\d{8})$/.test(v), 'Teléfono colombiano inválido');

const generoSchema = z.enum(['masculino', 'femenino', 'no_binario', 'prefiero_no_decir']);

const actualizarMeSchema = z.object({
  telefono: telefonoSchema.optional(),
  preferenciasNotif: z.object({ email: z.boolean(), inApp: z.boolean() }).optional(),
}).strict();

const eliminarCuentaSchema = z.object({
  password: z.string().min(1, 'Confirma tu contraseña'),
  confirmacion: z.literal('ELIMINAR', { errorMap: () => ({ message: 'Escribe ELIMINAR para confirmar' }) }),
});

const updateBeneficiarioSchema = z.object({
  nombreCompleto:  z.string().trim().min(3).max(150).optional(),
  fechaNacimiento: z.string().optional(),
  genero:          opcionalVacio(generoSchema),
  estrato:         opcionalVacio(z.coerce.number().int().min(1).max(6)),
  localidadId:     opcionalVacio(z.coerce.number().int().positive()),
}).strict();

/** Solo el administrador puede corregir la cédula. */
const adminUpdateBeneficiarioSchema = updateBeneficiarioSchema.extend({
  cedula: z.string().trim().regex(/^\d{6,10}$/, 'Cédula inválida').optional(),
}).strict();

const portafolioSchema = z.object({
  nombreEmprendimiento: opcionalVacio(z.string().trim().min(2).max(150)),
  bioPublica:           opcionalVacio(z.string().trim().max(1000)),
  portafolioPublico:    z.boolean(),
}).strict();

const updateConstructoraSchema = z.object({
  razonSocial:        z.string().trim().min(3).max(200).optional(),
  representanteLegal: opcionalVacio(z.string().trim().max(150)),
  cargoRepresentante: opcionalVacio(z.string().trim().max(100)),
  numEmpleados:       opcionalVacio(z.coerce.number().int().positive()),
  direccion:          opcionalVacio(z.string().trim().max(300)),
  localidadId:        opcionalVacio(z.coerce.number().int().positive()),
  descripcion:        opcionalVacio(z.string().trim().max(2000)),
  sitioWeb:           opcionalVacio(z.string().trim().url('URL inválida (incluye https://)')),
}).strict();

const adminUpdateConstructoraSchema = updateConstructoraSchema.extend({
  nit: z.string().trim().regex(/^\d{8,10}-\d$/, 'NIT inválido (ej: 900123456-7)').optional(),
}).strict();

const documentoSchema = z.object({
  tipo: z.enum(['rut', 'camara_comercio'], { errorMap: () => ({ message: 'Tipo de documento inválido' }) }),
  fechaVencimiento: z.string().optional(),
});

// ---------------- Admin ----------------

const listarUsuariosSchema = z.object({
  q:      z.string().trim().max(100).optional(),
  rol:    z.enum(['BENEFICIARIO', 'CONSTRUCTORA', 'ADMINISTRADOR']).optional(),
  estado: z.enum(['activo', 'inactivo', 'suspendido']).optional(),
  page:   z.string().optional(),
  limit:  z.string().optional(),
});

const cambiarEstadoUsuarioSchema = z.object({
  estado: z.enum(['activo', 'suspendido']),
  motivo: z.string().trim().min(5, 'Indica el motivo (mínimo 5 caracteres)').max(500).optional(),
}).refine((d) => d.estado !== 'suspendido' || Boolean(d.motivo), {
  message: 'Indica el motivo de la suspensión', path: ['motivo'],
});

const verificacionSchema = z.object({
  aprobar: z.boolean(),
  motivo:  z.string().trim().max(500).optional(),
}).refine((d) => d.aprobar || (d.motivo && d.motivo.length >= 5), {
  message: 'Indica el motivo del rechazo', path: ['motivo'],
});

const revisarDocumentoSchema = z.object({
  estado: z.enum(['aprobado', 'rechazado']),
  motivo: z.string().trim().max(500).optional(),
  fechaVencimiento: z.string().optional(),
}).refine((d) => d.estado === 'aprobado' || (d.motivo && d.motivo.length >= 5), {
  message: 'Indica el motivo del rechazo', path: ['motivo'],
});

const configuracionSchema = z.object({
  maxSolicitudesActivasBeneficiario: z.coerce.number().int().min(1).max(50),
  maxFotosMaterial:                  z.coerce.number().int().min(1).max(10),
  diasRecordatorioVencimiento:       z.coerce.number().int().min(1).max(30),
  umbralReportesOcultar:             z.coerce.number().int().min(1).max(100),
  porcentajeDescuentoTributario:     z.coerce.number().min(0).max(100),
  topeDescuentoSobreImpuesto:        z.coerce.number().min(0).max(100),
  emailSoporte:                      z.string().email(),
  modoMantenimiento:                 z.boolean(),
}).partial();

module.exports = {
  actualizarMeSchema,
  eliminarCuentaSchema,
  updateBeneficiarioSchema,
  adminUpdateBeneficiarioSchema,
  portafolioSchema,
  updateConstructoraSchema,
  adminUpdateConstructoraSchema,
  documentoSchema,
  listarUsuariosSchema,
  cambiarEstadoUsuarioSchema,
  verificacionSchema,
  revisarDocumentoSchema,
  configuracionSchema,
};
