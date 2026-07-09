#!/bin/sh
set -e

if [ -f dist/main.js ]; then
  MAIN_JS=dist/main.js
elif [ -f dist/src/main.js ]; then
  MAIN_JS=dist/src/main.js
else
  echo "❌ No se encontró dist/main.js ni dist/src/main.js. Ejecute pnpm run build en la carpeta backend (nest build)."
  exit 1
fi

echo "🌱 Ejecutando carga de datos iniciales (Seeds)..."
# Llamamos node directamente para evitar que pnpm 11 dispare runDepsStatusCheck
# (que regenera node_modules sin --shamefully-hoist y rompe la resolución de módulos)
if node scripts/seeds/create-owner.js; then
  echo "✅ seed:owner finalizado"
else
  echo "⚠️  seed:owner falló, pero se continúa para no bloquear el arranque del backend"
fi

RUN_TEST_SEEDS_NORMALIZED=$(echo "${RUN_TEST_SEEDS:-false}" | tr '[:upper:]' '[:lower:]')
if [ "$RUN_TEST_SEEDS_NORMALIZED" = "true" ] || [ "$RUN_TEST_SEEDS_NORMALIZED" = "1" ] || [ "$RUN_TEST_SEEDS_NORMALIZED" = "yes" ]; then
  echo "🌱 RUN_TEST_SEEDS=$RUN_TEST_SEEDS -> ejecutando seed:test"
  if node scripts/seeds/seed-test-data.js; then
    echo "✅ seed:test finalizado"
  else
    echo "⚠️  seed:test falló, pero se continúa para no bloquear el arranque del backend"
  fi
else
  echo "⏭️  RUN_TEST_SEEDS=${RUN_TEST_SEEDS:-false} -> omitiendo seed:test"
fi

echo "🚀 Iniciando aplicación..."
exec node "$MAIN_JS"
