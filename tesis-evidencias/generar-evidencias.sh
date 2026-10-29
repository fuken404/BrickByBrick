#!/usr/bin/env bash
# =============================================================
# Evidencias del Capítulo 4 (objetivos 3 y 4) — BrickByBrick
#
#   Desde la raíz del repositorio:   bash tesis-evidencias/generar-evidencias.sh
#
# Requisitos: Docker Desktop abierto, Node 20+, dependencias instaladas
# (npm install en backend/ y frontend/). Tarda entre 10 y 15 minutos.
# Solo trabaja contra la base LOCAL de Docker: si backend/.env apunta a
# Neon u otra base remota, el script se detiene sin tocar nada.
# =============================================================
set -uo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
EVI="$RAIZ/tesis-evidencias"
OUT="$EVI/resultados"
mkdir -p "$OUT"
cd "$RAIZ/backend"

paso() { printf '\n\033[1;31m▶ %s\033[0m\n' "$1"; }

# --- 0. Seguridad: solo base local ----------------------------
DBURL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"')"
case "$DBURL" in
  *@localhost:*|*@127.0.0.1:*) ;;
  *) echo "backend/.env no apunta a una base local (DATABASE_URL=$DBURL)."
     echo "Para no modificar datos reales, usa la base de Docker:"
     echo '  DATABASE_URL="postgresql://brickbybrick:brickbybrick_dev@localhost:5434/brickbybrick"'
     exit 1 ;;
esac

paso "1/6 Base de datos local (Docker)"
docker compose up -d postgres || { echo "Abre Docker Desktop y vuelve a intentar"; exit 1; }
for i in $(seq 1 30); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' brickbybrick_db 2>/dev/null)" = "healthy" ] && break
  sleep 2
done
npm run db:generate >/dev/null

paso "2/6 Pruebas de integración del backend (Jest) con cobertura"
npx jest --runInBand --coverage --coverageReporters=json-summary --coverageReporters=text-summary \
  --json --outputFile="$OUT/jest.json" > "$OUT/jest.txt" 2>&1
tail -15 "$OUT/jest.txt"
cp coverage/coverage-summary.json "$OUT/cobertura-backend.json" 2>/dev/null

paso "3/6 Pruebas del frontend (Vitest)"
( cd "$RAIZ/frontend" && npx ng test --watch=false > "$OUT/vitest.txt" 2>&1 ); tail -6 "$OUT/vitest.txt"

paso "4/6 Auditoría de dependencias de producción (npm audit)"
npm audit --omit=dev --json > "$OUT/audit-backend.json" 2>/dev/null
( cd "$RAIZ/frontend" && npm audit --omit=dev --json > "$OUT/audit-frontend.json" 2>/dev/null )

paso "5/6 Plataforma completa con datos de demostración"
npm run db:migrate >/dev/null && SEED_DEMO=true npm run db:seed >/dev/null
CLIENT_IP_HEADER=x-carga-ip LOG_LEVEL=error npm start > "$OUT/servidor.log" 2>&1 &
SERVIDOR=$!
trap 'kill $SERVIDOR 2>/dev/null; pkill -f "services/.*/src/index.js" 2>/dev/null' EXIT
for i in $(seq 1 150); do
  curl -sf http://localhost:3000/health >/dev/null && break
  sleep 2
done
if ! curl -sf http://localhost:3000/health > "$OUT/health.json"; then
  echo "La plataforma no respondió en 5 minutos; revisa $OUT/servidor.log. No se ejecutan las pruebas de seguridad ni de carga."
  exit 1
fi

paso "6/6 Pruebas de seguridad y de desempeño"
( cd "$EVI" && [ -d node_modules ] || npm install --no-audit --no-fund >/dev/null )
node "$EVI/seguridad.js" "$OUT" | tee "$OUT/seguridad.txt"
node "$EVI/carga.js" "$OUT" | tee "$OUT/carga.txt"

node "$EVI/resumen.js" "$OUT"
printf '\n\033[1;32m✔ Listo. Envía la carpeta tesis-evidencias/resultados (sobre todo RESUMEN.md).\033[0m\n'
