# Solución de problemas

Problemas frecuentes con el stack Docker Compose. Todos los comandos se ejecutan desde la raíz del repositorio.

## Primer diagnóstico

```bash
docker compose ps                          # estado de los 3 servicios
docker compose logs backend --tail 120     # errores de arranque, Mongo, seeds
docker compose logs mongodb --tail 120     # autenticación / healthcheck
docker compose logs frontend --tail 50     # errores de Nginx (502, 413)
```

---

## El frontend muestra 502 Bad Gateway

Nginx no logra llegar a `backend:3000`. El backend no arrancó o se está reiniciando.

1. `docker compose ps`: si `shieldtrack-backend` aparece como `Restarting`, revisa `docker compose logs backend`.
2. Si el log dice que no existe `dist/main.js`, reconstruye sin caché:

   ```bash
   docker compose build --no-cache backend
   docker compose up -d backend
   ```

3. Si el log muestra errores de Mongo, sigue la sección siguiente.

## El backend no conecta a MongoDB / `mongodb` queda `unhealthy`

Causa habitual: el volumen `mongodb_data` se creó con otras credenciales. `MONGO_INITDB_ROOT_*` **solo se aplica la primera vez** que se inicializa el volumen; cambiarlas después en `.env` no cambia el usuario existente (en el log aparece `UserNotFound` o `Authentication failed`).

- **Desarrollo / QA (se pueden perder los datos):**

  ```bash
  docker compose down -v
  docker compose up -d --build
  ```

- **Producción:** no uses `-v`. Vuelve a poner en `.env` las credenciales originales, o cambia la contraseña dentro de Mongo:

  ```bash
  docker compose exec mongodb mongosh -u <usuario_actual> -p <clave_actual> --authenticationDatabase admin \
    --eval 'db.getSiblingDB("admin").changeUserPassword("<usuario>", "<clave_nueva>")'
  ```

  y luego actualiza `MONGO_INITDB_ROOT_PASSWORD` en `.env` y ejecuta `docker compose up -d backend`.

Si la contraseña contiene `@ : / ? # %`, la URI construida por Compose se rompe: usa una contraseña alfanumérica.

## No puedo iniciar sesión

1. Comprueba que el OWNER se creó: en `docker compose logs backend` debe aparecer `seed:owner finalizado`.
2. Vuelve a ejecutar el seed (no modifica un OWNER existente salvo que `ALLOW_OWNER_RESET=true`):

   ```bash
   docker compose exec backend node scripts/seeds/create-owner.js
   ```

3. **Olvidaste la contraseña del OWNER:** pon `ALLOW_OWNER_RESET=true` en `.env`, ejecuta `docker compose up -d backend` (la contraseña vuelve a ser `OWNER_SEED_PASSWORD`), y luego regresa a `ALLOW_OWNER_RESET=false` y repite `docker compose up -d backend`.
4. Usuarios de prueba: solo existen si `RUN_TEST_SEEDS=true`. Ver [DEVELOPMENT-CREDENTIALS.md](DEVELOPMENT-CREDENTIALS.md).

> En el contenedor usa `node scripts/seeds/...` y no `pnpm run seed:*`: con pnpm 11, `pnpm run` puede reinstalar dependencias en tiempo de ejecución y romper `node_modules`.

## Errores de CORS en el navegador

El origen con que abres el sitio no está en `CORS_ORIGINS`. Compose permite `localhost`, `127.0.0.1`, `:4200` y `http://<PUBLIC_HOST>:<FRONTEND_PORT>`.

1. Ajusta `PUBLIC_HOST` (y `FRONTEND_PORT`) en `.env` al host real.
2. Recrea el backend: `docker compose up -d backend`.
3. Si usas HTTPS o un dominio distinto detrás de un proxy, agrega ese origen a `CORS_ORIGINS` en [docker-compose.yml](../docker-compose.yml).

## La subida de evidencia falla con 413

Nginx acepta hasta 110 MB ([frontend/nginx.conf](../frontend/nginx.conf)) y el backend hasta `EVIDENCE_MAX_FILE_SIZE_MB` (100 MB por defecto). Para archivos más grandes (videos), registra la evidencia como enlace externo. Si hay otro proxy delante, revisa su límite de tamaño de cuerpo.

## Puerto ocupado (80, 3000, 27017)

Cambia `FRONTEND_PORT`, `BACKEND_PORT` o `MONGO_PORT` en `.env` y ejecuta `docker compose up -d`.

```bash
# Linux
sudo ss -ltnp | grep -E ':(80|3000|27017)\b'
# Windows
netstat -ano | findstr :3000
```

## Después de actualizar, el navegador muestra la versión anterior o pantallas en blanco

`index.html` se sirve sin caché, pero el navegador puede tener chunks antiguos. Recarga forzada (`Ctrl+F5`). Si persiste, verifica que el frontend se reconstruyó: `docker compose up -d --build frontend`.

## El build falla con `ERR_PNPM_*` o pide usar pnpm

- El repositorio solo admite **pnpm** (`scripts/enforce-pnpm.js` bloquea npm y yarn fuera de Docker).
- Fuera de Docker se requiere Node 22+ y pnpm 11 (`corepack enable`). Ver [SETUP.md](SETUP.md).
- Si cambiaste dependencias, actualiza el lockfile con `pnpm install` en `backend/` o `frontend/` antes de construir: las imágenes usan `--frozen-lockfile`.

---

Más contexto: [SETUP.md](SETUP.md) · [DEPLOYMENT.md](DEPLOYMENT.md) · [OPERATIONS.md](OPERATIONS.md)
