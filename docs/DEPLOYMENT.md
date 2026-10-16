# Despliegue de ShieldTrack

Cómo desplegar ShieldTrack en un servidor (QA o producción). Para instalar en un equipo de desarrollo, ver [SETUP.md](SETUP.md). Para la operación diaria una vez desplegado, ver [OPERATIONS.md](OPERATIONS.md).

---

## 1. Topología

ShieldTrack se despliega como **un único stack Docker Compose** con tres contenedores en la red `shieldtrack-network`:

| Servicio Compose | Contenedor | Imagen | Puerto interno | Puerto en el host |
| --- | --- | --- | --- | --- |
| `frontend` | `shieldtrack-frontend` | Nginx con el build de Angular | 80 | `FRONTEND_PORT` (80) |
| `backend` | `shieldtrack-backend` | Node 22 + NestJS (`dist/main.js`) | 3000 | `BACKEND_PORT` (3000) |
| `mongodb` | `shieldtrack-db` | `mongo:8.0` | 27017 | `MONGO_PORT` (27017) |

- El navegador solo necesita llegar al **frontend**: Nginx sirve la SPA y reenvía `/api/*` a `backend:3000` (ver [frontend/nginx.conf](../frontend/nginx.conf)).
- El puerto del backend se publica para Swagger (`/api/docs`) y el health check de Jenkins.
- El puerto de Mongo se publica para administración (Compass, `mongosh`, backups externos).

### Volúmenes persistentes

| Volumen | Montado en | Contenido |
| --- | --- | --- |
| `mongodb_data` | `/data/db` (mongodb) | Base de datos |
| `evidence_uploads` | `/app/backend/uploads/evidence` (backend) | Archivos de evidencia subidos |
| `backups_data` | `/app/backend/backups` (backend) | Respaldos generados desde la aplicación |

`docker compose down` conserva los volúmenes. **`docker compose down -v` los borra**: base de datos, evidencias y respaldos.

---

## 2. Requisitos del servidor

- Linux x86_64 con Docker Engine 24+ y el plugin `docker compose` v2.
- 2 vCPU y 4 GB RAM como mínimo (el build de Angular es lo que más consume).
- Disco para Mongo, evidencias (límite de 100 MB por archivo) y respaldos.
- Acceso a Docker Hub (`node:22-alpine`, `nginx:alpine`, `mongo:8.0`) y al registry de npm durante el build.
- Puertos `FRONTEND_PORT`, `BACKEND_PORT` y `MONGO_PORT` libres.

No hace falta Node.js ni pnpm en el servidor: todo se compila dentro de las imágenes.

---

## 3. Variables de entorno

Compose lee **solo el `.env` de la raíz** (plantilla: [.env.example](../.env.example)).

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `JWT_SECRET` | Sí | Secreto de firma JWT. Cadena aleatoria larga (`openssl rand -base64 48`). Cambiarlo invalida todas las sesiones. |
| `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` | Sí | Usuario root de Mongo. **Solo se aplican al crear el volumen `mongodb_data` por primera vez.** |
| `OWNER_SEED_EMAIL` / `OWNER_SEED_PASSWORD` | Sí | Primer usuario OWNER, creado al arrancar el backend si no existe. |
| `PUBLIC_HOST` | Sí en servidores | Host o IP con que los usuarios abren el sitio. Se usa para `FRONTEND_URL` y `CORS_ORIGINS`. |
| `NODE_ENV` | Recomendado | `production` en servidores (CORS estricto). Compose usa `development` si no se define. |
| `FRONTEND_PORT` / `BACKEND_PORT` / `MONGO_PORT` | No | Puertos del host. Defaults `80` / `3000` / `27017`. |
| `SMTP_ENCRYPTION_KEY` | Sí en producción | Clave AES (32 caracteres) con que se cifra la contraseña SMTP guardada en Mongo. Si no se define, se usa una clave por defecto conocida. Definirla **antes** de configurar SMTP; si se cambia después, hay que reingresar la contraseña SMTP. |
| `JWT_EXPIRES_IN` | No | Duración de la sesión. Default `8h`. |
| `ALLOW_OWNER_RESET` | No | `true` reescribe la contraseña y el rol del OWNER en cada arranque. Úsalo solo para recuperar acceso y vuelve a `false`. |
| `RUN_TEST_SEEDS` | No | `true` carga usuarios y datos de prueba. **Nunca en producción.** |

Variables que **no** se definen en `.env` porque [docker-compose.yml](../docker-compose.yml) las construye:

- `MONGODB_URI` = `mongodb://<user>:<pass>@mongodb:27017/shieldtrack?authSource=admin`
- `FRONTEND_URL` = `http://<PUBLIC_HOST>:<FRONTEND_PORT>`
- `CORS_ORIGINS` = localhost, 127.0.0.1, `:4200` (dev) y `http://<PUBLIC_HOST>:<FRONTEND_PORT>`

Si la contraseña de Mongo tiene caracteres reservados de URI (`@ : / ? # %`), cámbiala por una alfanumérica o la URI no funcionará.

> **SMTP y branding** no son variables de entorno del stack Docker: se configuran desde la aplicación (**Administración → Configuración**, `/admin/config`) y quedan guardados en MongoDB. Ver [OPERATIONS.md](OPERATIONS.md#configuración-inicial-después-del-primer-despliegue).

---

## 4. Despliegue manual en un servidor

```bash
# 1. Obtener el código
git clone https://github.com/cdc-netics/ShiedTrack.git /opt/shieldtrack
cd /opt/shieldtrack
git checkout main            # o la rama/tag a desplegar

# 2. Configurar entorno
cp .env.example .env
#   editar .env: JWT_SECRET, MONGO_INITDB_ROOT_PASSWORD, OWNER_SEED_PASSWORD,
#                PUBLIC_HOST, NODE_ENV=production, RUN_TEST_SEEDS=false
chmod 600 .env

# 3. Construir y levantar
docker compose up -d --build

# 4. Verificar
docker compose ps                          # los 3 servicios "running"; mongodb "healthy"
docker compose logs backend --tail 50      # buscar "seed:owner finalizado" y el arranque de Nest
curl -fs http://localhost:${BACKEND_PORT:-3000}/api/docs >/dev/null && echo OK
```

Luego abrir `http://<PUBLIC_HOST>:<FRONTEND_PORT>` e iniciar sesión con `OWNER_SEED_EMAIL` / `OWNER_SEED_PASSWORD`. Cambiar esa contraseña desde el perfil en el primer ingreso.

### Alternativa: generar el `.env` desde variables

[deploy/compose-env.sh](../deploy/compose-env.sh) escribe el `.env` a partir de variables exportadas (es lo que usa Jenkins). Por defecto deja `NODE_ENV=production` y `RUN_TEST_SEEDS=false`.

```bash
export JWT_SECRET='...' ADMIN_PASSWORD='...' MONGO_INITDB_ROOT_PASSWORD='...'
export PUBLIC_HOST=10.0.101.70 FRONTEND_PORT=8090 BACKEND_PORT=3001 MONGO_PORT=27018
sh ./deploy/compose-env.sh prod
```

`ADMIN_PASSWORD` se escribe como `OWNER_SEED_PASSWORD`.

---

## 5. Despliegue automatizado con Jenkins (ambiente QA)

El [Jenkinsfile](../Jenkinsfile) despliega en el servidor de QA (`10.0.101.70`, directorio `/opt/shieldtrack`).

**Parámetros del job**

| Parámetro | Default | Uso |
| --- | --- | --- |
| `BRANCH` | `development` | Rama a desplegar |
| `MONGO_PORT` | `27018` | Puerto de Mongo en el host QA |
| `BACKEND_PORT` | `3001` | Puerto de API/Swagger |
| `FRONTEND_PORT` | `8090` | Puerto de la aplicación web |

**Credenciales requeridas en Jenkins**

| ID | Tipo | Se usa como |
| --- | --- | --- |
| `github-token` | Usuario/token | Checkout del repo |
| `jenkins-ssh-key` | SSH private key | Acceso `root` al servidor QA |
| `shieldtrack-mongo-password` | Secret text | `MONGO_INITDB_ROOT_PASSWORD` |
| `certvault-jwt-secret` | Secret text | `JWT_SECRET` |
| `shieldtrack-admin-password` | Secret text | `OWNER_SEED_PASSWORD` |

**Etapas**

1. **Checkout** de `BRANCH`.
2. **Generate .env** con `deploy/compose-env.sh qa` (`PUBLIC_HOST=10.0.101.70`).
3. **Deploy to QA**: `docker compose down -v` en el servidor, borra `/opt/shieldtrack`, copia el workspace por `scp` y ejecuta `docker compose up -d --build`.
4. **Health check**: espera hasta 2 minutos a que `http://10.0.101.70:<BACKEND_PORT>/api/docs` responda.
5. **Post**: envía un correo con el resultado y limpia el workspace.

> ⚠️ **El job de QA borra los volúmenes en cada ejecución** (`down -v`): base de datos, evidencias y respaldos de QA se pierden en cada despliegue. Es intencional para QA. **No reutilizar este flujo para producción**: allí se debe usar `docker compose up -d --build` sin `down -v` (ver [OPERATIONS.md](OPERATIONS.md#actualizar-a-una-nueva-versión)).

URLs de QA con los parámetros por defecto:

- Aplicación: `http://10.0.101.70:8090`
- Swagger: `http://10.0.101.70:3001/api/docs`

---

## 6. Checklist de producción

- [ ] `JWT_SECRET`, `MONGO_INITDB_ROOT_PASSWORD`, `OWNER_SEED_PASSWORD` y `SMTP_ENCRYPTION_KEY` únicos y robustos; `.env` con permisos `600`.
- [ ] `NODE_ENV=production`, `RUN_TEST_SEEDS=false`, `ALLOW_OWNER_RESET=false`.
- [ ] `PUBLIC_HOST` igual al host con que los usuarios abren el sitio (si no, el navegador recibe errores de CORS).
- [ ] **TLS**: el contenedor frontend sirve HTTP en el puerto 80. Poner delante un proxy inverso con certificado (Nginx/Traefik/balanceador corporativo) y publicar solo el 443 hacia los usuarios. Si el sitio se sirve por `https://`, agrega ese origen a `CORS_ORIGINS` en `docker-compose.yml`.
- [ ] Firewall: no exponer `MONGO_PORT` a la red. Restringir `BACKEND_PORT` a la red de administración o quitar su `ports:` si no se necesita Swagger desde fuera.
- [ ] Respaldos automáticos probados, incluida una restauración (ver [OPERATIONS.md](OPERATIONS.md#respaldos-y-restauración)). Respaldar también el volumen `evidence_uploads`.
- [ ] SMTP configurado y probado desde la aplicación (recuperación de contraseña y notificaciones de retest dependen de él).
- [ ] Contraseña del OWNER inicial cambiada.
- [ ] Login, creación de proyecto/hallazgo, subida de evidencia y exportación validados de punta a punta.
