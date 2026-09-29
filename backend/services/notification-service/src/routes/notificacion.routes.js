const router = require('express').Router();
const ctrl = require('../controllers/notificacion.controller');
const { authMiddleware } = require('@brickbybrick/shared');

/**
 * @swagger
 * tags:
 *   name: Notificaciones
 *   description: Bandeja in-app. En tiempo real llegan por Socket.io (evento `notification`, path /ws/notificaciones)
 */
router.use(authMiddleware);
router.get('/', ctrl.listar);
router.get('/no-leidas', ctrl.noLeidas);
router.patch('/leer-todas', ctrl.leerTodas);
router.delete('/leidas', ctrl.eliminarLeidas);
router.patch('/:id/leer', ctrl.leer);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
