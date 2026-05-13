const router = require('express').Router();
const ctrl   = require('../controllers/publicacion.controller');
const { authMiddleware, validateBody } = require('@brickbybrick/shared');
const { createPublicacionSchema, updatePublicacionSchema, comentarioSchema, reporteSchema } = require('../validators/publicacion.validators');

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/',      authMiddleware, validateBody(createPublicacionSchema), ctrl.create);
router.put('/:id',    authMiddleware, validateBody(updatePublicacionSchema), ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

router.post('/:id/comentarios', authMiddleware, validateBody(comentarioSchema), ctrl.addComentario);
router.delete('/:id/comentarios/:comentarioId', authMiddleware, ctrl.removeComentario); // nota: usa req.params.id como comentarioId

router.post('/:id/like',   authMiddleware, ctrl.addLike);
router.delete('/:id/like', authMiddleware, ctrl.removeLike);

router.post('/reportes', authMiddleware, validateBody(reporteSchema), ctrl.createReporte);

module.exports = router;
