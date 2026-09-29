/**
 * Tareas programadas (hora de Bogotá):
 *  - 00:05 vence materiales cuya fecha límite pasó y rechaza sus solicitudes pendientes
 *  - 08:00 recuerda a las constructoras los materiales que vencen pronto con solicitudes pendientes
 */
const cron = require('node-cron');
const { prisma, notificar, createNotification, configSistema, logger } = require('@brickbybrick/shared');
const materialRepository = require('../repositories/material.repository');

async function procesarVencimientos() {
  const hoy = materialRepository.inicioHoyBogota();
  const vencidos = await prisma.material.findMany({
    where: { estadoPublicacion: { in: ['activo', 'pausado', 'agotado'] }, fechaLimite: { lt: hoy }, eliminadoEn: null },
    include: { constructora: { select: { usuarioId: true } } },
  });

  for (const material of vencidos) {
    const pendientes = await prisma.solicitudMaterial.findMany({
      where: { materialId: material.id, estado: 'pendiente' },
      include: { beneficiario: { select: { usuarioId: true } } },
    });

    await prisma.$transaction([
      prisma.material.update({ where: { id: material.id }, data: { estadoPublicacion: 'vencido' } }),
      prisma.solicitudMaterial.updateMany({
        where: { materialId: material.id, estado: 'pendiente' },
        data: { estado: 'rechazada', fechaRespuesta: new Date(), motivoRechazo: 'El material venció antes de ser aprobado' },
      }),
    ]);

    createNotification({
      usuarioId: material.constructora.usuarioId,
      tipo: 'material_vence',
      titulo: 'Material vencido',
      mensaje: `"${material.nombre}" llegó a su fecha límite y se retiró del catálogo.${pendientes.length ? ` Se cerraron ${pendientes.length} solicitud(es) pendiente(s).` : ''}`,
      recurso: 'material',
      recursoId: material.id,
    });
    if (pendientes.length) {
      notificar({
        usuarioIds: pendientes.map((p) => p.beneficiario.usuarioId),
        tipo: 'solicitud_rechazada',
        titulo: 'Solicitud cerrada por vencimiento',
        mensaje: `El material "${material.nombre}" venció antes de que la empresa respondiera tu solicitud.`,
        recurso: 'solicitud',
        recursoId: pendientes[0].id,
      });
    }
  }
  if (vencidos.length) logger.info(`[cron] ${vencidos.length} material(es) vencido(s)`);
  return vencidos.length;
}

async function recordarProximosAVencer() {
  const dias = Number(await configSistema.obtenerParametro('diasRecordatorioVencimiento'));
  const hoy = materialRepository.inicioHoyBogota();
  const limite = new Date(hoy.getTime() + dias * 24 * 60 * 60 * 1000);
  const proximos = await prisma.material.findMany({
    where: {
      estadoPublicacion: 'activo', eliminadoEn: null, fechaLimite: { equals: limite },
      solicitudes: { some: { estado: 'pendiente' } },
    },
    include: { constructora: { select: { usuarioId: true } }, _count: { select: { solicitudes: { where: { estado: 'pendiente' } } } } },
  });
  for (const m of proximos) {
    createNotification({
      usuarioId: m.constructora.usuarioId,
      tipo: 'material_vence',
      titulo: `"${m.nombre}" vence en ${dias} día(s)`,
      mensaje: `Tiene ${m._count.solicitudes} solicitud(es) pendiente(s). Respóndelas antes de la fecha límite.`,
      recurso: 'material',
      recursoId: m.id,
    });
  }
}

const opciones = { scheduled: false, timezone: 'America/Bogota' };
const tareas = [
  cron.schedule('5 0 * * *', () => procesarVencimientos().catch((e) => logger.error(`[cron] vencimientos: ${e.message}`)), opciones),
  cron.schedule('0 8 * * *', () => recordarProximosAVencer().catch((e) => logger.error(`[cron] recordatorios: ${e.message}`)), opciones),
];

module.exports = {
  start: () => {
    tareas.forEach((t) => t.start());
    // Al arrancar se procesan vencimientos que quedaron pendientes (p. ej. servicio apagado a medianoche)
    procesarVencimientos().catch((e) => logger.error(`[cron] vencimientos: ${e.message}`));
  },
  stop: () => tareas.forEach((t) => t.stop()),
  procesarVencimientos,
  recordarProximosAVencer,
};
