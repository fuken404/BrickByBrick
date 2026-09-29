const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');
const { BadRequestError } = require('../errors/app-error');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES   = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];
const EXTENSIONES = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf',
};

const maxBytes = () => Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024;
const uploadsRoot = () => process.env.UPLOADS_DIR || path.resolve(__dirname, '../../uploads');

/**
 * Dónde se guardan los archivos subidos (STORAGE_DRIVER):
 *   local → carpeta UPLOADS_DIR (por defecto; en la nube requiere un disco persistente)
 *   db    → tabla archivos_subidos de PostgreSQL (plataformas sin disco, p. ej. Render gratis)
 * En ambos casos la URL pública es /uploads/<carpeta>/<archivo> y la sirve el gateway.
 */
const almacenamientoEnBd = () => (process.env.STORAGE_DRIVER || 'local').toLowerCase() === 'db';
// Carga diferida: el cliente Prisma solo se necesita con STORAGE_DRIVER=db
const prisma = () => require('../utils/prisma.client');

function buildMulter(allowed, mensaje) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes(), files: 10 },
    fileFilter: (_req, file, cb) => {
      if (!allowed.includes(file.mimetype)) return cb(new BadRequestError(mensaje));
      return cb(null, true);
    },
  });
}

/** Imágenes (fotos de materiales, logos, avatares, publicaciones). */
const upload = buildMulter(ALLOWED_IMAGE_TYPES, 'Tipo de archivo no permitido. Solo JPEG, PNG o WebP.');

/** Documentos (PDF o imagen). */
const uploadDoc = buildMulter(ALLOWED_DOC_TYPES, 'Tipo de archivo no permitido. Solo PDF, JPEG, PNG o WebP.');

/**
 * Guarda un buffer y devuelve la URL pública relativa (/uploads/<folder>/<archivo>).
 * La extensión se deriva del mimetype validado, no del nombre original.
 */
async function uploadToStorage(buffer, folder, _originalname, mimetype) {
  const safeFolder = String(folder).replace(/[^a-z0-9_-]/gi, '');
  const ext = EXTENSIONES[mimetype] || '.bin';
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const ruta = `/uploads/${safeFolder}/${filename}`;

  if (almacenamientoEnBd()) {
    await prisma().archivoSubido.create({ data: { ruta, mimeType: mimetype, tamano: buffer.length, datos: buffer } });
    return ruta;
  }

  const dir = path.join(uploadsRoot(), safeFolder);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, filename), buffer);
  return ruta;
}

/** Elimina un archivo dado su URL pública (/uploads/...). */
async function deleteFromStorage(publicUrl) {
  if (!publicUrl || !publicUrl.startsWith('/uploads/')) return;
  if (almacenamientoEnBd()) {
    await prisma().archivoSubido.deleteMany({ where: { ruta: publicUrl } }).catch(() => {});
    return;
  }
  const root = uploadsRoot();
  const filepath = path.resolve(root, publicUrl.replace('/uploads/', ''));
  if (!filepath.startsWith(root)) return; // evita path traversal
  await fs.promises.unlink(filepath).catch(() => {});
}

module.exports = { upload, uploadDoc, uploadToStorage, deleteFromStorage, uploadsRoot, almacenamientoEnBd };
