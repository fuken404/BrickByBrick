const router = require('express').Router();
const ctrl   = require('../controllers/beneficiario.controller');
const { authMiddleware, requireRoles, validateBody } = require('@brickbybrick/shared');
const { updateBeneficiarioSchema } = require('../validators/beneficiario.validators');

// GET /api/v1/beneficiarios — solo admin
router.get('/', authMiddleware, requireRoles('ADMINISTRADOR'), ctrl.list);

// GET /api/v1/beneficiarios/:id — propio o admin
router.get('/:id', authMiddleware, ctrl.getOne);

// PUT /api/v1/beneficiarios/:id — propio o admin
router.put('/:id', authMiddleware, validateBody(updateBeneficiarioSchema), ctrl.update);

// DELETE /api/v1/beneficiarios/:id — solo admin
router.delete('/:id', authMiddleware, requireRoles('ADMINISTRADOR'), ctrl.remove);

// PATCH /api/v1/beneficiarios/:id/alimentador — solo admin
router.patch('/:id/alimentador', authMiddleware, requireRoles('ADMINISTRADOR'), ctrl.toggleAlimentador);

module.exports = router;
