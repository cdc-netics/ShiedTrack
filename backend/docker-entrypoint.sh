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
npm run seed:owner || echo "⚠️ El owner ya existe o hubo un error"
npm run seed:test || echo "⚠️ Error al cargar datos de prueba"

echo "🚀 Iniciando aplicación..."
exec node "$MAIN_JS"
