# Troubleshooting - ShieldTrack

Guia corta y actualizada para resolver fallos comunes con el flujo recomendado (Docker Compose).

## Flujo recomendado

1. Levantar stack desde la raiz:

```bash
docker compose build --no-cache
docker compose up -d
```

2. Ver estado:

```bash
docker compose ps
```

3. Ver logs backend/mongo cuando algo falla:

```bash
docker compose logs backend --tail 120
docker compose logs mongodb --tail 120
```

## Problemas comunes

### 1) Frontend muestra 502 / API no responde

Causa habitual: backend no arranco o esta reiniciando.

Pasos:

```bash
docker compose ps
docker compose logs backend --tail 120
```

Si falta build de backend o `dist/main.js`, reconstruir backend:

```bash
docker compose build --no-cache backend
docker compose up -d backend
```

### 2) Error de autenticacion MongoDB

Causa habitual: credenciales de `.env` no coinciden con volumen ya inicializado.

Validar que estas variables sean coherentes entre si:

- `MONGO_INITDB_ROOT_USERNAME`
- `MONGO_INITDB_ROOT_PASSWORD`
- `MONGODB_URI` (con `authSource=admin`)

Si es entorno local de desarrollo y puedes perder datos:

```bash
docker compose down -v
docker compose up -d
```

### 3) Login falla aunque el stack este arriba

Revisar seeds y usuarios:

```bash
docker compose logs backend --tail 120
docker compose exec backend pnpm run seed:owner
docker compose exec backend pnpm run seed:test
```

Credenciales de desarrollo: [docs/DEVELOPMENT-CREDENTIALS.md](docs/DEVELOPMENT-CREDENTIALS.md)

### 4) CORS bloquea peticiones del frontend

Revisar en `.env`:

- `FRONTEND_URL`
- `CORS_ORIGINS`

Luego recrear backend:

```bash
docker compose up -d --build backend
```

### 5) Puerto ocupado (3000, 80, 27017)

Cambia en `.env`:

- `BACKEND_PORT`
- `FRONTEND_PORT`
- `MONGO_PORT`

Y vuelve a levantar:

```bash
docker compose up -d --build
```

## Referencias canonicas

- Setup general: [SETUP.md](SETUP.md)
- Variables y despliegue: [DEPLOYMENT.md](DEPLOYMENT.md)
- API y contratos: [API.md](API.md)
- Indice de documentacion: [README.md](README.md)
