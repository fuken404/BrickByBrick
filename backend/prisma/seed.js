/**
 * Seed idempotente de BrickByBrick.
 *
 *   npm run db:seed            → catálogos + configuración + administrador
 *   SEED_DEMO=true npm run db:seed → además usuarios y datos de demostración
 *
 * Credenciales de prueba (solo entornos de desarrollo):
 *   Administrador : admin@brickbybrick.co        / Admin@BrickByBrick2024  (MFA por correo; en dev el código se imprime en el log)
 *   Beneficiarios : beneficiario1..3@test.co      / Test@1234
 *   Constructoras : constructora1..2@test.co      / Test@1234  (la 1 está verificada, la 2 pendiente de verificación)
 *
 * Con SEED_DEMO=true las cuentas anteriores se dejan siempre en ese estado aunque
 * ya existan: contraseña, cuenta activa y correo verificado (útil para reiniciar
 * las pruebas). Sin SEED_DEMO nunca se modifica un administrador existente.
 *
 * Producción (NODE_ENV=production): el administrador se crea con ADMIN_EMAIL y
 * ADMIN_PASSWORD; si ADMIN_PASSWORD no está definida no se crea.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const LOCALIDADES = [
  'Usaquén', 'Chapinero', 'Santa Fe', 'San Cristóbal', 'Usme', 'Tunjuelito', 'Bosa', 'Kennedy',
  'Fontibón', 'Engativá', 'Suba', 'Barrios Unidos', 'Teusaquillo', 'Los Mártires', 'Antonio Nariño',
  'Puente Aranda', 'La Candelaria', 'Rafael Uribe Uribe', 'Ciudad Bolívar', 'Sumapaz',
];

const CATEGORIAS = [
  { nombre: 'Ladrillo y bloque',        colorHex: '#C0392B', icono: 'grid_view' },
  { nombre: 'Cemento y concreto',       colorHex: '#7F8C8D', icono: 'texture' },
  { nombre: 'Arena, grava y agregados', colorHex: '#D4A017', icono: 'landscape' },
  { nombre: 'Madera',                   colorHex: '#8B4513', icono: 'forest' },
  { nombre: 'Acero y hierro',           colorHex: '#2C3E50', icono: 'hardware' },
  { nombre: 'Cerámica y porcelanato',   colorHex: '#E67E22', icono: 'grid_on' },
  { nombre: 'Vidrio y ventanería',      colorHex: '#2E86AB', icono: 'window' },
  { nombre: 'Pintura y acabados',       colorHex: '#27AE60', icono: 'format_paint' },
  { nombre: 'Tubería y plomería',       colorHex: '#16A085', icono: 'plumbing' },
  { nombre: 'Material eléctrico',       colorHex: '#B7950B', icono: 'electrical_services' },
  { nombre: 'Puertas y carpintería',    colorHex: '#6D4C41', icono: 'door_front' },
  { nombre: 'Otros',                    colorHex: '#95A5A6', icono: 'category' },
];

const CONFIGURACION = {
  maxSolicitudesActivasBeneficiario: 5,
  maxFotosMaterial: 5,
  diasRecordatorioVencimiento: 3,
  umbralReportesOcultar: 5,
  porcentajeDescuentoTributario: 25,
  topeDescuentoSobreImpuesto: 25,
  emailSoporte: 'soporte@brickbybrick.co',
  modoMantenimiento: false,
};

const PASSWORD_ADMIN = 'Admin@BrickByBrick2024';
const PASSWORD_DEMO = 'Test@1234';

const RONDAS = Math.min(14, Math.max(10, Number(process.env.BCRYPT_ROUNDS) || 12));
const hash = (plain) => bcrypt.hash(plain, RONDAS);
const dias = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

/** Marca en configuracion_sistema de que los catálogos iniciales ya se cargaron. */
const MARCA_CATALOGOS = '_seed_catalogos';

async function catalogos() {
  if (await prisma.configuracionSistema.findUnique({ where: { clave: MARCA_CATALOGOS } })) return false;
  for (const nombre of LOCALIDADES) {
    await prisma.localidad.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  for (const c of CATEGORIAS) {
    await prisma.categoriaMaterial.upsert({ where: { nombre: c.nombre }, update: { colorHex: c.colorHex, icono: c.icono }, create: c });
  }
  for (const [clave, valor] of Object.entries(CONFIGURACION)) {
    await prisma.configuracionSistema.upsert({ where: { clave }, update: {}, create: { clave, valor } });
  }
  await prisma.configuracionSistema.create({ data: { clave: MARCA_CATALOGOS, valor: 1 } });
  return true;
}

/**
 * Crea el administrador. En producción la contraseña debe venir en ADMIN_PASSWORD
 * (el repositorio es público: la contraseña de desarrollo no sirve allí).
 */
async function administrador({ restablecer = false } = {}) {
  const produccion = process.env.NODE_ENV === 'production';
  const email = (process.env.ADMIN_EMAIL || 'admin@brickbybrick.co').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || (produccion ? null : PASSWORD_ADMIN);
  if (!password) {
    // eslint-disable-next-line no-console
    console.warn('[seed] ADMIN_PASSWORD no está definida: no se crea ni modifica el administrador.');
    return;
  }
  if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 10 caracteres, con mayúscula, minúscula y número.');
  }
  // Si ya existe y no hay que restablecerlo, no se calcula el hash (bcrypt es lento en instancias pequeñas)
  const existe = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });
  if (existe && !restablecer) return;
  const passwordHash = await hash(password);
  await prisma.usuario.upsert({
    where: { email },
    update: { passwordHash, estado: 'activo', emailVerificado: true, mfaHabilitado: true },
    create: {
      email,
      passwordHash,
      rol: 'ADMINISTRADOR',
      estado: 'activo',
      emailVerificado: true,
      mfaHabilitado: true,
    },
  });
}

async function demo() {
  const localidad = async (nombre) => (await prisma.localidad.findUnique({ where: { nombre } })).id;
  const categoria = async (nombre) => (await prisma.categoriaMaterial.findUnique({ where: { nombre } })).id;
  const passwordHash = await hash(PASSWORD_DEMO);
  /** Estado garantizado de las cuentas demo aunque ya existan (MFA apagado para entrar directo). */
  const cuentaDemo = { passwordHash, estado: 'activo', emailVerificado: true, mfaHabilitado: false };

  // Beneficiarios
  const beneficiarios = [
    { email: 'beneficiario1@test.co', nombreCompleto: 'María García López',  cedula: '1020304050', estrato: 2, loc: 'Bosa',           alimentador: false, emprendimiento: null },
    { email: 'beneficiario2@test.co', nombreCompleto: 'Carlos Rincón Pérez', cedula: '1030405060', estrato: 3, loc: 'Kennedy',        alimentador: true,  emprendimiento: 'Taller Reutiliza' },
    { email: 'beneficiario3@test.co', nombreCompleto: 'Ana Moreno Castillo', cedula: '1040506070', estrato: 1, loc: 'Ciudad Bolívar', alimentador: false, emprendimiento: null },
  ];
  const benIds = [];
  for (const b of beneficiarios) {
    const u = await prisma.usuario.upsert({
      where: { email: b.email },
      update: cuentaDemo,
      create: {
        email: b.email, passwordHash, rol: 'BENEFICIARIO', emailVerificado: true, telefono: '3001234567',
        beneficiario: {
          create: {
            nombreCompleto: b.nombreCompleto, cedula: b.cedula, estrato: b.estrato, genero: 'prefiero_no_decir',
            localidadId: await localidad(b.loc), esAlimentadorWeb: b.alimentador,
            nombreEmprendimiento: b.emprendimiento, portafolioPublico: Boolean(b.emprendimiento),
            bioPublica: b.emprendimiento ? 'Transformamos madera y ladrillo recuperado en muebles y huertas urbanas.' : null,
          },
        },
      },
      include: { beneficiario: true },
    });
    benIds.push(u);
  }

  // Constructoras
  const constructoras = [
    { email: 'constructora1@test.co', razonSocial: 'Constructora Demo Andina S.A.S', nit: '900111222-1', loc: 'Chapinero', verificada: true },
    { email: 'constructora2@test.co', razonSocial: 'Edificaciones Demo Ltda',        nit: '900333444-5', loc: 'Engativá',  verificada: false },
  ];
  const consIds = [];
  for (const c of constructoras) {
    const u = await prisma.usuario.upsert({
      where: { email: c.email },
      update: cuentaDemo,
      create: {
        email: c.email, passwordHash, rol: 'CONSTRUCTORA', emailVerificado: true, telefono: '6013201234',
        constructora: {
          create: {
            razonSocial: c.razonSocial, nit: c.nit, representanteLegal: 'Representante Demo',
            cargoRepresentante: 'Gerente General', direccion: 'Calle 100 # 10-20', localidadId: await localidad(c.loc),
            descripcion: 'Empresa de demostración para pruebas de la plataforma.',
            verificada: c.verificada, fechaVerificacion: c.verificada ? new Date() : null,
          },
        },
      },
      include: { constructora: true },
    });
    consIds.push(u);
  }

  const constructora = consIds[0].constructora;
  const yaTieneMateriales = await prisma.material.count({ where: { constructoraId: constructora.id } });
  if (yaTieneMateriales) return;

  const materiales = [
    { nombre: 'Ladrillo prensado estándar 25x12x6', cat: 'Ladrillo y bloque', cantidad: 1200, unidad: 'unidades', valor: 1200, estado: 'buen_estado' },
    { nombre: 'Tablones de pino 3 m',                cat: 'Madera',            cantidad: 40,   unidad: 'unidades', valor: 28000, estado: 'usado' },
    { nombre: 'Porcelanato 60x60 beige',             cat: 'Cerámica y porcelanato', cantidad: 85, unidad: 'm²', valor: 45000, estado: 'nuevo' },
    { nombre: 'Sacos de cemento gris 50 kg',         cat: 'Cemento y concreto', cantidad: 30,  unidad: 'sacos', valor: 32000, estado: 'nuevo' },
  ];
  for (const m of materiales) {
    await prisma.material.create({
      data: {
        constructoraId: constructora.id, categoriaId: await categoria(m.cat), nombre: m.nombre,
        descripcion: 'Excedente de obra en buen estado, listo para retiro.', estadoMaterial: m.estado,
        cantidad: m.cantidad, cantidadInicial: m.cantidad, unidadMedida: m.unidad, valorUnitarioCop: m.valor,
        condicionesRetiro: 'Retiro en obra de lunes a viernes de 8:00 a 16:00. Traer transporte propio.',
        fechaLimite: dias(45), estadoPublicacion: 'activo', publicadoEn: new Date(),
      },
    });
  }

  await prisma.evento.create({
    data: {
      constructoraId: constructora.id, nombre: 'Jornada de entrega de materiales — Bosa', tipoEvento: 'entrega_masiva',
      descripcion: 'Entrega de ladrillo y madera recuperados para mejoramiento de vivienda.',
      fechaInicio: dias(10), fechaFin: new Date(dias(10).getTime() + 4 * 60 * 60 * 1000),
      direccion: 'Parque principal de Bosa', localidadId: await localidad('Bosa'), capacidadMaxima: 30,
      estado: 'publicado', publicadoEn: new Date(),
    },
  });

  await prisma.publicacion.create({
    data: {
      autorId: benIds[1].id, tipo: 'producto', titulo: 'Banca para huerta con madera recuperada',
      contenido: 'Con tablones donados construimos bancas para la huerta comunitaria del barrio. ¡Así se ve la economía circular!',
    },
  });

  const grupo = await prisma.grupo.create({
    data: {
      nombre: 'Reutilizadores de Kennedy', descripcion: 'Ideas y proyectos con material reutilizado.',
      creadorId: benIds[1].id, temas: { create: [{ tema: 'madera' }, { tema: 'huertas' }] },
      miembros: { create: [{ usuarioId: benIds[1].id, rol: 'admin' }] },
    },
  });
  await prisma.mensajeGrupo.create({
    data: { grupoId: grupo.id, autorId: benIds[1].id, contenido: '¡Bienvenidos al grupo!' },
  });
}

async function main() {
  await catalogos();
  const conDemo = process.env.SEED_DEMO === 'true';
  await administrador({ restablecer: conDemo });
  if (conDemo) await demo();
  // eslint-disable-next-line no-console
  console.log(`Seed completado${process.env.SEED_DEMO === 'true' ? ' (con datos demo)' : ''}.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
