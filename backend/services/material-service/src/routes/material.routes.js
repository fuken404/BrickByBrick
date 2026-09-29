const router = require('express').Router();
const ctrl = require('../controllers/material.controller');
const solCtrl = require('../controllers/solicitud.controller');
const {
  authMiddleware, optionalAuth, requireRoles, validateBody, validateQuery, upload,
} = require('@brickbybrick/shared');
const v = require('../validators/material.validators');
const sv = require('../validators/solicitud.validators');

/**
 * @swagger
 * tags:
 *   name: Materiales
 *   description: Catálogo y gestión de materiales donados
 */

/**
 * @swagger
 * /api/v1/materiales:
 *   get:
 *     tags: [Materiales]
 *     summary: Catálogo público (activos, vigentes y de constructoras verificadas)
 *     security: []
 *   post:
 *     tags: [Materiales]
 *     summary: Crea un material (borrador o publicado)
 */
router.get('/', validateQuery(v.filtrosMaterialSchema), ctrl.listar);
router.get('/mis-materiales', authMiddleware, requireRoles('CONSTRUCTORA'), validateQuery(v.filtrosMaterialSchema), ctrl.listarMios);
router.get('/admin', authMiddleware, requireRoles('ADMINISTRADOR'), validateQuery(v.filtrosMaterialSchema), ctrl.listarAdmin);
router.get('/:id', optionalAuth, ctrl.obtener);

router.post('/', authMiddleware, requireRoles('CONSTRUCTORA'), validateBody(v.createMaterialSchema), ctrl.crear);
router.put('/:id', authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'), validateBody(v.updateMaterialSchema), ctrl.actualizar);
router.patch('/:id/estado', authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'), validateBody(v.cambioEstadoSchema), ctrl.cambiarEstado);
router.delete('/:id', authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'), ctrl.eliminar);

router.post('/:id/fotos', authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'), upload.array('fotos', 10), ctrl.agregarFotos);
router.delete('/:id/fotos/:fotoId', authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'), ctrl.eliminarFoto);

/**
 * @swagger
 * /api/v1/materiales/{id}/solicitudes:
 *   get:
 *     tags: [Solicitudes]
 *     summary: Solicitudes de un material (constructora dueña o admin)
 *   post:
 *     tags: [Solicitudes]
 *     summary: El beneficiario solicita el material
 */
router.get('/:id/solicitudes', authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'),
  validateQuery(sv.filtrosSolicitudSchema), solCtrl.listarPorMaterial);
router.post('/:id/solicitudes', authMiddleware, requireRoles('BENEFICIARIO'), validateBody(sv.createSolicitudSchema), solCtrl.crear);

module.exports = router;
