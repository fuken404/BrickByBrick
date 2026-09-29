const router = require('express').Router();
const ctrl = require('../controllers/grupo.controller');
const {
  authMiddleware, optionalAuth, validateBody, validateQuery, upload,
} = require('@brickbybrick/shared');
const v = require('../validators/social.validators');

/**
 * @swagger
 * tags:
 *   name: Grupos
 *   description: Grupos públicos/privados con chat en tiempo real (sala Socket.io grupo:<id>)
 */
router.get('/', optionalAuth, ctrl.listar);
router.get('/:id', optionalAuth, ctrl.obtener);
router.post('/', authMiddleware, validateBody(v.grupoSchema), ctrl.crear);
router.put('/:id', authMiddleware, validateBody(v.updateGrupoSchema), ctrl.actualizar);
router.post('/:id/imagen', authMiddleware, upload.single('imagen'), ctrl.imagen);
router.delete('/:id', authMiddleware, ctrl.eliminar);

router.post('/:id/unirse', authMiddleware, ctrl.unirse);
router.delete('/:id/miembros/me', authMiddleware, ctrl.salir);
router.get('/:id/miembros', optionalAuth, ctrl.miembros);
router.patch('/:id/miembros/:usuarioId', authMiddleware, validateBody(v.gestionMiembroSchema), ctrl.gestionar);
router.post('/:id/invitaciones', authMiddleware, validateBody(v.invitacionSchema), ctrl.invitar);

router.get('/:id/mensajes', authMiddleware, validateQuery(v.cursorSchema), ctrl.mensajes);
router.post('/:id/mensajes', authMiddleware, validateBody(v.mensajeSchema), ctrl.enviar);

module.exports = router;
