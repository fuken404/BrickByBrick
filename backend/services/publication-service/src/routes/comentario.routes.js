const router = require('express').Router();
const ctrl = require('../controllers/comentario.controller');
const { authMiddleware, validateBody } = require('@brickbybrick/shared');
const v = require('../validators/social.validators');

router.use(authMiddleware);
router.put('/:id', validateBody(v.editarComentarioSchema), ctrl.editar);
router.delete('/:id', ctrl.eliminar);
router.post('/:id/like', ctrl.like);
router.delete('/:id/like', ctrl.unlike);

module.exports = router;
