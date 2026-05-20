#!/bin/bash

# =========================================
# 🛡️ SHIELDTRACK - MASTER STARTUP SCRIPT (BASH)
# =========================================

ROOT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PATH="$ROOT_PATH/backend"
FRONTEND_PATH="$ROOT_PATH/frontend"

echo "╔════════════════════════════════════════════════╗"
echo "║       🛡️  INICIANDO SHIELDTRACK 🛡️            ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# 1. Limpiar procesos anteriores
echo "🧹 Limpiando procesos de Node anteriores..."
pkill -f node || true
sleep 2

# 2. Verificar/Iniciar MongoDB
echo "🔍 Verificando estado de MongoDB..."
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "⚠️  Herramientas de MongoDB no encontradas en PATH."
fi

MONGO_RUNNING=false
if timeout 2 bash -c 'cat < /dev/tcp/localhost/27017' &> /dev/null; then
    MONGO_RUNNING=true
    echo "✅ MongoDB ya está corriendo."
else
    echo "❌ MongoDB no está disponible. Intentando iniciar..."
    # Intentar con systemctl (Linux)
    if command -v systemctl &> /dev/null; then
        sudo systemctl start mongod || sudo systemctl start mongodb || true
        sleep 5
    fi
    # Intentar con brew (macOS)
    if command -v brew &> /dev/null; then
        brew services start mongodb-community || true
        sleep 5
    fi
fi

# 3. Iniciar Backend y Frontend
# En Bash, usaremos procesos en background o pantallas si están disponibles.
# Por simplicidad, los iniciaremos en background y mostraremos logs.

echo "📦 Iniciando Backend..."
cd "$BACKEND_PATH"
if [ ! -d "node_modules" ]; then pnpm install; fi
pnpm run build
nohup node dist/main.js > "$ROOT_PATH/backend.log" 2>&1 &
BACKEND_PID=$!

echo "🎨 Iniciando Frontend..."
cd "$FRONTEND_PATH"
if [ ! -d "node_modules" ]; then pnpm install; fi
nohup pnpm start > "$ROOT_PATH/frontend.log" 2>&1 &
FRONTEND_PID=$!

echo ""
echo "⏳ Verificando disponibilidad de servicios (espera 20s)..."
sleep 20

echo "═══════════════════════════════════════════"
echo " ✅ SISTEMA INICIADO EN BACKGROUND"
echo "   Backend PID: $BACKEND_PID (Logs en backend.log)"
echo "   Frontend PID: $FRONTEND_PID (Logs en frontend.log)"
echo ""
echo "   Frontend: http://localhost:4200"
echo "   Backend:  http://localhost:3000"
echo "═══════════════════════════════════════════"
echo ""
echo "Para detener, usa: pkill -f node"
