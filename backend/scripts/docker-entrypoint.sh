#!/bin/sh
# Arranque de la imagen todo en uno:
#   1. aplica las migraciones pendientes de la base de datos
#   2. carga catálogos, configuración y (si se configuró) el administrador
#   3. inicia el gateway y los seis microservicios
set -e
cd /app

echo "[arranque] Revisando migraciones…"
node scripts/migrar.js

echo "[arranque] Cargando catálogos y datos iniciales…"
node prisma/seed.js

echo "[arranque] Iniciando servicios…"
exec node scripts/iniciar-todo.js
