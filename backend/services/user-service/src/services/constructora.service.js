const {
  uploadToStorage, deleteFromStorage, parsePaginacion, pagina, notificarAdmins, registrarAuditoria,
  NotFoundError, ForbiddenError,
} = require('@brickbybrick/shared');
const constructoraRepository = require('../repositories/constructora.repository');

async function propiaOAdmin(id, caller) {
  const c = await constructoraRepository.findRaw(id);
  if (!c) throw new NotFoundError('Constructora no encontrada');
  if (caller.rol !== 'ADMINISTRADOR' && c.usuarioId !== caller.userId) {
    throw new ForbiddenError('No tienes permiso sobre esta empresa');
  }
  return c;
}

const constructoraService = {
  async listar(query, caller) {
    const pag = parsePaginacion(query);
    const completo = caller?.rol === 'ADMINISTRADOR';
    const { total, items } = await constructoraRepository.list(query, pag, { completo });
    return pagina(items, total, pag);
  },

  async obtener(id, caller) {
    const raw = await constructoraRepository.findRaw(id);
    if (!raw) throw new NotFoundError('Constructora no encontrada');
    const completo = caller && (caller.rol === 'ADMINISTRADOR' || caller.userId === raw.usuarioId);
    return constructoraRepository.findById(id, { completo });
  },

  async actualizar(id, caller, data) {
    await propiaOAdmin(id, caller);
    const actualizado = await constructoraRepository.update(id, data);
    if (caller.rol === 'ADMINISTRADOR') {
      registrarAuditoria({ usuarioId: caller.userId, accion: 'constructora_editada', entidad: 'constructora', entidadId: id, detalle: Object.keys(data) });
    }
    return actualizado;
  },

  async subirDocumento(id, caller, file, { tipo, fechaVencimiento }) {
    const c = await propiaOAdmin(id, caller);
    const url = await uploadToStorage(file.buffer, 'documentos', file.originalname, file.mimetype);
    const doc = await constructoraRepository.crearDocumento({
      constructoraId: id, tipo, url, estado: 'pendiente',
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
    });
    if (!c.verificada) {
      // Un nuevo documento reabre la verificación si había sido rechazada
      if (c.motivoRechazo) await constructoraRepository.update(id, { motivoRechazo: null });
      notificarAdmins({
        tipo: 'verificacion', titulo: 'Documento nuevo por revisar',
        mensaje: `${c.razonSocial} subió ${tipo === 'rut' ? 'su RUT' : 'su Cámara de Comercio'}.`,
        recurso: 'constructora', recursoId: id,
      });
    }
    return doc;
  },

  async actualizarLogo(id, caller, file) {
    const c = await propiaOAdmin(id, caller);
    const logoUrl = await uploadToStorage(file.buffer, 'logos', file.originalname, file.mimetype);
    const actualizado = await constructoraRepository.update(id, { logoUrl });
    if (c.logoUrl) deleteFromStorage(c.logoUrl);
    return { id: actualizado.id, logoUrl: actualizado.logoUrl };
  },
};

module.exports = constructoraService;
