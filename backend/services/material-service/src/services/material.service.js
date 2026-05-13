const { prisma, uploadToStorage, deleteFromStorage } = require('@brickbybrick/shared');

const MATERIAL_INCLUDE = {
  categoria:    { select: { id: true, nombre: true, colorHex: true, icono: true } },
  constructora: {
    select: {
      id: true, razonSocial: true, logoUrl: true, verificada: true,
      localidad: { select: { id: true, nombre: true } },
    },
  },
  fotos: { orderBy: { orden: 'asc' } },
  _count: { select: { solicitudes: true } },
};

class MaterialService {
  async findAll({ page = 1, limit = 20, categoriaId, localidadId, estado, q } = {}) {
    const where = {
      estadoPublicacion: 'activo',
      OR: [{ fechaLimite: null }, { fechaLimite: { gte: new Date() } }],
    };

    if (categoriaId)  where.categoriaId = Number(categoriaId);
    if (estado)       where.estadoMaterial = estado;
    if (localidadId)  where.constructora = { localidadId: Number(localidadId) };
    if (q)            where.OR = [
      { nombre:      { contains: q, mode: 'insensitive' } },
      { descripcion: { contains: q, mode: 'insensitive' } },
    ];

    const [total, items] = await Promise.all([
      prisma.material.count({ where }),
      prisma.material.findMany({
        where,
        include: MATERIAL_INCLUDE,
        skip:  (Number(page) - 1) * Number(limit),
        take:  Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { total, page: Number(page), limit: Number(limit), items };
  }

  async findById(id) {
    const m = await prisma.material.findUnique({ where: { id }, include: MATERIAL_INCLUDE });
    if (!m) throw { status: 404, message: 'Material no encontrado' };
    return m;
  }

  async findByConstructora(constructoraId, { page = 1, limit = 50, estadoPublicacion } = {}) {
    const where = { constructoraId };
    if (estadoPublicacion) where.estadoPublicacion = estadoPublicacion;

    const [total, items] = await Promise.all([
      prisma.material.count({ where }),
      prisma.material.findMany({
        where,
        include: MATERIAL_INCLUDE,
        skip:  (Number(page) - 1) * Number(limit),
        take:  Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { total, page: Number(page), limit: Number(limit), items };
  }

  async create(constructoraId, data) {
    return prisma.material.create({
      data: {
        constructoraId,
        categoriaId:       data.categoriaId,
        nombre:            data.nombre,
        descripcion:       data.descripcion  || null,
        estadoMaterial:    data.estadoMaterial,
        cantidad:          data.cantidad,
        unidadMedida:      data.unidadMedida,
        condicionesRetiro: data.condicionesRetiro || null,
        fechaLimite:       data.fechaLimite ? new Date(data.fechaLimite) : null,
        maxSolicitudes:    data.maxSolicitudes || null,
        estadoPublicacion: data.estadoPublicacion || 'borrador',
      },
      include: MATERIAL_INCLUDE,
    });
  }

  async update(id, callerId, callerRol, data) {
    const m = await this._ownOrAdmin(id, callerId, callerRol);

    return prisma.material.update({
      where:   { id },
      data:    {
        ...data,
        fechaLimite: data.fechaLimite ? new Date(data.fechaLimite) : undefined,
      },
      include: MATERIAL_INCLUDE,
    });
  }

  async remove(id, callerId, callerRol) {
    await this._ownOrAdmin(id, callerId, callerRol);
    await prisma.material.delete({ where: { id } });
  }

  async cambiarEstado(id, callerId, callerRol, estado) {
    await this._ownOrAdmin(id, callerId, callerRol);

    return prisma.material.update({
      where:  { id },
      data:   { estadoPublicacion: estado },
      select: { id: true, estadoPublicacion: true },
    });
  }

  async agregarFotos(id, callerId, callerRol, files) {
    await this._ownOrAdmin(id, callerId, callerRol);

    const existingCount = await prisma.fotoMaterial.count({ where: { materialId: id } });

    const uploads = await Promise.all(
      files.map((f, i) =>
        uploadToStorage(f.buffer, 'materiales', f.originalname).then((url) => ({
          materialId: id,
          url,
          orden: existingCount + i,
        }))
      )
    );

    await prisma.fotoMaterial.createMany({ data: uploads });
    return prisma.fotoMaterial.findMany({ where: { materialId: id }, orderBy: { orden: 'asc' } });
  }

  async eliminarFoto(fotoId, callerId, callerRol) {
    const foto = await prisma.fotoMaterial.findUnique({ where: { id: fotoId } });
    if (!foto) throw { status: 404, message: 'Foto no encontrada' };
    await this._ownOrAdmin(foto.materialId, callerId, callerRol);
    await deleteFromStorage(foto.url);
    await prisma.fotoMaterial.delete({ where: { id: fotoId } });
  }

  // ------------------------------------------------------------------
  async _ownOrAdmin(materialId, callerId, callerRol) {
    const m = await prisma.material.findUnique({
      where:   { id: materialId },
      include: { constructora: { select: { usuarioId: true } } },
    });
    if (!m) throw { status: 404, message: 'Material no encontrado' };
    if (callerRol !== 'ADMINISTRADOR' && m.constructora.usuarioId !== callerId) {
      throw { status: 403, message: 'Sin permiso para modificar este material' };
    }
    return m;
  }
}

module.exports = new MaterialService();
