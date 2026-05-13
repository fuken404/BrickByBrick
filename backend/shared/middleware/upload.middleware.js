const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES   = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Uploads folder at the repo root (backend/uploads)
const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');

// Multer para imágenes (fotos de materiales, logos, etc.)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido. Solo JPEG, PNG o WebP.'));
    }
    cb(null, true);
  },
});

// Multer para documentos (acepta PDF además de imágenes)
const uploadDoc = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido. Solo PDF, JPEG o PNG.'));
    }
    cb(null, true);
  },
});

/**
 * Guarda un buffer en disco y devuelve la URL pública relativa.
 * La URL tiene la forma /uploads/<folder>/<filename> y cada servicio
 * debe servir la carpeta uploads/ como estático.
 */
async function uploadToStorage(buffer, folder, originalname) {
  const dir = path.join(UPLOADS_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });

  const ext      = path.extname(originalname) || '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filepath = path.join(dir, filename);

  fs.writeFileSync(filepath, buffer);

  // URL pública que sirve el servicio via express.static
  return `/uploads/${folder}/${filename}`;
}

/**
 * Elimina un archivo local dado su URL pública (/uploads/...).
 */
async function deleteFromStorage(publicUrl) {
  try {
    if (!publicUrl || !publicUrl.startsWith('/uploads/')) return;
    const filepath = path.join(UPLOADS_ROOT, publicUrl.replace('/uploads/', ''));
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch (err) {
    // No bloquear si falla el borrado
  }
}

module.exports = { upload, uploadDoc, uploadToStorage, deleteFromStorage };
