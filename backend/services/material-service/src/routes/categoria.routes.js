const router = require('express').Router();
const { prisma, authMiddleware, requireRoles, sendSuccess } = require('@brickbybrick/shared');

router.get('/', async (_req, res, next) => {
  try {
    const cats = await prisma.categoriaMaterial.findMany({ orderBy: { nombre: 'asc' } });
    sendSuccess(res, cats);
  } catch (err) { next(err); }
});

router.post('/',
  authMiddleware, requireRoles('ADMINISTRADOR'),
  async (req, res, next) => {
    try {
      const { nombre, colorHex, icono } = req.body;
      const cat = await prisma.categoriaMaterial.create({ data: { nombre, colorHex, icono } });
      sendSuccess(res, cat, 'Categoría creada', 201);
    } catch (err) { next(err); }
  }
);

router.put('/:id',
  authMiddleware, requireRoles('ADMINISTRADOR'),
  async (req, res, next) => {
    try {
      const { nombre, colorHex, icono } = req.body;
      const cat = await prisma.categoriaMaterial.update({
        where: { id: Number(req.params.id) },
        data: { nombre, colorHex, icono },
      });
      sendSuccess(res, cat, 'Categoría actualizada');
    } catch (err) { next(err); }
  }
);

router.delete('/:id',
  authMiddleware, requireRoles('ADMINISTRADOR'),
  async (req, res, next) => {
    try {
      await prisma.categoriaMaterial.delete({ where: { id: Number(req.params.id) } });
      sendSuccess(res, null, 'Categoría eliminada');
    } catch (err) { next(err); }
  }
);

module.exports = router;
