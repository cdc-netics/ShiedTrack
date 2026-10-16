# Operación

Tareas del día a día con ShieldTrack ya desplegado. Todos los comandos se ejecutan en el servidor, desde el directorio del proyecto (ej. `/opt/shieldtrack`), donde están `docker-compose.yml` y `.env`.

---

## Arrancar, detener y ver estado

| Acción | Comando |
| --- | --- |
| Estado | `docker compose ps` |
| Arrancar o aplicar cambios de `.env` | `docker compose up -d` |
| Reiniciar solo el backend | `docker compose restart backend` |
| Detener (conserva datos) | `docker compose down` |
| Logs en vivo | `docker compose logs -f backend` (o `frontend`, `mongodb`) |
| Últimas líneas | `docker compose logs backend --tail 200` |
| Uso de recursos | `docker stats shieldtrack-backend shieldtrack-db shieldtrack-frontend` |

Los contenedores tienen `restart: unless-stopped`: vuelven solos tras un reinicio del servidor si Docker arranca con el sistema (`systemctl enable docker`).

> ⚠️ Nunca uses `docker compose down -v` en producción: borra los volúmenes de base de datos, evidencias y respaldos.

### Comprobar que funciona

```bash
curl -fs http://localhost:${BACKEND_PORT:-3000}/api/system-config/branding >/dev/null && echo API+DB OK   # endpoint público que consulta Mongo
curl -fsI http://localhost:${FRONTEND_PORT:-80}/ | head -1             # HTTP/1.1 200 OK
```

---

## Configuración inicial (después del primer despliegue)

Inicia sesión con el OWNER (`OWNER_SEED_EMAIL`) y sigue este orden:

1. **Perfil → cambiar contraseña** del OWNER inicial.
2. **Administración → Configuración** (`/admin/config`): servidor SMTP (host, puerto, usuario, contraseña, remitente) y **Probar Conexión**. Sin SMTP no funcionan la recuperación de contraseña ni los avisos de retest.
3. **Administración → Branding** (`/admin/branding`): nombre, logo, favicon y colores.
4. **Clientes** (`/clients`): crear los clientes (cada cliente es un tenant aislado).
5. **Administración → Áreas** (`/admin/areas`): crear áreas por cliente y su prefijo de código de hallazgo.
6. **Administración → Usuarios** (`/admin/users`): crear usuarios y asignarles cliente, áreas y proyectos según su rol (ver [RBAC-PERMISSIONS-MATRIX.md](RBAC-PERMISSIONS-MATRIX.md)).
7. **Proyectos** y **Hallazgos**: el trabajo operativo. Los hallazgos también pueden importarse desde CSV/XLSX en la lista de hallazgos.

---

## Actualizar a una nueva versión

```bash
cd /opt/shieldtrack

# 1. Respaldo previo (ver sección siguiente)
docker compose exec backend sh -c 'mongodump --uri="$MONGODB_URI" --gzip --archive=backups/pre-update_$(date +%Y%m%d_%H%M).archive.gz'

# 2. Traer el código
git fetch && git checkout <tag-o-rama> && git pull

# 3. Revisar si .env.example tiene variables nuevas
diff <(grep -o '^[A-Z_]*' .env.example | sort) <(grep -o '^[A-Z_]*' .env | sort)

# 4. Reconstruir y reiniciar (los volúmenes se conservan)
docker compose up -d --build

# 5. Verificar
docker compose ps && docker compose logs backend --tail 50
```

Si la nueva versión falla, vuelve al commit anterior (`git checkout <commit-anterior>`) y ejecuta `docker compose up -d --build`. Si la base quedó inconsistente, restaura el respaldo del paso 1.

En QA, Jenkins hace todo esto automáticamente, aunque partiendo de una base vacía (ver [DEPLOYMENT.md](DEPLOYMENT.md#5-despliegue-automatizado-con-jenkins-ambiente-qa)).

---

## Respaldos y restauración

### Qué hay que respaldar

| Dato | Dónde | Cubierto por el respaldo de la aplicación |
| --- | --- | --- |
| Base de datos | volumen `mongodb_data` | ✅ sí (`mongodump`) |
| Archivos de evidencia | volumen `evidence_uploads` | ❌ **no**, hay que respaldarlo aparte |
| Configuración | `.env` del servidor | ❌ no; guárdalo en un gestor de secretos |

### Respaldo automático de la base

El backend ejecuta `mongodump` **todos los días a las 02:00** (hora del contenedor; por defecto UTC). Guarda los archivos `shieldtrack_backup_<fecha>.tar.gz` en el volumen `backups_data` y conserva los últimos 30. Son archivos `mongodump --archive --gzip`, no tar reales.

Desde la interfaz, **Administración → Respaldos** (`/admin/backup`, solo OWNER) permite crear, listar, descargar, restaurar y borrar respaldos.

Los respaldos viven en el mismo servidor. **Cópialos fuera** periódicamente:

```bash
docker compose exec backend ls -lh backups/
docker compose cp backend:/app/backend/backups/<archivo> ./respaldos/
```

### Respaldo de evidencias

```bash
docker run --rm \
  -v "$(basename "$PWD")_evidence_uploads":/data:ro \
  -v "$PWD/respaldos":/out \
  alpine tar czf /out/evidencias_$(date +%Y%m%d).tgz -C /data .
```

El nombre real del volumen lleva como prefijo el nombre del proyecto Compose; confírmalo con `docker volume ls | grep evidence`.

### Restaurar la base

Desde la interfaz (**Respaldos → Restaurar**), o por consola. La restauración usa `--drop`: **reemplaza** las colecciones actuales.

```bash
docker compose cp ./respaldos/<archivo> backend:/app/backend/backups/<archivo>
docker compose exec backend sh -c 'mongorestore --uri="$MONGODB_URI" --gzip --archive=backups/<archivo> --drop'
```

### Restaurar evidencias

```bash
docker run --rm \
  -v "$(basename "$PWD")_evidence_uploads":/data \
  -v "$PWD/respaldos":/in \
  alpine sh -c 'tar xzf /in/<archivo>.tgz -C /data'
```

Prueba la restauración en un ambiente aparte al menos una vez antes de depender de ella.

---

## Usuarios y accesos

| Situación | Qué hacer |
| --- | --- |
| Usuario olvidó su contraseña | El propio usuario usa **¿Olvidaste tu contraseña?** en el login (requiere SMTP). Un administrador también puede restablecerla desde **Administración → Usuarios**. |
| OWNER sin acceso | `ALLOW_OWNER_RESET=true` en `.env` → `docker compose up -d backend` (la contraseña vuelve a `OWNER_SEED_PASSWORD`) → volver a `false` → `docker compose up -d backend`. |
| Dar de baja a un usuario | Desactivarlo desde **Administración → Usuarios**. La eliminación física queda reservada al OWNER. |
| Revisar quién hizo qué | **Administración → Auditoría** (`/admin/audit`). |

---

## Rotación de secretos

| Secreto | Procedimiento | Efecto |
| --- | --- | --- |
| `JWT_SECRET` | Cambiar en `.env` → `docker compose up -d backend` | Cierra todas las sesiones |
| `MONGO_INITDB_ROOT_PASSWORD` | Primero cambiarla dentro de Mongo (ver [TROUBLESHOOTING.md](TROUBLESHOOTING.md#el-backend-no-conecta-a-mongodb--mongodb-queda-unhealthy)), después en `.env` → `docker compose up -d` | Ninguno si se hace en ese orden |
| `SMTP_ENCRYPTION_KEY` | Cambiar en `.env` → `docker compose up -d backend` → volver a ingresar la contraseña SMTP en `/admin/config` | La contraseña SMTP guardada deja de poder descifrarse hasta reingresarla |
| `OWNER_SEED_PASSWORD` | Solo se usa al crear el OWNER; cambia la contraseña desde **Perfil** | — |

---

## Scripts de mantenimiento de datos

Están en `backend/scripts/maintenance/run-maintenance.js`. Fueron pensados para **datos de prueba** y varios son destructivos. **No los ejecutes en producción** sin un respaldo previo y sin leer el script.

| Script (`pnpm run …` en `backend/`) | Efecto |
| --- | --- |
| `maintenance:fix-indexes` | Elimina índices únicos antiguos (`code_1`, `name_1`) de `areas`, `users` y `clients`. |
| `maintenance:fix-users` | Reasigna clientes a usuarios de prueba específicos. |
| `maintenance:clean` | ⚠️ Borra **todos** los usuarios `@shieldtrack.com` y `@acmecorp.com`, **incluido el OWNER por defecto**. |
| `maintenance:reset` | ⚠️ Borra **todas** las áreas. |

Dentro del contenedor se ejecutan con node, por ejemplo: `docker compose exec backend node scripts/maintenance/run-maintenance.js fix-indexes`.

---

## Tareas programadas

| Tarea | Horario (hora del contenedor) | Requisito |
| --- | --- | --- |
| Respaldo automático de la base | 02:00 diario | Ninguno |
| Avisos de retest | 09:00 diario | SMTP configurado; proyecto `ACTIVE` con política de retest activa |

Los contenedores usan UTC. Para usar otra zona horaria, agrega `TZ: America/Santiago` (por ejemplo) al `environment` del servicio `backend` en `docker-compose.yml`.

---

## Monitoreo sugerido

- Estado de los contenedores (`docker compose ps`) y reinicios inesperados.
- Espacio en disco de los volúmenes: `docker system df -v`. Las evidencias y los 30 respaldos son lo que más crece.
- Disponibilidad: `GET /api/system-config/branding` (público, consulta la base) o `GET /api/docs`. No hay endpoint `/health` dedicado.
- Errores en los logs del backend: `docker compose logs backend --since 24h | grep -iE 'error|exception'`.
