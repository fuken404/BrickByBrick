const { prisma } = require('@brickbybrick/shared');

const PERFIL_INCLUDE = {
  beneficiario: {
    select: { id: true, nombreCompleto: true, esAlimentadorWeb: true, localidadId: true, nombreEmprendimiento: true },
  },
  constructora: {
    select: { id: true, razonSocial: true, verificada: true, logoUrl: true, localidadId: true },
  },
};

const usuarioRepository = {
  findByEmail(email) {
    return prisma.usuario.findUnique({ where: { email }, include: PERFIL_INCLUDE });
  },

  findById(id) {
    return prisma.usuario.findUnique({ where: { id }, include: PERFIL_INCLUDE });
  },

  existeEmail(email) {
    return prisma.usuario.count({ where: { email } }).then(Boolean);
  },

  existeCedula(cedula) {
    return prisma.beneficiario.count({ where: { cedula } }).then(Boolean);
  },

  existeNit(nit) {
    return prisma.constructora.count({ where: { nit } }).then(Boolean);
  },

  crearBeneficiario({ usuario, beneficiario }) {
    return prisma.usuario.create({
      data: { ...usuario, rol: 'BENEFICIARIO', beneficiario: { create: beneficiario } },
      include: PERFIL_INCLUDE,
    });
  },

  crearConstructora({ usuario, constructora, documentos }) {
    return prisma.usuario.create({
      data: {
        ...usuario,
        rol: 'CONSTRUCTORA',
        constructora: { create: { ...constructora, documentosEmpresa: { create: documentos } } },
      },
      include: PERFIL_INCLUDE,
    });
  },

  update(id, data) {
    return prisma.usuario.update({ where: { id }, data, include: PERFIL_INCLUDE });
  },

  registrarIntento(data) {
    return prisma.intentoLogin.create({ data });
  },
};

module.exports = usuarioRepository;
