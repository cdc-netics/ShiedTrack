#!/bin/bash

# Script mejorado para iniciar el backend de ShieldTrack
# Intenta iniciar MongoDB si no está corriendo y luego inicia el servidor

set -e

BACKEND_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backend"
DATA_PATH="$BACKEND_PATH/data/db"

echo "🔍 Verificando si MongoDB está corriendo..."

# Verificar si MongoDB está disponible
MONGO_RUNNING=false
if timeout 3 mongosh --eval "db.version()" >/dev/null 2>&1; then
    MONGO_RUNNING=true
    echo "✅ MongoDB está disponible"
else
    echo "❌ MongoDB no está disponible. Intentando iniciar..."
    
    # Detectar el SO
    OS_TYPE=$(uname -s)
    
    if [ "$OS_TYPE" == "Linux" ]; then
        # Intentar iniciar con systemctl
        if sudo systemctl status mongod >/dev/null 2>&1; then
            echo "🚀 Iniciando MongoDB con systemctl..."
            sudo systemctl start mongod
            sleep 3
            MONGO_RUNNING=true
            echo "✅ MongoDB iniciado correctamente"
        elif sudo systemctl status mongodb >/dev/null 2>&1; then
            echo "🚀 Iniciando MongoDB con systemctl (mongodb)..."
            sudo systemctl start mongodb
            sleep 3
            MONGO_RUNNING=true
            echo "✅ MongoDB iniciado correctamente"
        fi
        
        # Si no funciona con systemctl, intentar mongod directamente
        if [ "$MONGO_RUNNING" = false ]; then
            echo "🚀 Intentando ejecutar mongod directamente..."
            mkdir -p "$DATA_PATH"
            nohup mongod --dbpath "$DATA_PATH" > /tmp/mongod.log 2>&1 &
            sleep 3
            if pgrep mongod > /dev/null; then
                MONGO_RUNNING=true
                echo "✅ MongoDB iniciado (mongod en background)"
            fi
        fi
        
    elif [ "$OS_TYPE" == "Darwin" ]; then
        # macOS - Intentar Homebrew
        if brew services list | grep mongodb-community >/dev/null 2>&1; then
            echo "🚀 Iniciando MongoDB con Homebrew..."
            brew services start mongodb-community
            sleep 3
            MONGO_RUNNING=true
            echo "✅ MongoDB iniciado correctamente"
        else
            # Intentar mongod directamente
            echo "🚀 Intentando ejecutar mongod directamente..."
            mkdir -p "$DATA_PATH"
            nohup mongod --dbpath "$DATA_PATH" > /tmp/mongod.log 2>&1 &
            sleep 3
            if pgrep mongod > /dev/null; then
                MONGO_RUNNING=true
                echo "✅ MongoDB iniciado (mongod en background)"
            fi
        fi
    fi
fi

if [ "$MONGO_RUNNING" = false ]; then
    echo "⚠️ ADVERTENCIA: MongoDB no está disponible"
    echo "El backend intentará conectarse automáticamente con reintentos..."
fi

echo ""
echo "🏗️ Compilando backend..."
cd "$BACKEND_PATH"

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Compilar TypeScript
echo "⚙️ Compilando TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error en la compilación"
    exit 1
fi

echo ""
echo "🚀 Iniciando servidor backend..."
echo "El backend reintentará conectarse a MongoDB automáticamente si es necesario"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Iniciar backend
node dist/main.js
