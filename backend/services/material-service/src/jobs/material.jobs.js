/**
 * Cron job: vencimiento diario de materiales
 *
 * Ejecuta a medianoche (hora de Bogotá, UTC-5 → 05:00 UTC).
 * Marca como 'vencido' los materiales activos cuya fecha_limite ya pasó,
 * rechaza sus solicitudes pendientes y notifica a las constructoras.
 */

const cron    = require('node-cron');
const { prisma, createNotification, logger } = require('@brickbybrick/shared');

async function procesarVencimientos() {
  logger.info('[cron] Procesando vencimientos de materiales...');

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // 1. Materiales activos con fecha_limite < hoy
  const vencidos = await prisma.material.findMany({
    where: {
      estadoPublicacion: { in: ['activo', 'pausado'] },
      fechaLimite:       { lt: hoy },
    },
    include: {
      constructora: { select: { usuarioId: true } },
    },
  });

  if (!vencidos.length) {
    logger.info('[cron] No hay materiales para vencer hoy.');
    return;
  }

  logger.info(`[cron] Venciendo ${vencidos.length} materiales...`);

  for (const material of vencidos) {
    await prisma.$transaction(async (tx) => {
      // Marcar material como vencido
      await tx.material.update({
        where: { id: material.id },
        data:  { estadoPublicacion: 'vencido' },
      });

      // Rechazar solicitudes pendientes
      const { count } = await tx.solicitudMaterial.updateMany({
        where: { materialId: material.id, estado: 'pendiente' },
        data:  {
          estado:         'rechazada',
          fechaRespuesta: new Date(),
        },
      });

      logger.info(`[cron] Material ${material.id} vencido. ${count} solicitudes rechazadas.`);
    });

    // Notificar a la constructora
    await createNotification({
      usuarioId:  material.constructora.usuarioId,
      tipo:       'material_vence',
      titulo:     'Material vencido',
      mensaje:    `El material "${material.nombre}" ha vencido y fue desactivado.`,
      urlDestino: `/mis-materiales/${material.id}`,
    }).catch(() => {});
  }

  logger.info(`[cron] Vencimientos procesados: ${vencidos.length} materiales.`);
}

// Cron: todos los días a las 05:00 UTC (medianoche Bogotá)
const job = cron.schedule('0 5 * * *', procesarVencimientos, {
  scheduled: false,
  timezone:  'America/Bogota',
});

module.exports = job;
