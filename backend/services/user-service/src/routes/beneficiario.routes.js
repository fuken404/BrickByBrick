const router = require('express').Router();
const ctrl = require('../controllers/beneficiario.controller');
const { authMiddleware, requireRoles, validateBody } = require('@brickbybrick/shared');
const v = require('../validators/usuario.validators');

const validarSegunRol = (req, res, next) =>
  validateBody(req.user.rol === 'ADMINISTRADOR' ? v.adminUpdateBeneficiarioSchema : v.updateBeneficiarioSchema)(req, res, next);

/**
 * @swagger
 * /api/v1/beneficiarios:
 *   get:
 *     tags: [Beneficiarios]
 *     summary: Lista beneficiarios (solo administrador)
 */
router.get('/', authMiddleware, requireRoles('ADMINISTRADOR'), ctrl.listar);
router.get('/:id', authMiddleware, ctrl.obtener);
router.put('/:id', authMiddleware, requireRoles('BENEFICIARIO', 'ADMINISTRADOR'), validarSegunRol, ctrl.actualizar);
router.put('/:id/portafolio', authMiddleware, requireRoles('BENEFICIARIO'), validateBody(v.portafolioSchema), ctrl.portafolio);
router.patch('/:id/alimentador', authMiddleware, requireRoles('ADMINISTRADOR'), ctrl.toggleAlimentador);

module.exports = router;
