const router = require('express').Router();
const ctrl   = require('../controllers/material.controller');
const solCtrl = require('../controllers/solicitud.controller');
const { authMiddleware, requireRoles, validateBody, upload } = require('@brickbybrick/shared');
const { createMaterialSchema, updateMaterialSchema, cambioEstadoSchema } = require('../validators/material.validators');
const { createSolicitudSchema } = require('../validators/solicitud.validators');

// Público
router.get('/',    ctrl.list);

// Constructora — mis materiales (debe ir antes de /:id)
router.get('/mis-materiales',
  authMiddleware, requireRoles('CONSTRUCTORA'),
  ctrl.listMios);

router.get('/:id', ctrl.getOne);

// Constructora
router.post('/',
  authMiddleware, requireRoles('CONSTRUCTORA'),
  validateBody(createMaterialSchema),
  ctrl.create);

router.put('/:id',
  authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'),
  validateBody(updateMaterialSchema),
  ctrl.update);

router.delete('/:id',
  authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'),
  ctrl.remove);

router.patch('/:id/estado',
  authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'),
  validateBody(cambioEstadoSchema),
  ctrl.cambiarEstado);

router.post('/:id/fotos',
  authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'),
  upload.array('fotos', 5),
  ctrl.agregarFotos);

// Solicitudes — nested bajo material
router.get('/:id/solicitudes',
  authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'),
  solCtrl.listByMaterial);

router.post('/:id/solicitudes',
  authMiddleware, requireRoles('BENEFICIARIO'),
  validateBody(createSolicitudSchema),
  solCtrl.create);

module.exports = router;
