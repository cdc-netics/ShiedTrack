# 🔧 Configuración Inicial - ShieldTrack

Guía para poner en marcha ShieldTrack. **El flujo previsto en equipo es Docker**; el desarrollo “todo en el host” es opcional.

## 📋 Pre-requisitos

**Con Docker (recomendado)**

- **Docker** y **Docker Compose** (Plugin V2: `docker compose`).

**Sin Docker (opcional)**

- **Node.js**: v24.x o superior (LTS recomendado).
- **npm**: v10.x o superior.
- **MongoDB**: v6.x u v8.x (local o Atlas).
- **Git**: Para control de versiones.

---

## ⚡ Inicio rápido con Docker

1. **Variables de entorno:** en la raíz del repo, copie `.env.example` a `.env` y defina al menos `JWT_SECRET` (valor largo y aleatorio). Revise `MONGODB_URI`, `FRONTEND_URL` y `CORS_ORIGINS` si su URL no es `http://localhost`.
2. **Usuarios de prueba** (emails y contraseñas del seed y del login en modo desarrollo): **[docs/DEVELOPMENT-CREDENTIALS.md](docs/DEVELOPMENT-CREDENTIALS.md)**.
3. Desde la raíz del repositorio:

```bash
npm start
```

Equivalente: `docker compose up --build`. En segundo plano: `npm run start:detached`. Para parar: `npm run stop`.

- Frontend: **http://localhost** (puerto 80 del host, configurable con `FRONTEND_PORT` en `.env`)
- API: **http://localhost:3000** — Swagger: `/api/docs`

Por defecto **MongoDB en Docker no usa usuario ni contraseña** (solo apropiado en desarrollo local). Detalle, secretos y producción: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

---

## 💻 Desarrollo local sin Docker

### Windows

Script que intenta MongoDB en el sistema y abre backend + frontend:

```powershell
npm run start:local:win
```

### Linux / macOS

```bash
npm run start:local:unix
```

### Manual (cualquier SO)

**1. Backend (NestJS)**

```bash
cd backend
npm install
cp .env.example .env
npm run build
npm start
```

**2. Frontend (Angular)**

```bash
cd frontend
npm install
npm start
```

---

## 🔐 Configuración de Variables (.env)

Partir de `backend/.env.example`. Variables mínimas:

- `MONGODB_URI` — instancia MongoDB (local o Atlas). En Compose use el hostname del servicio (`mongodb`, ver `docker-compose.yml`).
- `JWT_SECRET` — cadena larga y aleatoria (obligatoria en producción).
- `CORS_ORIGINS` — orígenes permitidos separados por comas. Con Angular en `npm start` suele ser `http://localhost:4200`; con el front en Docker en el puerto 80 use `http://localhost` y `http://127.0.0.1` como en Compose.
- `FRONTEND_URL` — referencia del front; también puede alimentar CORS si no define `CORS_ORIGINS`.
- `NODE_ENV` — usar `production` en despliegues reales (política CORS más estricta).

Documentación de API en tiempo de ejecución: **Swagger** en `http://localhost:{PORT}/api/docs`. Detalle en [docs/API.md](docs/API.md) y despliegue en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 🧪 Datos de Prueba

Para cargar datos iniciales y roles de prueba:

```bash
cd backend
npm run seed:test
```

En Docker los seeds de owner/prueba se ejecutan al arrancar el backend (entrypoint).

---

## 🆘 Solución de Problemas Comunes

### Error: "Cannot find module evidence.module"

Ejecute `npm install` nuevamente en la carpeta `backend`.

### Puerto en uso (3000, 80 o 4200)

**Docker:** `docker compose down` y revise que no haya otro stack usando los mismos puertos.

**Windows (proceso en puerto):**

```powershell
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

### MongoDB no conecta

**Docker:** compruebe `docker compose ps` y logs: `docker compose logs mongodb backend`.

**Host local:** servicio MongoDB en marcha o URI correcta en `.env`.

---

📖 Modelo de datos y flujos: **[docs/architecture.md](docs/architecture.md)**. Multi-tenant: **[docs/MULTI-TENANCY.md](docs/MULTI-TENANCY.md)**.
