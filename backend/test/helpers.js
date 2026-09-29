/**
 * Utilidades compartidas por las pruebas de integración: crean usuarios y
 * datos directamente en la base de pruebas y firman tokens de acceso.
 */
const bcrypt = require('bcryptjs');
const { prisma, generateAccessToken } = require('@brickbybrick/shared');

const PASSWORD = 'Prueba1234!';
let secuencia = 0;
/** Prefijo aleatorio por proceso para que cédulas y NIT no choquen entre ejecuciones. */
const PREFIJO = String(1000 + Math.floor(Math.random() * 9000));
const unico = () => `${Date.now().toString(36)}${(++secuencia).toString(36)}`;
const documento = () => `${PREFIJO}${String(++secuencia).padStart(6, '0')}`;
let passwordHash;

const hash = async () => (passwordHash ??= await bcrypt.hash(PASSWORD, 4));
const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const tokenDe = (usuario) => generateAccessToken(usuario);

async function localidad(nombre = 'Bosa') {
  return prisma.localidad.findUniqueOrThrow({ where: { nombre } });
}

async function categoria(nombre = 'Madera') {
  return prisma.categoriaMaterial.findUniqueOrThrow({ where: { nombre } });
}

async function crearBeneficiario({ loc = 'Bosa', nombre = 'Beneficiaria Prueba', alimentador = false } = {}) {
  const id = unico();
  const cedula = documento();
  const usuario = await prisma.usuario.create({
    data: {
      email: `ben_${id}@test.co`, passwordHash: await hash(), rol: 'BENEFICIARIO', emailVerificado: true, telefono: '3001112233',
      beneficiario: {
        create: {
          nombreCompleto: nombre, cedula,
          localidadId: (await localidad(loc)).id, esAlimentadorWeb: alimentador,
        },
      },
    },
    include: { beneficiario: true },
  });
  return { usuario, beneficiario: usuario.beneficiario, token: tokenDe(usuario) };
}

async function crearConstructora({ verificada = true, razonSocial = 'Constructora Prueba S.A.S' } = {}) {
  const id = unico();
  const nit = `${documento().slice(1)}-1`;
  const usuario = await prisma.usuario.create({
    data: {
      email: `con_${id}@test.co`, passwordHash: await hash(), rol: 'CONSTRUCTORA', emailVerificado: true, telefono: '6011234567',
      constructora: {
        create: {
          razonSocial: `${razonSocial} ${id}`, nit,
          direccion: 'Calle 1 # 2-3', localidadId: (await localidad('Chapinero')).id,
          verificada, fechaVerificacion: verificada ? new Date() : null,
        },
      },
    },
    include: { constructora: true },
  });
  return { usuario, constructora: usuario.constructora, token: tokenDe(usuario) };
}

async function crearAdmin() {
  const usuario = await prisma.usuario.create({
    data: { email: `adm_${unico()}@test.co`, passwordHash: await hash(), rol: 'ADMINISTRADOR', emailVerificado: true, mfaHabilitado: true },
  });
  return { usuario, token: tokenDe(usuario) };
}

async function crearMaterial(constructora, { cantidad = 100, valorUnitarioCop = 1000, estadoPublicacion = 'activo', nombre = 'Material de prueba' } = {}) {
  return prisma.material.create({
    data: {
      constructoraId: constructora.id, categoriaId: (await categoria()).id, nombre, estadoMaterial: 'buen_estado',
      cantidad, cantidadInicial: cantidad, unidadMedida: 'unidades', valorUnitarioCop, estadoPublicacion,
      publicadoEn: estadoPublicacion === 'activo' ? new Date() : null,
      fechaLimite: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });
}

async function crearEvento(constructora, { capacidadMaxima = 2, estado = 'publicado', dias = 5 } = {}) {
  const inicio = new Date(Date.now() + dias * 24 * 3600 * 1000);
  return prisma.evento.create({
    data: {
      constructoraId: constructora.id, nombre: 'Evento de prueba', tipoEvento: 'taller', fechaInicio: inicio,
      fechaFin: new Date(inicio.getTime() + 3 * 3600 * 1000), direccion: 'Parque de prueba', localidadId: (await localidad()).id,
      capacidadMaxima, estado, publicadoEn: estado === 'publicado' ? new Date() : null,
    },
  });
}

/** Reintenta `fn` hasta que devuelva un valor verdadero (efectos asíncronos como notificaciones). */
async function esperarHasta(fn, { timeout = 3000, intervalo = 50 } = {}) {
  const limite = Date.now() + timeout;
  for (;;) {
    const valor = await fn();
    if (valor || Date.now() > limite) return valor;
    await new Promise((r) => setTimeout(r, intervalo));
  }
}

module.exports = {
  PASSWORD, prisma, esperarHasta, bearer, tokenDe, unico, localidad, categoria,
  crearBeneficiario, crearConstructora, crearAdmin, crearMaterial, crearEvento,
};
