const router  = require('express').Router();
const ctrl    = require('../controllers/solicitud.controller');
const { authMiddleware, requireRoles, validateBody } = require('@brickbybrick/shared');
const { cambioEstadoSolicitudSchema, calificacionSchema } = require('../validators/solicitud.validators');

// GET /api/v1/solicitudes — admin
router.get('/',
  authMiddleware,
  requireRoles('ADMINISTRADOR'),
  ctrl.listAll);

// GET /api/v1/solicitudes/recibidas — constructora
router.get('/recibidas',
  authMiddleware,
  requireRoles('CONSTRUCTORA'),
  ctrl.listByConstructora);

// GET /api/v1/solicitudes/mis-solicitudes — beneficiario
router.get('/mis-solicitudes',
  authMiddleware,
  requireRoles('BENEFICIARIO'),
  ctrl.listByBeneficiario);

// PATCH /api/v1/solicitudes/:id/estado — constructora o admin
router.patch('/:id/estado',
  authMiddleware,
  requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'),
  validateBody(cambioEstadoSolicitudSchema),
  ctrl.cambiarEstado);

// POST /api/v1/solicitudes/:id/calificacion — beneficiario
router.post('/:id/calificacion',
  authMiddleware,
  requireRoles('BENEFICIARIO'),
  validateBody(calificacionSchema),
  ctrl.calificar);

module.exports = router;
