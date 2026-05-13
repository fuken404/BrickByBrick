const router = require('express').Router();
const ctrl   = require('../controllers/evento.controller');
const { authMiddleware, requireRoles, validateBody } = require('@brickbybrick/shared');
const { createEventoSchema, updateEventoSchema, asistenciaSchema } = require('../validators/evento.validators');

router.get('/',    ctrl.list);

router.get('/mis-eventos',
  authMiddleware, requireRoles('CONSTRUCTORA'),
  ctrl.listMios);

router.get('/:id', ctrl.getOne);

router.post('/',
  authMiddleware, requireRoles('CONSTRUCTORA'),
  validateBody(createEventoSchema), ctrl.create);

router.put('/:id',
  authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'),
  validateBody(updateEventoSchema), ctrl.update);

router.delete('/:id',
  authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'),
  ctrl.remove);

router.get('/:id/inscritos',
  authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'),
  ctrl.getInscritos);

router.post('/:id/inscribirme',
  authMiddleware, requireRoles('BENEFICIARIO'),
  ctrl.inscribirse);

router.delete('/:id/inscribirme',
  authMiddleware, requireRoles('BENEFICIARIO'),
  ctrl.desinscribirse);

router.patch('/:id/asistencia',
  authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'),
  validateBody(asistenciaSchema), ctrl.marcarAsistencia);

router.get('/:id/inscritos/export',
  authMiddleware, requireRoles('CONSTRUCTORA', 'ADMINISTRADOR'),
  ctrl.exportInscritos);

module.exports = router;
