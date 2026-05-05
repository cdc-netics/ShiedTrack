#!/bin/sh
set -e

if [ ! -f dist/main.js ]; then
  echo "❌ No se encontró dist/main.js. Revise que la imagen se construyó correctamente (npm run build)."
  exit 1
fi

echo "🌱 Ejecutando carga de datos iniciales (Seeds)..."
# Ejecutamos los scripts de seed definidos en tu package.json
npm run seed:owner || echo "⚠️ El owner ya existe o hubo un error"
npm run seed:test || echo "⚠️ Error al cargar datos de prueba"

echo "🚀 Iniciando aplicación..."
exec node dist/main.js
