const router = require('express').Router();
const ctrl = require('../controllers/me.controller');
const { authMiddleware, validateBody, upload } = require('@brickbybrick/shared');
const v = require('../validators/usuario.validators');

/**
 * @swagger
 * /api/v1/me:
 *   get:
 *     tags: [Perfil propio]
 *     summary: Datos completos del usuario autenticado
 *   patch:
 *     tags: [Perfil propio]
 *     summary: Actualiza teléfono y preferencias de notificación
 */
router.get('/', authMiddleware, ctrl.obtener);
router.patch('/', authMiddleware, validateBody(v.actualizarMeSchema), ctrl.actualizar);
router.post('/avatar', authMiddleware, upload.single('avatar'), ctrl.avatar);

/**
 * @swagger
 * /api/v1/me/eliminar:
 *   post:
 *     tags: [Perfil propio]
 *     summary: Elimina la cuenta y anonimiza los datos personales (Ley 1581)
 */
router.post('/eliminar', authMiddleware, validateBody(v.eliminarCuentaSchema), ctrl.eliminar);

module.exports = router;
