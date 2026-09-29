const router = require('express').Router();
const ctrl = require('../controllers/evento.controller');
const {
  authMiddleware, optionalAuth, requireRoles, validateBody, validateQuery, upload,
} = require('@brickbybrick/shared');
const v = require('../validators/evento.validators');

const CONSTRUCTORA_O_ADMIN = [authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR')];

/**
 * @swagger
 * tags:
 *   name: Eventos
 *   description: Eventos de distribución, talleres e inscripciones
 */

/**
 * @swagger
 * /api/v1/eventos:
 *   get:
 *     tags: [Eventos]
 *     summary: Eventos publicados (próximos por defecto). Incluye miInscripcion para beneficiarios
 *     security: []
 *   post:
 *     tags: [Eventos]
 *     summary: Crea un evento (borrador o publicado) con materiales asociados
 */
router.get('/', optionalAuth, validateQuery(v.filtrosEventoSchema), ctrl.listar);
router.get('/mis-eventos', authMiddleware, requireRoles('CONSTRUCTORA'), validateQuery(v.filtrosEventoSchema), ctrl.listarMios);
router.get('/mis-inscripciones', authMiddleware, requireRoles('BENEFICIARIO'), validateQuery(v.filtrosEventoSchema), ctrl.misInscripciones);
router.get('/admin', authMiddleware, requireRoles('ADMINISTRADOR'), validateQuery(v.filtrosEventoSchema), ctrl.listarAdmin);
router.get('/:id', optionalAuth, ctrl.obtener);

router.post('/', authMiddleware, requireRoles('CONSTRUCTORA'), validateBody(v.createEventoSchema), ctrl.crear);
router.put('/:id', ...CONSTRUCTORA_O_ADMIN, validateBody(v.updateEventoSchema), ctrl.actualizar);
router.patch('/:id/estado', ...CONSTRUCTORA_O_ADMIN, validateBody(v.cambioEstadoSchema), ctrl.cambiarEstado);
router.delete('/:id', ...CONSTRUCTORA_O_ADMIN, ctrl.eliminar);
router.post('/:id/imagen', ...CONSTRUCTORA_O_ADMIN, upload.single('imagen'), ctrl.imagen);

/**
 * @swagger
 * /api/v1/eventos/{id}/inscripcion:
 *   post:
 *     tags: [Eventos]
 *     summary: Inscribe al beneficiario (respeta el cupo)
 *   delete:
 *     tags: [Eventos]
 *     summary: Cancela la inscripción del beneficiario
 */
router.post('/:id/inscripcion', authMiddleware, requireRoles('BENEFICIARIO'), ctrl.inscribirse);
router.delete('/:id/inscripcion', authMiddleware, requireRoles('BENEFICIARIO'), ctrl.cancelarInscripcion);

router.get('/:id/inscritos', ...CONSTRUCTORA_O_ADMIN, ctrl.inscritos);
router.get('/:id/inscritos/export', ...CONSTRUCTORA_O_ADMIN, ctrl.exportar);
router.patch('/:id/asistencia', ...CONSTRUCTORA_O_ADMIN, validateBody(v.asistenciaSchema), ctrl.asistencia);

module.exports = router;
