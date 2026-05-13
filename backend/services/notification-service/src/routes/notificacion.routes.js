const router = require('express').Router();
const ctrl   = require('../controllers/notificacion.controller');
const { authMiddleware } = require('@brickbybrick/shared');

router.get('/',                    authMiddleware, ctrl.list);
router.patch('/:id/leer',          authMiddleware, ctrl.marcarLeida);
router.patch('/leer-todas',        authMiddleware, ctrl.marcarTodasLeidas);
router.delete('/:id',              authMiddleware, ctrl.remove);

module.exports = router;
