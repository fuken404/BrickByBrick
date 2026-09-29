const router = require('express').Router();
const ctrl = require('../controllers/constructora.controller');
const {
  authMiddleware, optionalAuth, requireRoles, validateBody, upload, uploadDoc,
} = require('@brickbybrick/shared');
const v = require('../validators/usuario.validators');

const validarSegunRol = (req, res, next) =>
  validateBody(req.user.rol === 'ADMINISTRADOR' ? v.adminUpdateConstructoraSchema : v.updateConstructoraSchema)(req, res, next);

/**
 * @swagger
 * /api/v1/constructoras:
 *   get:
 *     tags: [Constructoras]
 *     summary: Lista constructoras verificadas (el administrador ve todas con datos completos)
 *     security: []
 */
router.get('/', optionalAuth, ctrl.listar);
router.get('/:id', optionalAuth, ctrl.obtener);
router.put('/:id', authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'), validarSegunRol, ctrl.actualizar);
router.post('/:id/documentos', authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'),
  uploadDoc.single('documento'), validateBody(v.documentoSchema), ctrl.subirDocumento);
router.post('/:id/logo', authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'), upload.single('logo'), ctrl.logo);

module.exports = router;
