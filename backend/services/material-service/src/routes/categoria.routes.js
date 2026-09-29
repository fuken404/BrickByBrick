const router = require('express').Router();
const ctrl = require('../controllers/categoria.controller');
const { authMiddleware, requireRoles, validateBody } = require('@brickbybrick/shared');
const { categoriaSchema } = require('../validators/material.validators');

/**
 * @swagger
 * /api/v1/categorias:
 *   get:
 *     tags: [Catálogos]
 *     summary: Categorías de materiales
 *     security: []
 */
router.get('/', ctrl.listar);
router.post('/', authMiddleware, requireRoles('ADMINISTRADOR'), validateBody(categoriaSchema), ctrl.crear);
router.put('/:id', authMiddleware, requireRoles('ADMINISTRADOR'), validateBody(categoriaSchema), ctrl.actualizar);
router.delete('/:id', authMiddleware, requireRoles('ADMINISTRADOR'), ctrl.eliminar);

module.exports = router;
