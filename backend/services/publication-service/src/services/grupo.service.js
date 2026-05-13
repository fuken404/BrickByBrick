const { prisma } = require('@brickbybrick/shared');

class GrupoService {
  async findAll({ page = 1, limit = 20 } = {}) {
    const [total, items] = await Promise.all([
      prisma.grupo.count(),
      prisma.grupo.findMany({
        include: { _count: { select: { miembros: true, mensajes: true } }, temas: true },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { total, page: Number(page), limit: Number(limit), items };
  }

  async findById(id) {
    const g = await prisma.grupo.findUnique({
      where: { id },
      include: { temas: true, _count: { select: { miembros: true } }, creador: { select: { id: true, email: true } } },
    });
    if (!g) throw { status: 404, message: 'Grupo no encontrado' };
    return g;
  }

  async create(callerId, data) {
    const { temas = [], ...grupoData } = data;
    return prisma.$transaction(async (tx) => {
      const grupo = await tx.grupo.create({ data: { ...grupoData, creadorId: callerId } });
      if (temas.length) {
        await tx.temaGrupo.createMany({ data: temas.map((tema) => ({ grupoId: grupo.id, tema })) });
      }
      await tx.miembroGrupo.create({ data: { grupoId: grupo.id, usuarioId: callerId, rol: 'admin' } });
      return grupo;
    });
  }

  async unirse(grupoId, callerId) {
    const existing = await prisma.miembroGrupo.findUnique({
      where: { grupoId_usuarioId: { grupoId, usuarioId: callerId } },
    });
    if (existing) throw { status: 409, message: 'Ya eres miembro de este grupo' };
    return prisma.miembroGrupo.create({ data: { grupoId, usuarioId: callerId, rol: 'miembro' } });
  }

  async salir(grupoId, callerId) {
    const m = await prisma.miembroGrupo.findUnique({
      where: { grupoId_usuarioId: { grupoId, usuarioId: callerId } },
    });
    if (!m) throw { status: 404, message: 'No eres miembro de este grupo' };
    await prisma.miembroGrupo.delete({ where: { grupoId_usuarioId: { grupoId, usuarioId: callerId } } });
  }

  async getMensajes(grupoId, callerId, { page = 1, limit = 50 } = {}) {
    const miembro = await prisma.miembroGrupo.findUnique({
      where: { grupoId_usuarioId: { grupoId, usuarioId: callerId } },
    });
    if (!miembro) throw { status: 403, message: 'No eres miembro de este grupo' };

    const [total, items] = await Promise.all([
      prisma.mensajeGrupo.count({ where: { grupoId } }),
      prisma.mensajeGrupo.findMany({
        where:   { grupoId },
        include: { autor: { select: { id: true, email: true } } },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    return { total, page: Number(page), limit: Number(limit), items };
  }

  async addMensaje(grupoId, callerId, { contenido, adjuntoUrl }) {
    const miembro = await prisma.miembroGrupo.findUnique({
      where: { grupoId_usuarioId: { grupoId, usuarioId: callerId } },
    });
    if (!miembro) throw { status: 403, message: 'No eres miembro de este grupo' };

    return prisma.mensajeGrupo.create({
      data: { grupoId, autorId: callerId, contenido, adjuntoUrl: adjuntoUrl || null },
      include: { autor: { select: { id: true, email: true } } },
    });
  }
}

module.exports = new GrupoService();
