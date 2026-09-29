const { prisma } = require('@brickbybrick/shared');

/** Rango [1 ene, 1 ene siguiente) de un año en hora de Bogotá (UTC-5). */
function rangoAnio(anio) {
  return {
    desde: new Date(`${anio}-01-01T05:00:00.000Z`),
    hasta: new Date(`${anio + 1}-01-01T05:00:00.000Z`),
  };
}

const INCLUDE_CONSTANCIA = {
  material: {
    select: {
      nombre: true, unidadMedida: true, estadoMaterial: true, valorUnitarioCop: true,
      categoria: { select: { nombre: true } },
    },
  },
  beneficiario: { select: { nombreCompleto: true, cedula: true, localidad: { select: { nombre: true } } } },
};

const tributarioRepository = {
  rangoAnio,

  entregasDelAnio(constructoraId, anio) {
    const { desde, hasta } = rangoAnio(anio);
    return prisma.solicitudMaterial.findMany({
      where: { estado: 'entregada', material: { constructoraId }, fechaEntrega: { gte: desde, lt: hasta } },
      include: INCLUDE_CONSTANCIA,
      orderBy: { fechaEntrega: 'asc' },
    });
  },

  constancia(solicitudId) {
    return prisma.solicitudMaterial.findUnique({
      where: { id: solicitudId },
      include: {
        ...INCLUDE_CONSTANCIA,
        material: { select: { ...INCLUDE_CONSTANCIA.material.select, constructoraId: true } },
      },
    });
  },

  materialesSinValor(constructoraId) {
    return prisma.material.count({
      where: { constructoraId, eliminadoEn: null, valorUnitarioCop: null, estadoPublicacion: { not: 'borrador' } },
    });
  },

  guardarCertificado(constructoraId, periodo, datos) {
    return prisma.certificadoDonacion.upsert({
      where: { constructoraId_periodo: { constructoraId, periodo } },
      update: { ...datos, generatedAt: new Date() },
      create: { constructoraId, periodo, ...datos },
    });
  },
};

module.exports = tributarioRepository;
