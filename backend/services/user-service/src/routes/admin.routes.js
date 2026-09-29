const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authMiddleware, requireRoles, validateBody, validateQuery } = require('@brickbybrick/shared');
const v = require('../validators/usuario.validators');

router.use(authMiddleware, requireRoles('ADMINISTRADOR'));

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     tags: [Administración]
 *     summary: Conteos generales, impacto y series mensuales
 * /api/v1/admin/metricas:
 *   get:
 *     tags: [Administración]
 *     summary: Indicadores de la investigación (IPE, TPA, TEA, impacto)
 */
router.get('/dashboard', ctrl.dashboard);
router.get('/metricas', ctrl.metricas);

router.get('/usuarios', validateQuery(v.listarUsuariosSchema), ctrl.usuarios);
router.patch('/usuarios/:id/estado', validateBody(v.cambiarEstadoUsuarioSchema), ctrl.estadoUsuario);

router.patch('/constructoras/:id/verificacion', validateBody(v.verificacionSchema), ctrl.verificacion);
router.patch('/documentos/:id', validateBody(v.revisarDocumentoSchema), ctrl.documento);

router.get('/configuracion', ctrl.configuracion);
router.put('/configuracion', validateBody(v.configuracionSchema), ctrl.guardarConfiguracion);

router.get('/auditoria', ctrl.auditoria);

/**
 * @swagger
 * /api/v1/admin/exportar/{tipo}:
 *   get:
 *     tags: [Administración]
 *     summary: Exporta CSV (solicitudes | usuarios | eventos)
 */
router.get('/exportar/:tipo', ctrl.exportar);

module.exports = router;
