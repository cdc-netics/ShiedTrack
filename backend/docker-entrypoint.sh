#!/bin/sh
set -e

if [ -f dist/main.js ]; then
  MAIN_JS=dist/main.js
elif [ -f dist/src/main.js ]; then
  MAIN_JS=dist/src/main.js
else
  echo "❌ No se encontró dist/main.js ni dist/src/main.js. Ejecute npm run build en la carpeta backend (nest build)."
  exit 1
fi

echo "🌱 Ejecutando carga de datos iniciales (Seeds)..."
# Ejecutamos los scripts de seed definidos en tu package.json
npm run seed:owner

RUN_TEST_SEEDS_NORMALIZED=$(echo "${RUN_TEST_SEEDS:-false}" | tr '[:upper:]' '[:lower:]')
if [ "$RUN_TEST_SEEDS_NORMALIZED" = "true" ] || [ "$RUN_TEST_SEEDS_NORMALIZED" = "1" ] || [ "$RUN_TEST_SEEDS_NORMALIZED" = "yes" ]; then
  echo "🌱 RUN_TEST_SEEDS=$RUN_TEST_SEEDS -> ejecutando seed:test"
  npm run seed:test
else
  echo "⏭️  RUN_TEST_SEEDS=${RUN_TEST_SEEDS:-false} -> omitiendo seed:test"
fi

echo "🚀 Iniciando aplicación..."
exec node "$MAIN_JS"
