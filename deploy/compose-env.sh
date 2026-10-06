#!/bin/sh
# Genera el archivo .env de ShieldTrack para un ambiente de despliegue (qa, prod, etc.)
# a partir de variables ya exportadas en el entorno (Jenkins withCredentials, o
# exportadas a mano antes de llamar a este script).
#
# Uso: sh ./deploy/compose-env.sh <ambiente>
#
# Variables esperadas en el entorno:
#   Requeridas (sin default, el script falla si faltan):
#     JWT_SECRET, ADMIN_PASSWORD, MONGO_INITDB_ROOT_PASSWORD
#   Opcionales (con default razonable):
#     MONGO_PORT, BACKEND_PORT, FRONTEND_PORT, NODE_ENV, RUN_TEST_SEEDS,
#     OWNER_SEED_EMAIL, ALLOW_OWNER_RESET, MONGO_INITDB_ROOT_USERNAME, JWT_EXPIRES_IN

set -e

AMBIENTE="${1:-qa}"

: "${JWT_SECRET:?JWT_SECRET no definido (withCredentials: ${PROJECT_NAME:-shieldtrack}-jwt-secret)}"
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD no definido (withCredentials: ${PROJECT_NAME:-shieldtrack}-admin-password)}"
: "${MONGO_INITDB_ROOT_PASSWORD:?MONGO_INITDB_ROOT_PASSWORD no definido (withCredentials: ${PROJECT_NAME:-shieldtrack}-mongo-password)}"

cat > .env <<EOF
# .env generado automaticamente para el ambiente '${AMBIENTE}' - NO editar a mano
# Generado: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

# --- Puertos en el host (deben estar libres en la maquina de destino) ---
MONGO_PORT=${MONGO_PORT:-27017}
BACKEND_PORT=${BACKEND_PORT:-3000}
FRONTEND_PORT=${FRONTEND_PORT:-80}

# --- Backend ---
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-8h}
PORT=3000
NODE_ENV=${NODE_ENV:-production}
RUN_TEST_SEEDS=${RUN_TEST_SEEDS:-false}
OWNER_SEED_EMAIL=${OWNER_SEED_EMAIL:-admin@shieldtrack.com}
OWNER_SEED_PASSWORD=${ADMIN_PASSWORD}
ALLOW_OWNER_RESET=${ALLOW_OWNER_RESET:-false}

# --- MongoDB ---
MONGO_INITDB_ROOT_USERNAME=${MONGO_INITDB_ROOT_USERNAME:-shieldtrack}
MONGO_INITDB_ROOT_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD}
EOF

echo "✓ .env generado para ambiente '${AMBIENTE}' (MONGO_PORT=${MONGO_PORT:-27017} BACKEND_PORT=${BACKEND_PORT:-3000} FRONTEND_PORT=${FRONTEND_PORT:-80})"
