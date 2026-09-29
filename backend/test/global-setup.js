/**
 * Prepara la base de pruebas una vez por ejecución: aplica las migraciones,
 * vacía todas las tablas y carga los catálogos (localidades, categorías,
 * configuración y administrador) con el seed.
 */
const path = require('path');
const { execSync } = require('child_process');

module.exports = async () => {
  require('./setup-env');
  const cwd = path.resolve(__dirname, '..');
  const env = { ...process.env, SEED_DEMO: 'false' };

  execSync('npx prisma migrate deploy', { cwd, env, stdio: 'pipe' });

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const tablas = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tablas.length) {
    const lista = tablas.map((t) => `"public"."${t.tablename}"`).join(', ');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${lista} RESTART IDENTITY CASCADE`);
  }
  await prisma.$executeRawUnsafe('ALTER SEQUENCE IF EXISTS constancia_donacion_seq RESTART WITH 1');
  await prisma.$disconnect();

  execSync('node prisma/seed.js', { cwd, env, stdio: 'pipe' });
};
