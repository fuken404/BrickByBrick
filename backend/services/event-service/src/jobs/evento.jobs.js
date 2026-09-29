/**
 * Tareas de eventos (hora de Bogotá):
 *  - cada 10 min: publicado → en_curso al iniciar; en_curso → finalizado al terminar
 *  - cada hora: recordatorio a inscritos de los eventos que empiezan en ~24 h
 */
const cron = require('node-cron');
const { prisma, notificar, logger } = require('@brickbybrick/shared');

async function actualizarEstados() {
  const ahora = new Date();
  const iniciados = await prisma.evento.updateMany({
    where: { estado: 'publicado', fechaInicio: { lte: ahora }, fechaFin: { gt: ahora } },
    data: { estado: 'en_curso' },
  });

  const terminados = await prisma.evento.findMany({
    where: { estado: { in: ['publicado', 'en_curso'] }, fechaFin: { lte: ahora } },
    select: { id: true },
  });
  for (const { id } of terminados) {
    await prisma.$transaction(async (tx) => {
      await tx.evento.update({ where: { id }, data: { estado: 'finalizado' } });
      const conAsistencia = await tx.inscripcionEvento.count({ where: { eventoId: id, estado: 'asistio' } });
      if (conAsistencia) {
        await tx.inscripcionEvento.updateMany({ where: { eventoId: id, estado: 'inscrito' }, data: { estado: 'no_asistio' } });
      }
    });
  }
  if (iniciados.count || terminados.length) {
    logger.info(`[cron] eventos: ${iniciados.count} iniciados, ${terminados.length} finalizados`);
  }
}

async function recordatorios() {
  const desde = new Date(Date.now() + 23 * 60 * 60 * 1000);
  const hasta = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const eventos = await prisma.evento.findMany({
    where: { estado: 'publicado', fechaInicio: { gte: desde, lt: hasta } },
    include: { inscripciones: { where: { estado: 'inscrito' }, select: { beneficiario: { select: { usuarioId: true } } } } },
  });
  for (const e of eventos) {
    notificar({
      usuarioIds: e.inscripciones.map((i) => i.beneficiario.usuarioId),
      tipo: 'evento_inscripcion',
      titulo: 'Tu evento es mañana',
      mensaje: `Recuerda: "${e.nombre}" empieza mañana${e.direccion ? ` en ${e.direccion}` : ''}.`,
      recurso: 'evento',
      recursoId: e.id,
      email: true,
    });
  }
}

const opciones = { scheduled: false, timezone: 'America/Bogota' };
const tareas = [
  cron.schedule('*/10 * * * *', () => actualizarEstados().catch((e) => logger.error(`[cron] eventos: ${e.message}`)), opciones),
  cron.schedule('0 * * * *', () => recordatorios().catch((e) => logger.error(`[cron] recordatorios: ${e.message}`)), opciones),
];

module.exports = {
  start: () => {
    tareas.forEach((t) => t.start());
    actualizarEstados().catch((e) => logger.error(`[cron] eventos: ${e.message}`));
  },
  stop: () => tareas.forEach((t) => t.stop()),
  actualizarEstados,
  recordatorios,
};
