const router = require('express').Router();
const { prisma, authMiddleware, requireRoles, sendSuccess } = require('@brickbybrick/shared');

router.get('/dashboard',
  authMiddleware, requireRoles('ADMINISTRADOR'),
  async (_req, res, next) => {
    try {
      const [
        totalBeneficiarios,
        totalConstructoras,
        constructorasVerificadas,
        materialesActivos,
        totalMateriales,
        totalSolicitudes,
        solicitudesCompletadas,
        eventosActivos,
        totalEventos,
        publicacionesActivas,
      ] = await Promise.all([
        prisma.beneficiario.count(),
        prisma.constructora.count(),
        prisma.constructora.count({ where: { verificada: true } }),
        prisma.material.count({ where: { estadoPublicacion: 'activo' } }),
        prisma.material.count(),
        prisma.solicitudMaterial.count(),
        prisma.solicitudMaterial.count({ where: { estado: 'entregada' } }),
        prisma.evento.count({ where: { estado: 'publicado' } }),
        prisma.evento.count(),
        prisma.publicacion.count({ where: { estado: 'publicada' } }),
      ]);

      sendSuccess(res, {
        totalBeneficiarios,
        totalConstructoras,
        constructorasVerificadas,
        materialesActivos,
        totalMateriales,
        totalSolicitudes,
        solicitudesCompletadas,
        eventosActivos,
        totalEventos,
        publicacionesActivas,
        reportesPendientes: 0,
        valorTotalDonacionesCop: 0,
      });
    } catch (err) { next(err); }
  }
);

router.get('/reportes',
  authMiddleware, requireRoles('ADMINISTRADOR'),
  async (_req, res, next) => {
    try {
      const inicioMes = new Date();
      inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);

      const [
        solicitudesEntregadas,
        totalSolicitudes,
        solicitudesAprobadas,
        familiasRaw,
        constructorasActivasMes,
      ] = await Promise.all([
        // Suma de cantidades entregadas
        prisma.solicitudMaterial.aggregate({
          _sum: { cantidadSolicitada: true },
          where: { estado: 'entregada' },
        }),
        prisma.solicitudMaterial.count(),
        prisma.solicitudMaterial.count({ where: { estado: { in: ['aprobada', 'entregada'] } } }),
        // Beneficiarios únicos con al menos una solicitud entregada
        prisma.solicitudMaterial.findMany({
          where:  { estado: 'entregada' },
          select: { beneficiarioId: true },
          distinct: ['beneficiarioId'],
        }),
        // Constructoras con al menos un material publicado este mes
        prisma.constructora.count({
          where: { materiales: { some: { estadoPublicacion: 'activo', createdAt: { gte: inicioMes } } } },
        }),
      ]);

      const totalDonado    = Number(solicitudesEntregadas._sum.cantidadSolicitada ?? 0);
      const familias       = familiasRaw.length;
      const tasaAprobacion = totalSolicitudes > 0
        ? Math.round((solicitudesAprobadas / totalSolicitudes) * 100)
        : 0;

      sendSuccess(res, {
        totalMaterialesDonados: totalDonado,
        familiasBeneficiadas:   familias,
        tasaAprobacion,
        constructorasActivasMes,
        valorTotalCop:      0,
        impactoTributario:  0,
      });
    } catch (err) { next(err); }
  }
);

module.exports = router;
