const prisma = require('./prisma.client');
const logger = require('./logger');

/**
 * Registra una acción relevante en la tabla de auditoría (no bloqueante).
 * @param {{ usuarioId?: string, accion: string, entidad: string, entidadId?: string, detalle?: object, ip?: string }} data
 */
function registrarAuditoria(data) {
  return prisma.auditoria
    .create({ data: { ...data, entidadId: data.entidadId ? String(data.entidadId) : null } })
    .catch((err) => logger.warn(`No se pudo registrar auditoría (${data.accion}): ${err.message}`));
}

module.exports = { registrarAuditoria };
