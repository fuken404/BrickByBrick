const router = require('express').Router();
const ctrl   = require('../controllers/grupo.controller');
const { authMiddleware, validateBody } = require('@brickbybrick/shared');
const { createGrupoSchema, mensajeSchema } = require('../validators/grupo.validators');

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/',       authMiddleware, validateBody(createGrupoSchema), ctrl.create);
router.post('/:id/unirse',   authMiddleware, ctrl.unirse);
router.delete('/:id/salir',  authMiddleware, ctrl.salir);
router.get('/:id/mensajes',  authMiddleware, ctrl.getMensajes);
router.post('/:id/mensajes', authMiddleware, validateBody(mensajeSchema), ctrl.addMensaje);

module.exports = router;
