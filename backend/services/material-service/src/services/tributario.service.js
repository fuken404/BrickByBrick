const { configSistema, NotFoundError, ForbiddenError, BadRequestError } = require('@brickbybrick/shared');
const tributarioRepository = require('../repositories/tributario.repository');
const constructoraRepository = require('../repositories/constructora.repository');
const { constanciaPdf, certificadoAnualPdf } = require('../pdf/documentos.pdf');

const redondear = (v) => Math.round(v);

async function constructoraObjetivo(caller, constructoraId) {
  if (caller.rol === 'ADMINISTRADOR') {
    if (!constructoraId) throw new BadRequestError('Indica la constructora a consultar');
    const c = await constructoraRepository.findById(constructoraId);
    if (!c) throw new NotFoundError('Constructora no encontrada');
    return c;
  }
  const c = await constructoraRepository.findByUsuarioId(caller.userId);
  if (!c) throw new ForbiddenError('Tu cuenta no tiene una empresa asociada');
  return c;
}

function docAprobado(c, tipo) {
  return c.documentosEmpresa.some((d) => d.tipo === tipo && d.estado === 'aprobado');
}

async function calcularResumen(c, anio, impuestoEstimado) {
  const cfg = await configSistema.obtenerConfiguracion();
  const porcentaje = Number(cfg.porcentajeDescuentoTributario);
  const topePct = Number(cfg.topeDescuentoSobreImpuesto);
  const entregas = await tributarioRepository.entregasDelAnio(c.id, anio);

  const valorDonadoCop = entregas.reduce((s, e) => s + Number(e.valorDonadoCop || 0), 0);
  const descuentoEstimadoCop = redondear(valorDonadoCop * (porcentaje / 100));
  const topeCop = impuestoEstimado !== undefined ? redondear(impuestoEstimado * (topePct / 100)) : null;

  const porMes = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, entregas: 0, valorDonadoCop: 0 }));
  const porCategoria = {};
  for (const e of entregas) {
    const mes = Number(new Date(e.fechaEntrega).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }).slice(5, 7));
    porMes[mes - 1].entregas += 1;
    porMes[mes - 1].valorDonadoCop += Number(e.valorDonadoCop || 0);
    const cat = e.material.categoria.nombre;
    porCategoria[cat] = (porCategoria[cat] || 0) + Number(e.valorDonadoCop || 0);
  }

  return {
    anio,
    constructora: { id: c.id, razonSocial: c.razonSocial, nit: c.nit, verificada: c.verificada },
    entregas: entregas.length,
    beneficiarios: new Set(entregas.map((e) => e.beneficiarioId)).size,
    valorDonadoCop: redondear(valorDonadoCop),
    porcentaje,
    descuentoEstimadoCop,
    topePorcentaje: topePct,
    impuestoEstimadoCop: impuestoEstimado ?? null,
    topeCop,
    descuentoAplicableCop: topeCop === null ? descuentoEstimadoCop : Math.min(descuentoEstimadoCop, topeCop),
    porMes,
    porCategoria: Object.entries(porCategoria).map(([categoria, valor]) => ({ categoria, valorDonadoCop: redondear(valor) })),
    requisitos: {
      empresaVerificada: c.verificada,
      rutAprobado: docAprobado(c, 'rut'),
      camaraComercioAprobada: docAprobado(c, 'camara_comercio'),
      tieneEntregas: entregas.length > 0,
      materialesSinValor: await tributarioRepository.materialesSinValor(c.id),
    },
    _entregas: entregas,
  };
}

const tributarioService = {
  async resumen(caller, { anio, impuestoEstimado, constructoraId }) {
    const c = await constructoraObjetivo(caller, constructoraId);
    const { _entregas, ...resumen } = await calcularResumen(c, anio, impuestoEstimado);
    return resumen;
  },

  async constancias(caller, { anio, constructoraId }) {
    const c = await constructoraObjetivo(caller, constructoraId);
    const entregas = await tributarioRepository.entregasDelAnio(c.id, anio);
    return entregas.map((e) => ({
      id: e.id,
      numeroConstancia: e.numeroConstancia,
      fechaEntrega: e.fechaEntrega,
      fechaConfirmacion: e.fechaConfirmacion,
      material: { nombre: e.material.nombre, categoria: e.material.categoria.nombre, unidadMedida: e.material.unidadMedida },
      cantidad: Number(e.cantidadSolicitada),
      valorDonadoCop: Number(e.valorDonadoCop || 0),
      beneficiario: e.beneficiario.nombreCompleto,
    }));
  },

  async constanciaPdf(caller, solicitudId) {
    const s = await tributarioRepository.constancia(solicitudId);
    if (!s || s.estado !== 'entregada' || !s.numeroConstancia) throw new NotFoundError('Constancia no disponible');
    const c = await constructoraRepository.findById(s.material.constructoraId);
    if (caller.rol !== 'ADMINISTRADOR' && c.usuarioId !== caller.userId) {
      throw new ForbiddenError('No tienes permiso sobre esta constancia');
    }
    return { nombre: `constancia-${s.numeroConstancia}.pdf`, buffer: await constanciaPdf({ solicitud: s, constructora: c }) };
  },

  async certificadoAnualPdf(caller, { anio, constructoraId }) {
    const c = await constructoraObjetivo(caller, constructoraId);
    const { _entregas, ...resumen } = await calcularResumen(c, anio);
    await tributarioRepository.guardarCertificado(c.id, String(anio), {
      totalMaterialesDonados: resumen.entregas,
      valorEstimadoCop: resumen.valorDonadoCop,
      deduccionEstimadaCop: resumen.descuentoEstimadoCop,
    });
    return {
      nombre: `resumen-donaciones-${anio}-${c.nit}.pdf`,
      buffer: await certificadoAnualPdf({ constructora: c, resumen, entregas: _entregas }),
    };
  },
};

module.exports = tributarioService;
