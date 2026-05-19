# Despliegue de ShieldTrack

Guia operativa para desarrollo, Docker Compose y produccion.
La API backend usa prefijo global `api` y la documentacion OpenAPI esta en `api/docs`.

## Requisitos

| Componente | Version recomendada |
| --- | --- |
| Node.js | 24.x (ver `engines` en `package.json` raiz) |
| MongoDB | 8.x (local, Atlas o contenedor `mongo:8.0`) |
| Docker / Compose | Recomendado para flujo principal |

## Dos archivos `.env` (no confundir)

| Ubicacion | Uso |
| --- | --- |
| `.env` en la raiz | Variables de Docker Compose: puertos, `MONGODB_URI`, `MONGO_INITDB_ROOT_*`, `JWT_SECRET`, `CORS_ORIGINS`, etc. |
| `backend/.env` | Solo para correr backend fuera de Docker. |

Con stack completo en Docker, basta el `.env` de la raiz.

## Variables principales

| Variable | Descripcion |
| --- | --- |
| `MONGODB_URI` | URI de conexion (en Compose usa host `mongodb` y `authSource=admin`). |
| `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` | Usuario root inicial de Mongo al crear el volumen por primera vez. |
| `JWT_SECRET` | Secreto JWT (obligatorio robusto en produccion). |
| `JWT_EXPIRES_IN` | Caducidad del token (ej: `8h`). |
| `PORT` | Puerto interno del backend (normalmente `3000`). |
| `NODE_ENV` | `production` para endurecimiento de runtime. |
| `FRONTEND_URL` | URL base esperada del frontend. |
| `CORS_ORIGINS` | Lista de origenes permitidos separados por coma. |
| `SKIP_LOCAL_MONGO_DIAGNOSTICS` | Recomendado `true` en contenedores. |

### Puertos publicados

| Variable | Efecto |
| --- | --- |
| `MONGO_PORT` | Mongo expuesto en host |
| `BACKEND_PORT` | API y Swagger |
| `FRONTEND_PORT` | Aplicacion web |

Defaults comunes: `27017`, `3000`, `80`.

## Mongo con autenticacion en Compose

- `MONGO_INITDB_ROOT_*` aplica en primera inicializacion del volumen `mongodb_data`.
- Si cambias a autenticacion con volumen ya creado sin auth, en desarrollo puede requerir `docker compose down -v` y volver a levantar.
- `MONGODB_URI` debe coincidir con esas credenciales y usar `authSource=admin`.

## Persistencia de datos

- `mongodb_data`: datos de MongoDB.
- `backups_data`: respaldos del backend en `/app/backups`.

## Levantar con Docker Compose

```bash
docker compose build --no-cache
docker compose up -d
docker compose ps
```

Script equivalente desde raiz:

```bash
npm run start:detached
```

URLs:

- Frontend: `http://localhost` o `http://localhost:<FRONTEND_PORT>`
- API Docs: `http://localhost:<BACKEND_PORT>/api/docs`

## Seeds de usuarios de desarrollo

El backend ejecuta seeds al iniciar (entrypoint). Para relanzar manualmente:

```bash
docker compose exec backend npm run seed:owner
docker compose exec backend npm run seed:test
```

Credenciales: `docs/DEVELOPMENT-CREDENTIALS.md`.

## Sin Docker

Backend:

```bash
cd backend
npm ci
cp .env.example .env
npm run build
npm run start:prod
```

Frontend:

```bash
cd frontend
npm ci
npm run build
```

## Checklist de produccion

- [ ] `JWT_SECRET` robusto y unico
- [ ] `MONGODB_URI` al cluster correcto (TLS en Atlas)
- [ ] `MONGO_INITDB_*` y `MONGODB_URI` alineados si usas Mongo en contenedor
- [ ] `CORS_ORIGINS` limitado a origenes validos
- [ ] `NODE_ENV=production`
- [ ] Puertos/firewall revisados
- [ ] Backups probados y persistencia validada
- [ ] Flujo critico de login y operacion validado end-to-end

## Referencias

- Setup: `SETUP.md`
- Testing: `docs/TESTING-GUIDE.md`
- Multi-tenant: `docs/MULTI-TENANCY.md`
