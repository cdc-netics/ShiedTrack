# Instalación

Hay dos formas de levantar ShieldTrack:

| Modo | Para qué | Requisitos |
| --- | --- | --- |
| **A. Docker Compose** (recomendado) | Probar la aplicación completa, QA, demos. Es igual a lo que se despliega en servidores. | Docker + Docker Compose v2, Git |
| **B. Desarrollo local** | Programar con recarga en caliente (backend `--watch`, `ng serve`). | Node.js 22+, pnpm 11, Docker (solo para Mongo) o MongoDB 8 local, Git |

Para servidores de QA o producción ver [DEPLOYMENT.md](DEPLOYMENT.md).

---

## A. Docker Compose

### 1. Clonar y configurar

```bash
git clone https://github.com/cdc-netics/ShiedTrack.git
cd ShiedTrack
cp .env.example .env              # PowerShell: Copy-Item .env.example .env
```

En `.env`:

- `JWT_SECRET`: cualquier cadena larga.
- `MONGO_INITDB_ROOT_PASSWORD` y `OWNER_SEED_PASSWORD`: los valores de ejemplo sirven en local.
- `RUN_TEST_SEEDS=true` si quieres usuarios y datos de prueba (ver [DEVELOPMENT-CREDENTIALS.md](DEVELOPMENT-CREDENTIALS.md)).
- Si los puertos 80, 3000 o 27017 están ocupados, cambia `FRONTEND_PORT`, `BACKEND_PORT` o `MONGO_PORT`.

La referencia completa de variables está en [DEPLOYMENT.md](DEPLOYMENT.md#3-variables-de-entorno).

### 2. Levantar

```bash
docker compose up -d --build      # equivalente: pnpm run start:detached
docker compose ps                 # esperar a que mongodb aparezca "healthy" y backend "running"
docker compose logs -f backend    # Ctrl+C para salir; buscar "seed:owner finalizado"
```

El primer build tarda varios minutos (instala dependencias y compila Angular).

### 3. Entrar

| Qué | URL |
| --- | --- |
| Aplicación | `http://localhost` (o `http://localhost:<FRONTEND_PORT>`) |
| Swagger | `http://localhost:<BACKEND_PORT>/api/docs` |

Inicia sesión con `OWNER_SEED_EMAIL` / `OWNER_SEED_PASSWORD` (por defecto `admin@shieldtrack.com` / `Admin123!`).

### 4. Aplicar cambios de código

```bash
docker compose up -d --build backend     # tras cambios en backend/
docker compose up -d --build frontend    # tras cambios en frontend/
```

Para detener: `docker compose down` (conserva los datos). `docker compose down -v` **borra** base de datos, evidencias y respaldos.

---

## B. Desarrollo local

### 1. Herramientas

```bash
node -v                           # 22.x o superior
corepack enable                   # activa pnpm según "packageManager" (pnpm 11)
pnpm -v
```

El repositorio **solo acepta pnpm**: `npm install` y `yarn` se bloquean a propósito (`scripts/enforce-pnpm.js`).

### 2. Dependencias

```bash
pnpm run install:all              # instala backend/ y frontend/
```

### 3. MongoDB

La forma más simple es usar solo el contenedor de Mongo del compose (requiere el `.env` de la raíz, paso A.1):

```bash
docker compose up -d mongodb
```

O usar un MongoDB 8 instalado localmente o en Atlas.

### 4. Backend

```bash
cd backend
cp .env.example .env
```

En `backend/.env` ajusta `MONGODB_URI`. Con el Mongo del compose y las credenciales de ejemplo queda así:

```
MONGODB_URI=mongodb://shieldtrack:shieldtrack_dev@localhost:27017/shieldtrack?authSource=admin
```

Con Mongo local sin autenticación basta `mongodb://localhost:27017/shieldtrack`.

```bash
pnpm run start:dev                # http://localhost:3000/api/docs, recarga en caliente
```

Los scripts de seeds no leen `backend/.env`, así que pásales la URI explícitamente:

```bash
# Linux/macOS/Git Bash
MONGODB_URI='mongodb://shieldtrack:shieldtrack_dev@localhost:27017/shieldtrack?authSource=admin' pnpm run seed:owner
MONGODB_URI='...' pnpm run seed:test          # opcional: datos de prueba

# PowerShell
$env:MONGODB_URI='mongodb://shieldtrack:shieldtrack_dev@localhost:27017/shieldtrack?authSource=admin'; pnpm run seed:owner
```

### 5. Frontend

```bash
cd frontend
pnpm start                        # http://localhost:4200
```

`ng serve` reenvía `/api` a `http://localhost:3000` mediante [proxy.conf.json](../frontend/proxy.conf.json). No hace falta tocar CORS.

### Archivos `.env`: cuál se usa

| Archivo | Lo usa |
| --- | --- |
| `.env` (raíz) | Docker Compose: los tres contenedores |
| `backend/.env` | Solo `pnpm run start:dev` / `start:prod` ejecutados en `backend/` fuera de Docker |

Ninguno se sube a Git.

---

## Comandos útiles de desarrollo

| Carpeta | Comando | Qué hace |
| --- | --- | --- |
| `backend/` | `pnpm run build` | Compila a `dist/` |
| `backend/` | `pnpm run lint` | ESLint con `--fix` |
| `backend/` | `pnpm test` | Pruebas unitarias (Jest) |
| `backend/` | `pnpm run test:e2e` | Pruebas e2e |
| `frontend/` | `pnpm run build` | Build de Angular |
| `frontend/` | `pnpm exec tsc --noEmit -p tsconfig.app.json` | Solo chequeo de tipos |
| `frontend/` | `pnpm test` | Pruebas Karma |

Guía de pruebas funcionales: [TESTING-GUIDE.md](TESTING-GUIDE.md). Si algo falla: [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
