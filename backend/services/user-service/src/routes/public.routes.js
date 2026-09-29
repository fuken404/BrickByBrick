const router = require('express').Router();
const ctrl = require('../controllers/public.controller');
const { optionalAuth } = require('@brickbybrick/shared');

/**
 * @swagger
 * /api/v1/localidades:
 *   get:
 *     tags: [Catálogos]
 *     summary: Localidades de Bogotá
 *     security: []
 * /api/v1/public/estadisticas:
 *   get:
 *     tags: [Público]
 *     summary: Cifras reales de impacto para la página de inicio
 *     security: []
 * /api/v1/perfiles/{usuarioId}:
 *   get:
 *     tags: [Público]
 *     summary: Perfil público / portafolio de un usuario
 *     security: []
 */
router.get('/localidades', ctrl.localidades);
router.get('/public/estadisticas', ctrl.estadisticas);
router.get('/perfiles/:usuarioId', optionalAuth, ctrl.perfil);

module.exports = router;
