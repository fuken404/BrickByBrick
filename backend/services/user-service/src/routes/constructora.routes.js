const router = require('express').Router();
const ctrl   = require('../controllers/constructora.controller');
const { authMiddleware, requireRoles, validateBody, upload, uploadDoc } = require('@brickbybrick/shared');
const { updateConstructoraSchema } = require('../validators/constructora.validators');

// GET /api/v1/constructoras — público
router.get('/', ctrl.list);

// GET /api/v1/constructoras/:id — público
router.get('/:id', ctrl.getOne);

// PUT /api/v1/constructoras/:id — propia constructora o admin
router.put('/:id', authMiddleware, validateBody(updateConstructoraSchema), ctrl.update);

// PATCH /api/v1/constructoras/:id/verificar — solo admin
router.patch('/:id/verificar', authMiddleware, requireRoles('ADMINISTRADOR'), ctrl.verificar);

// POST /api/v1/constructoras/:id/documentos — propia constructora o admin
router.post('/:id/documentos', authMiddleware, uploadDoc.single('documento'), ctrl.subirDocumento);

// POST /api/v1/constructoras/:id/logo — propia constructora o admin
router.post('/:id/logo', authMiddleware, upload.single('logo'), ctrl.actualizarLogo);

module.exports = router;
