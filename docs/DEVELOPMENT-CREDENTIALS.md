# Credenciales y usuarios de desarrollo

Referencia **solo para entornos de desarrollo y pruebas**. No uses estas contraseñas en producción.

## Dónde se definen

| Origen | Descripción |
|--------|-------------|
| [frontend/src/app/features/auth/login/login.component.ts](../frontend/src/app/features/auth/login/login.component.ts) | Lista desplegable “modo desarrollo” en la pantalla de login (`DEV_USERS`) y contraseñas por defecto. |
| [backend/scripts/seeds/seed-test-data.js](../backend/scripts/seeds/seed-test-data.js) | Crea en MongoDB los mismos correos con roles, clientes/áreas de prueba (`npm run seed:test` en la carpeta `backend`). |
| [backend/scripts/seeds/create-owner.js](../backend/scripts/seeds/create-owner.js) | Crea solo el owner inicial (`npm run seed:owner`). |

En **Docker**, el backend ejecuta seeds al arrancar vía [backend/docker-entrypoint.sh](../backend/docker-entrypoint.sh) (`seed:owner` y `seed:test`), siempre que la base esté vacía o según la lógica de los scripts.

## Usuarios de prueba (seed P0)

Tras ejecutar `seed:test` (o si Docker ya los cargó), puedes iniciar sesión con:

| Correo | Rol | Contraseña |
|--------|-----|--------------|
| `admin@shieldtrack.com` | OWNER | `Admin123!` |
| `owner@shieldtrack.com` | OWNER | `Password123!` |
| `platformadmin@shieldtrack.com` | PLATFORM_ADMIN | `Password123!` |
| `clientadmin@acmecorp.com` | CLIENT_ADMIN | `Password123!` |
| `areaadmin@acmecorp.com` | AREA_ADMIN | `Password123!` |
| `analyst@shieldtrack.com` | ANALYST | `Password123!` |
| `viewer@shieldtrack.com` | VIEWER | `Password123!` |

La cuenta **`admin@shieldtrack.com`** usa contraseña distinta al resto (`Admin123!`), igual que en el selector de desarrollo del login.

## MongoDB en Docker

Por defecto el `docker-compose` levanta Mongo **sin usuario ni contraseña** en la red interna de Compose (solo expuesto en `localhost:27017` si abres el puerto). Eso es aceptable **solo en desarrollo local**.

Para un entorno más parecido a producción, define `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD` y `MONGODB_URI` con autenticación en el `.env` de la raíz; véanse comentarios en [.env.example](../.env.example).

## Variables sensibles

- `JWT_SECRET`: debe ser largo y aleatorio en cualquier despliegue serio.
- Nunca subas el archivo **`.env`** (solo **`.env.example`** sin secretos reales).
