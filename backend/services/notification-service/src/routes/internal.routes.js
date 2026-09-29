/**
 * Rutas internas (comunicación entre microservicios), protegidas por x-internal-key.
 */
const router = require('express').Router();
const { z } = require('zod');
const { requireInternalKey, validateBody, sendSuccess } = require('@brickbybrick/shared');
const { emitir } = require('../socket/socket.handler');

const emitSchema = z.object({
  usuarioIds: z.array(z.string().uuid()).max(1000).optional(),
  room:       z.string().regex(/^grupo:[0-9a-f-]{36}$/).optional(),
  evento:     z.string().regex(/^[a-z:_]{3,40}$/),
  payload:    z.unknown(),
}).refine((d) => d.usuarioIds?.length || d.room, { message: 'Indica usuarioIds o room' });

router.post('/emit', requireInternalKey, validateBody(emitSchema), (req, res) => {
  emitir(req.validatedBody);
  sendSuccess(res, null, 'Emitido');
});

module.exports = router;
