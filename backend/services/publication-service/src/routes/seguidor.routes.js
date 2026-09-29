const router = require('express').Router();
const ctrl = require('../controllers/seguidor.controller');
const { authMiddleware, optionalAuth } = require('@brickbybrick/shared');

router.post('/:usuarioId', authMiddleware, ctrl.seguir);
router.delete('/:usuarioId', authMiddleware, ctrl.dejar);
router.get('/:usuarioId/seguidores', optionalAuth, ctrl.seguidores);
router.get('/:usuarioId/siguiendo', optionalAuth, ctrl.siguiendo);

module.exports = router;
