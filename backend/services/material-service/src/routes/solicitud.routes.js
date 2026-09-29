const router = require('express').Router();
const ctrl = require('../controllers/solicitud.controller');
const { authMiddleware, requireRoles, validateBody, validateQuery } = require('@brickbybrick/shared');
const v = require('../validators/solicitud.validators');

/**
 * @swagger
 * tags:
 *   name: Solicitudes
 *   description: Flujo de donación pendiente → aprobada → entregada
 */

router.use(authMiddleware);

router.get('/', requireRoles('ADMINISTRADOR'), validateQuery(v.filtrosSolicitudSchema), ctrl.listarAdmin);
router.get('/recibidas', requireRoles('CONSTRUCTORA'), validateQuery(v.filtrosSolicitudSchema), ctrl.listarRecibidas);
router.get('/mis-solicitudes', requireRoles('BENEFICIARIO'), validateQuery(v.filtrosSolicitudSchema), ctrl.listarMias);
router.get('/:id', ctrl.obtener);

/**
 * @swagger
 * /api/v1/solicitudes/{id}/estado:
 *   patch:
 *     tags: [Solicitudes]
 *     summary: Aprobar, rechazar, registrar entrega o cancelar (constructora/admin)
 */
router.patch('/:id/estado', requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'), validateBody(v.cambioEstadoSolicitudSchema), ctrl.cambiarEstado);
router.post('/:id/cancelar', requireRoles('BENEFICIARIO'), validateBody(v.cancelarSchema), ctrl.cancelar);
router.post('/:id/confirmar-recepcion', requireRoles('BENEFICIARIO'), validateBody(v.confirmarRecepcionSchema), ctrl.confirmarRecepcion);
router.post('/:id/calificacion', requireRoles('BENEFICIARIO'), validateBody(v.calificacionSchema), ctrl.calificar);

module.exports = router;
