const router = require('express').Router();
const ctrl = require('../controllers/tributario.controller');
const { authMiddleware, requireRoles, validateQuery } = require('@brickbybrick/shared');
const { resumenSchema } = require('../validators/tributario.validators');

/**
 * @swagger
 * tags:
 *   name: Tributario
 *   description: Resumen de donaciones, constancias y descuento estimado (Art. 255/257 E.T.)
 */

router.use(authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'));

/**
 * @swagger
 * /api/v1/tributario/resumen:
 *   get:
 *     tags: [Tributario]
 *     summary: Valor donado del año, descuento estimado y requisitos
 */
router.get('/resumen', validateQuery(resumenSchema), ctrl.resumen);
router.get('/constancias', validateQuery(resumenSchema), ctrl.constancias);
router.get('/constancias/:solicitudId/pdf', ctrl.constanciaPdf);
router.get('/certificado/:anio/pdf', ctrl.certificadoPdf);

module.exports = router;
