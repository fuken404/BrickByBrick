#!/bin/sh
# =============================================================
# Copia los datos de desarrollo a una base de datos de producción VACÍA.
#
#   sh backend/scripts/restaurar-en-produccion.sh ruta/al/archivo.dump
#
# - Pide la cadena de conexión de forma oculta (no queda en el historial).
# - Se niega a continuar si la base de destino ya tiene tablas.
# - Usa pg_restore dentro de Docker (no hace falta instalar PostgreSQL).
# =============================================================
set -e
DUMP="${1:?Uso: sh restaurar-en-produccion.sh archivo.dump}"
[ -f "$DUMP" ] || { echo "No existe el archivo $DUMP"; exit 1; }
DIR=$(cd "$(dirname "$DUMP")" && pwd)
NOMBRE=$(basename "$DUMP")
RED="${DOCKER_NETWORK:-bridge}"
IMG=postgres:16-alpine  # misma versión que el volcado de desarrollo

printf "Pega la cadena de conexión de la base de PRODUCCIÓN (no se mostrará) y presiona Enter: "
stty -echo 2>/dev/null || true; read -r URL; stty echo 2>/dev/null || true; echo
[ -n "$URL" ] || { echo "No se ingresó ninguna cadena."; exit 1; }

psql_prod() { docker run --rm -i --network "$RED" -e URL="$URL" $IMG sh -c 'psql "$URL" -v ON_ERROR_STOP=1 -tA' ; }

echo "Comprobando que la base de destino esté vacía…"
TABLAS=$(echo "select count(*) from pg_tables where schemaname = 'public';" | psql_prod)
if [ "$TABLAS" != "0" ]; then
  echo "La base de destino ya tiene $TABLAS tablas. Por seguridad no se restaura nada."
  echo "Crea una base de datos nueva y vacía e inténtalo de nuevo."
  exit 1
fi

echo "Restaurando $NOMBRE…"
docker run --rm --network "$RED" -e URL="$URL" -v "$DIR":/d $IMG \
  sh -c 'pg_restore --no-owner --no-privileges --exit-on-error --dbname "$URL" "/d/$0"' "$NOMBRE"

echo "Verificando…"
cat <<'SQL' | psql_prod
select 'usuarios: '       || count(*) from usuarios
union all select 'materiales: '     || count(*) from materiales
union all select 'solicitudes: '    || count(*) from solicitudes_material
union all select 'eventos: '        || count(*) from eventos
union all select 'publicaciones: '  || count(*) from publicaciones
union all select 'migraciones: '    || count(*) from _prisma_migrations where finished_at is not null;
SQL
echo "Listo: los datos de desarrollo quedaron en producción."
