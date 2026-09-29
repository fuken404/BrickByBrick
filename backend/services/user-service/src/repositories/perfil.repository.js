const { prisma, USUARIO_PUBLICO_SELECT } = require('@brickbybrick/shared');

const perfilRepository = {
  findUsuario(id) {
    return prisma.usuario.findUnique({
      where: { id },
      select: {
        ...USUARIO_PUBLICO_SELECT,
        estado: true,
        createdAt: true,
        beneficiario: {
          select: {
            id: true, nombreCompleto: true, esAlimentadorWeb: true, nombreEmprendimiento: true,
            bioPublica: true, portafolioPublico: true, localidad: { select: { id: true, nombre: true } },
          },
        },
        constructora: {
          select: {
            id: true, razonSocial: true, logoUrl: true, verificada: true, descripcion: true, sitioWeb: true,
            localidad: { select: { id: true, nombre: true } },
          },
        },
      },
    });
  },

  async contadores(usuarioId, visitanteId) {
    const [publicaciones, seguidores, siguiendo, loSigo] = await prisma.$transaction([
      prisma.publicacion.count({ where: { autorId: usuarioId, estado: 'publicada' } }),
      prisma.seguidor.count({ where: { seguidoId: usuarioId } }),
      prisma.seguidor.count({ where: { seguidorId: usuarioId } }),
      prisma.seguidor.count({ where: { seguidorId: visitanteId || '00000000-0000-0000-0000-000000000000', seguidoId: usuarioId } }),
    ]);
    return { publicaciones, seguidores, siguiendo, siguiendoPorMi: loSigo > 0 };
  },

  async impactoConstructora(constructoraId) {
    const [materialesActivos, entregas] = await prisma.$transaction([
      prisma.material.count({ where: { constructoraId, estadoPublicacion: 'activo', eliminadoEn: null } }),
      prisma.solicitudMaterial.count({ where: { estado: 'entregada', material: { constructoraId } } }),
    ]);
    return { materialesActivos, entregas };
  },
};

module.exports = perfilRepository;
