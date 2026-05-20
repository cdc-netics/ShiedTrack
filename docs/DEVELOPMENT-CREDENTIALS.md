# Credenciales y usuarios de desarrollo

Referencia **solo para desarrollo y pruebas**. No uses estas contrasenas en produccion.

## Seeds: que hacer (Docker vs pnpm)

| Situacion | Accion |
|-----------|--------|
| **Solo Docker Compose** (`docker compose up`) | El contenedor **backend** al arrancar ejecuta `seed:owner` y luego `seed:test` ([backend/docker-entrypoint.sh](../backend/docker-entrypoint.sh)). Revisa `docker compose logs backend` si algo falla. |
| **Repetir seeds en Docker** (sin entrar al contenedor en modo interactivo) | Desde la raiz del repo: `docker compose exec backend pnpm run seed:owner` y `docker compose exec backend pnpm run seed:test`. |
| **Backend con pnpm en tu PC** (sin Docker del API) | En carpeta `backend/`: `pnpm run seed:owner` y luego `pnpm run seed:test`. |
| **Los dos** | Si Docker ya dejo los seeds OK, **no** repitas seeds manuales salvo que borres la volumetria de Mongo y quieras repoblar. |

**Los usuarios de prueba no se configuran en `.env`.** Las contrasenas vienen de los scripts (`Admin123!`, `Password123!`) documentadas abajo.

## Donde estan definidos en codigo

| Origen | Descripcion |
|--------|-------------|
| [frontend/src/app/features/auth/login/login.component.ts](../frontend/src/app/features/auth/login/login.component.ts) | Modo desarrollo en pantalla de login (`DEV_USERS`). |
| [backend/scripts/seeds/seed-test-data.js](../backend/scripts/seeds/seed-test-data.js) | Usuarios P0 y datos de prueba. |
| [backend/scripts/seeds/create-owner.js](../backend/scripts/seeds/create-owner.js) | Primer usuario OWNER (`admin@shieldtrack.com`). |

## Usuarios de prueba (tras seed)

| Correo | Rol | Contrasena |
|--------|-----|------------|
| admin@shieldtrack.com | OWNER | Admin123! |
| owner@shieldtrack.com | OWNER | Password123! |
| platformadmin@shieldtrack.com | PLATFORM_ADMIN | Password123! |
| clientadmin@acmecorp.com | CLIENT_ADMIN | Password123! |
| areaadmin@acmecorp.com | AREA_ADMIN | Password123! |
| analyst@shieldtrack.com | ANALYST | Password123! |
| viewer@shieldtrack.com | VIEWER | Password123! |

## Si el login falla

1. `docker compose ps` � el servicio `backend` debe estar `running`.
2. `docker compose logs backend` � buscar errores de Mongo, seeds o arranque.
3. CORS: ver [README](../README.md) y variable `CORS_ORIGINS` en `.env`.
4. **`.env` con Docker:** `MONGODB_URI` debe usar el host `mongodb` (nombre del servicio), no `localhost`, dentro de los contenedores. Usuario y contrasena deben coincidir con `MONGO_INITDB_ROOT_*`.

## MongoDB en Docker

En [.env.example](../.env.example) se definen `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD` y `MONGODB_URI` (con `authSource=admin` para el usuario root). Si cambia la contrasena, actualice **las tres** de forma coherente; si la contrasena tiene caracteres reservados en URI (`@ : / ? #`), codifiquela en la URI.

Si activo credenciales sobre un volumen de datos que ya existia sin auth, puede necesitar `docker compose down -v` en desarrollo (borra datos) antes de volver a levantar.

## Variables sensibles

- `JWT_SECRET` en `.env` (raiz) para Compose.
- No subir `.env` al repositorio.
