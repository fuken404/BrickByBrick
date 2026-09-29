const {
  uploadToStorage, deleteFromStorage, parsePaginacion, pagina, notificar, registrarAuditoria, configSistema,
  NotFoundError, ForbiddenError, BadRequestError, ConflictError,
} = require('@brickbybrick/shared');
const materialRepository = require('../repositories/material.repository');
const constructoraRepository = require('../repositories/constructora.repository');
const beneficiarioRepository = require('../repositories/beneficiario.repository');
const solicitudRepository = require('../repositories/solicitud.repository');

const aFecha = (v) => (v ? new Date(`${v.slice(0, 10)}T00:00:00.000Z`) : null);

async function constructoraDelUsuario(usuarioId) {
  const c = await constructoraRepository.findByUsuarioId(usuarioId);
  if (!c) throw new ForbiddenError('Tu cuenta no tiene una empresa asociada');
  return c;
}

async function propioOAdmin(materialId, caller) {
  const m = await materialRepository.findById(materialId);
  if (!m || m.eliminadoEn) throw new NotFoundError('Material no encontrado');
  if (caller.rol !== 'ADMINISTRADOR' && m.constructora.usuarioId !== caller.userId) {
    throw new ForbiddenError('No tienes permiso sobre este material');
  }
  return m;
}

/** Reglas para que un material pueda estar visible en el catálogo. */
function validarPublicable(m, constructora) {
  if (!constructora.verificada) {
    throw new ForbiddenError('Tu empresa debe estar verificada para publicar materiales. Puedes guardarlo como borrador.');
  }
  if (m.valorUnitarioCop === null || m.valorUnitarioCop === undefined) {
    throw new BadRequestError('Indica el valor unitario de referencia (COP) para poder generar la constancia tributaria');
  }
  if (!m.fechaLimite) throw new BadRequestError('Indica la fecha límite de disponibilidad');
  if (Number(m.cantidad) <= 0) throw new BadRequestError('No hay cantidad disponible para publicar');
  if (new Date(m.fechaLimite) < materialRepository.inicioHoyBogota()) {
    throw new BadRequestError('La fecha límite ya pasó; actualízala antes de publicar');
  }
}

async function avisarMaterialNuevo(material) {
  const destinatarios = await materialRepository.destinatariosMaterialNuevo(material.constructora);
  notificar({
    usuarioIds: destinatarios,
    tipo: 'material_nuevo',
    titulo: 'Nuevo material disponible',
    mensaje: `${material.constructora.razonSocial} publicó "${material.nombre}" (${Number(material.cantidad)} ${material.unidadMedida}).`,
    recurso: 'material',
    recursoId: material.id,
  });
}

const materialService = {
  async listarPublico(filtros) {
    const pag = parsePaginacion(filtros, { defaultLimit: 12 });
    const { total, items } = await materialRepository.listarPublico(filtros, pag);
    return pagina(items, total, pag);
  },

  async listarMios(usuarioId, filtros) {
    const c = await constructoraDelUsuario(usuarioId);
    const pag = parsePaginacion(filtros);
    const { total, items } = await materialRepository.listarDeConstructora(c.id, filtros, pag);
    return pagina(items, total, pag);
  },

  async listarAdmin(filtros) {
    const pag = parsePaginacion(filtros);
    const { total, items } = await materialRepository.listarAdmin(filtros, pag);
    return pagina(items, total, pag);
  },

  /** Detalle. Borradores/pausados solo para la dueña y el admin. */
  async obtener(id, caller) {
    const m = await materialRepository.findById(id);
    if (!m || m.eliminadoEn) throw new NotFoundError('Material no encontrado');
    const esDueno = caller && m.constructora.usuarioId === caller.userId;
    const esAdmin = caller?.rol === 'ADMINISTRADOR';
    if (!esDueno && !esAdmin && (m.estadoPublicacion === 'borrador' || !m.constructora.verificada)) {
      throw new NotFoundError('Material no encontrado');
    }
    const resultado = { ...m, esPropio: Boolean(esDueno) };
    if (caller?.rol === 'BENEFICIARIO') {
      const b = await beneficiarioRepository.findByUsuarioId(caller.userId);
      resultado.miSolicitudActiva = b ? await solicitudRepository.activaDeBeneficiario(id, b.id) : null;
    }
    return resultado;
  },

  async crear(usuarioId, data) {
    const c = await constructoraDelUsuario(usuarioId);
    const { estadoPublicacion, ...campos } = data;
    const datos = {
      ...campos,
      fechaLimite: aFecha(data.fechaLimite),
      constructoraId: c.id,
      cantidadInicial: data.cantidad,
      estadoPublicacion,
    };
    if (estadoPublicacion === 'activo') {
      validarPublicable(datos, c);
      datos.publicadoEn = new Date();
    }
    const m = await materialRepository.create(datos);
    if (m.estadoPublicacion === 'activo') avisarMaterialNuevo(m);
    return m;
  },

  async actualizar(id, caller, data) {
    const m = await propioOAdmin(id, caller);
    const cambios = { ...data };
    if (data.fechaLimite !== undefined) cambios.fechaLimite = aFecha(data.fechaLimite);

    if (data.cantidad !== undefined) {
      // La cantidad editable es la disponible; se ajusta la inicial para no perder la trazabilidad
      const delta = Number(data.cantidad) - Number(m.cantidad);
      cambios.cantidadInicial = Number(m.cantidadInicial ?? m.cantidad) + delta;
      if (m.estadoPublicacion === 'agotado' && Number(data.cantidad) > 0) cambios.estadoPublicacion = 'activo';
    }

    const fusion = { ...m, ...cambios };
    if (fusion.estadoPublicacion === 'activo') {
      validarPublicable(fusion, await constructoraRepository.findById(m.constructoraId));
    }
    const actualizado = await materialRepository.update(id, cambios);
    if (caller.rol === 'ADMINISTRADOR') {
      registrarAuditoria({ usuarioId: caller.userId, accion: 'material_editado', entidad: 'material', entidadId: id, detalle: Object.keys(data) });
    }
    return actualizado;
  },

  async cambiarEstado(id, caller, estado) {
    const m = await propioOAdmin(id, caller);
    if (m.estadoPublicacion === estado) return m;
    const cambios = { estadoPublicacion: estado };
    if (estado === 'activo') {
      validarPublicable(m, await constructoraRepository.findById(m.constructoraId));
      if (!m.publicadoEn) cambios.publicadoEn = new Date();
    }
    if (estado === 'borrador' && (await materialRepository.contarSolicitudesActivas(id))) {
      throw new ConflictError('Tiene solicitudes activas; puedes pausarlo pero no volverlo borrador');
    }
    const actualizado = await materialRepository.update(id, cambios);
    if (estado === 'activo' && !m.publicadoEn) avisarMaterialNuevo(actualizado);
    if (caller.rol === 'ADMINISTRADOR') {
      registrarAuditoria({ usuarioId: caller.userId, accion: `material_${estado}`, entidad: 'material', entidadId: id });
    }
    return actualizado;
  },

  async eliminar(id, caller) {
    const m = await propioOAdmin(id, caller);
    const activas = await materialRepository.contarSolicitudesActivas(id);
    if (activas) {
      throw new ConflictError(`Tiene ${activas} solicitud(es) pendiente(s) o aprobada(s). Resuélvelas antes de eliminarlo.`);
    }
    await materialRepository.update(id, { eliminadoEn: new Date(), estadoPublicacion: 'pausado' });
    registrarAuditoria({ usuarioId: caller.userId, accion: 'material_eliminado', entidad: 'material', entidadId: id, detalle: { nombre: m.nombre } });
  },

  async agregarFotos(id, caller, files) {
    await propioOAdmin(id, caller);
    const max = Number(await configSistema.obtenerParametro('maxFotosMaterial'));
    const existentes = await materialRepository.contarFotos(id);
    if (existentes + files.length > max) {
      throw new BadRequestError(`Máximo ${max} fotos por material (ya tiene ${existentes})`);
    }
    const nuevas = await Promise.all(files.map(async (f, i) => ({
      materialId: id,
      url: await uploadToStorage(f.buffer, 'materiales', f.originalname, f.mimetype),
      orden: existentes + i,
    })));
    await materialRepository.crearFotos(nuevas);
    return materialRepository.fotos(id);
  },

  async eliminarFoto(materialId, fotoId, caller) {
    await propioOAdmin(materialId, caller);
    const foto = await materialRepository.findFoto(fotoId);
    if (!foto || foto.materialId !== materialId) throw new NotFoundError('Foto no encontrada');
    await materialRepository.eliminarFoto(fotoId);
    deleteFromStorage(foto.url);
    return materialRepository.fotos(materialId);
  },
};

module.exports = materialService;
