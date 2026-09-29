const router = require('express').Router();
const ctrl = require('../controllers/reporte.controller');
const { authMiddleware, requireRoles, validateBody } = require('@brickbybrick/shared');
const v = require('../validators/social.validators');

/**
 * @swagger
 * /api/v1/reportes:
 *   post:
 *     tags: [Moderación]
 *     summary: Reporta una publicación, comentario, material o usuario
 *   get:
 *     tags: [Moderación]
 *     summary: Cola de reportes (administrador)
 */
router.post('/', authMiddleware, validateBody(v.reporteSchema), ctrl.crear);
router.get('/', authMiddleware, requireRoles('ADMINISTRADOR'), ctrl.listar);
router.patch('/:id', authMiddleware, requireRoles('ADMINISTRADOR'), validateBody(v.resolverReporteSchema), ctrl.resolver);

module.exports = router;
