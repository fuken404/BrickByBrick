const router = require('express').Router();
const ctrl = require('../controllers/conversacion.controller');
const { authMiddleware, validateBody, validateQuery } = require('@brickbybrick/shared');
const v = require('../validators/social.validators');

/**
 * @swagger
 * tags:
 *   name: Mensajes
 *   description: Mensajes directos 1 a 1 (eventos Socket.io dm:mensaje y dm:leido)
 */
router.use(authMiddleware);
router.get('/', ctrl.listar);
router.get('/no-leidos', ctrl.noLeidos);
router.post('/', validateBody(v.conversacionSchema), ctrl.abrir);
router.get('/:id', ctrl.obtener);
router.get('/:id/mensajes', validateQuery(v.cursorSchema), ctrl.mensajes);
router.post('/:id/mensajes', validateBody(v.mensajeSchema), ctrl.enviar);
router.patch('/:id/leer', ctrl.leer);

module.exports = router;
