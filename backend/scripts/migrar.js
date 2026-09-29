/**
 * Aplica las migraciones pendientes. La CLI de Prisma tarda bastante en cargar
 * (unos 20 s con 0,1 CPU), así que primero se comprueba con una consulta si
 * hay algo pendiente y solo entonces se ejecuta `prisma migrate deploy`.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const raiz = path.resolve(__dirname, '..');
const carpeta = path.join(raiz, 'prisma', 'migrations');

async function pendientes() {
  const locales = fs.readdirSync(carpeta, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const prisma = new PrismaClient();
  try {
    const filas = await prisma.$queryRaw`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
    const aplicadas = new Set(filas.map((f) => f.migration_name));
    return locales.filter((m) => !aplicadas.has(m));
  } catch {
    // Base nueva (sin tabla _prisma_migrations) o sin acceso: que decida la CLI
    return locales;
  } finally {
    await prisma.$disconnect();
  }
}

(async () => {
  const faltan = await pendientes();
  if (!faltan.length) {
    console.log('[migraciones] La base de datos está al día; no hay migraciones pendientes.');
    return;
  }
  console.log(`[migraciones] Pendientes: ${faltan.join(', ')}`);
  execFileSync(process.execPath, [path.join(raiz, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy', '--schema=prisma/schema.prisma'], {
    cwd: raiz, stdio: 'inherit',
  });
})().catch((err) => {
  console.error(`[migraciones] Error: ${err.message}`);
  process.exit(1);
});
