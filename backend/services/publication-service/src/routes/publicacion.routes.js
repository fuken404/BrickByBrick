const router = require('express').Router();
const ctrl = require('../controllers/publicacion.controller');
const {
  authMiddleware, optionalAuth, requireRoles, validateBody, validateQuery, upload,
} = require('@brickbybrick/shared');
const v = require('../validators/social.validators');

/**
 * @swagger
 * tags:
 *   name: Comunidad
 *   description: Publicaciones, comentarios, likes y reposts
 */

/**
 * @swagger
 * /api/v1/publicaciones:
 *   get:
 *     tags: [Comunidad]
 *     summary: Feed (todos | siguiendo), filtros por tipo, autor y texto
 *     security: []
 *   post:
 *     tags: [Comunidad]
 *     summary: Crea una publicación (multipart, hasta 5 fotos en `fotos`)
 */
router.get('/', optionalAuth, validateQuery(v.filtrosPublicacionSchema), ctrl.listar);
router.get('/:id', optionalAuth, ctrl.obtener);
router.post('/', authMiddleware, upload.array('fotos', 10), validateBody(v.createPublicacionSchema), ctrl.crear);
router.put('/:id', authMiddleware, validateBody(v.updatePublicacionSchema), ctrl.actualizar);
router.delete('/:id', authMiddleware, ctrl.eliminar);
router.patch('/:id/moderacion', authMiddleware, requireRoles('ADMINISTRADOR'), validateBody(v.moderacionSchema), ctrl.moderar);

router.post('/:id/like', authMiddleware, ctrl.like);
router.delete('/:id/like', authMiddleware, ctrl.unlike);

/**
 * @swagger
 * /api/v1/publicaciones/{id}/repost:
 *   post:
 *     tags: [Comunidad]
 *     summary: Comparte una publicación con comentario opcional
 */
router.post('/:id/repost', authMiddleware, validateBody(v.repostSchema), ctrl.repost);
router.delete('/:id/repost', authMiddleware, ctrl.quitarRepost);

router.get('/:id/comentarios', optionalAuth, ctrl.comentarios);
router.post('/:id/comentarios', authMiddleware, validateBody(v.comentarioSchema), ctrl.comentar);

module.exports = router;
