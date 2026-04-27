#!/bin/sh

echo "⏳ Esperando a que el Backend esté compilado..."
# Esperar a que exista el archivo principal del build
while [ ! -f dist/main.js ]; do
  sleep 2
done

echo "🌱 Ejecutando carga de datos iniciales (Seeds)..."
# Ejecutamos los scripts de seed definidos en tu package.json
npm run seed:owner || echo "⚠️ El owner ya existe o hubo un error"
npm run seed:test || echo "⚠️ Error al cargar datos de prueba"

echo "🚀 Iniciando aplicación..."
exec node dist/main.js
