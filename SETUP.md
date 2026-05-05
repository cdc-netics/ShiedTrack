# Configuración inicial - ShieldTrack

Guía para poner en marcha el proyecto. **El flujo previsto es Docker (Compose)**; correr backend y frontend con `npm` en el equipo es opcional.

## Pre-requisitos

**Con Docker (recomendado)**

- Docker y Docker Compose (plugin v2: `docker compose`).

**Sin Docker (opcional)**

- Node.js 24.x o superior.
- npm 10.x o superior.
- MongoDB 6.x u 8.x (local o Atlas).
- Git.

---

## Inicio rápido con Docker

1. **Variables en la raíz del repo**  
   Copie [`.env.example`](.env.example) a **`.env`** (junto a `docker-compose.yml`). Revise como mínimo:
   - **`JWT_SECRET`**: cadena larga y aleatoria (no deje el valor de ejemplo en entornos reales).
   - **MongoDB:** `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD` y **`MONGODB_URI`** deben ser coherentes (mismo usuario/contraseña; en la URI use `authSource=admin` para el root del contenedor). El host dentro de la red Docker es **`mongodb`**, no `localhost`.
   - **Puertos del host:** `MONGO_PORT`, `BACKEND_PORT`, `FRONTEND_PORT` si 27017, 3000 u 80 están ocupados.
   - **`CORS_ORIGINS`** y **`FRONTEND_URL`** si accede al front con otra URL (p. ej. `ng serve` en el puerto 4200).

   Referencia detallada y producción: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

2. **Usuarios de prueba** (tras los seeds): emails y contraseñas en **[docs/DEVELOPMENT-CREDENTIALS.md](docs/DEVELOPMENT-CREDENTIALS.md)**.

3. **Arranque** desde la raíz del repositorio:

```bash
npm start
```

Equivalente: `docker compose up --build`. En segundo plano: `npm run start:detached`. Para parar: `npm run stop`.

### URLs (dependen de `BACKEND_PORT` y `FRONTEND_PORT` en `.env`)

| Servicio | URL típica |
|----------|------------|
| Aplicación web | `http://localhost` si `FRONTEND_PORT=80`, si no `http://localhost:<FRONTEND_PORT>` |
| API / Swagger | `http://localhost:<BACKEND_PORT>/api/docs` (por defecto `BACKEND_PORT=3000`) |

---

## Dos `.env`: raíz vs `backend/`

| Archivo | Cuándo usarlo |
|---------|----------------|
| **`.env` en la raíz** | **Docker Compose**: puertos, Mongo, JWT, CORS, `MONGODB_URI` hacia el servicio `mongodb`. Es la fuente principal al usar `npm start` / `docker compose`. |
| **`backend/.env`** | Solo si ejecuta el backend con **`cd backend && npm start`** (sin contenedor del API). Copie `backend/.env.example` y ponga `MONGODB_URI` acorde (p. ej. `mongodb://localhost:27017/...` con o sin usuario). |

Si todo corre en Docker, no necesita `backend/.env` para que el stack funcione.

---

## Desarrollo local sin Docker

### Windows

```powershell
npm run start:local:win
```

### Linux / macOS

```bash
npm run start:local:unix
```

### Manual

**Backend**

```bash
cd backend
npm install
cp .env.example .env
npm run build
npm start
```

**Frontend**

```bash
cd frontend
npm install
npm start
```

---

## Variables resumidas (backend)

Para el proceso Nest (también inyectadas en el contenedor desde el `.env` de la raíz en Compose):

- **`MONGODB_URI`** — Conexión a MongoDB. En Compose: host `mongodb`. Con usuario root del contenedor: incluya credenciales y `authSource=admin`.
- **`JWT_SECRET`** — Firma de tokens.
- **`CORS_ORIGINS`** — Orígenes separados por comas. Con front en Docker en el puerto 80 suelen bastar `http://localhost` y `http://127.0.0.1`; con `ng serve`, añada `http://localhost:4200`.
- **`FRONTEND_URL`** — Referencia del front.
- **`NODE_ENV`** — En despliegues reales use `production` (CORS más estricto).

Swagger: `http://localhost:<BACKEND_PORT>/api/docs`. Más detalle: [docs/API.md](docs/API.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Datos de prueba (seeds)

En Docker, al arrancar el contenedor **backend** se ejecutan `seed:owner` y `seed:test` ([backend/docker-entrypoint.sh](backend/docker-entrypoint.sh)).

Para repetirlos sin reiniciar el stack:

```bash
docker compose exec backend npm run seed:owner
docker compose exec backend npm run seed:test
```

Sin Docker:

```bash
cd backend
npm run seed:owner
npm run seed:test
```

---

## Solución de problemas

### Error: "Cannot find module …"

Ejecute `npm install` de nuevo en la carpeta `backend` (o `frontend` según el error).

### Puerto en uso (3000, 80, 4200, 27017)

Ajuste `BACKEND_PORT`, `FRONTEND_PORT` o `MONGO_PORT` en el **`.env` de la raíz** y vuelva a levantar Compose.

**Windows (liberar un puerto):**

```powershell
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

### 502 Bad Gateway (nginx / front en Docker)

El front hace proxy al API en el contenedor **backend**. Si el backend está reiniciándose (icono cargando en Docker Desktop) o no arranca:

1. `docker compose logs backend --tail 80` — si aparece que no existe `dist/main.js`, reconstruya: `docker compose build backend --no-cache` y `docker compose up -d`.
2. Compruebe que **Mongo** está healthy y que el volumen tiene el usuario de `MONGODB_URI` (ver sección siguiente).

### MongoDB no conecta

- **Docker:** `docker compose ps` y `docker compose logs mongodb backend`.
- **URI:** Dentro de los contenedores el host debe ser **`mongodb`**. Usuario/contraseña en `MONGODB_URI` deben coincidir con `MONGO_INITDB_ROOT_*`.
- **`dependency failed` / `mongodb` unhealthy:** Volumen creado antes de `MONGO_INITDB_*`: Mongo puede tener `authorization` pero sin el usuario de `MONGODB_URI` en `admin` (logs: `UserNotFound`). El healthcheck hace `ping` sin credenciales y luego con `MONGO_INITDB_ROOT_*`; hay `start_period` y reintentos.
- **Mongo healthy pero el API no conecta:** El tráfico `backend` → hostname `mongodb` no usa la excepción de localhost; hace falta el root creado en la primera inicialización del volumen. Si no existe, use `docker compose down -v` y vuelva a levantar en desarrollo (borra datos locales) o cree el usuario a mano. [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

Modelo de datos: **[docs/architecture.md](docs/architecture.md)**. Multi-tenant: **[docs/MULTI-TENANCY.md](docs/MULTI-TENANCY.md)**.
