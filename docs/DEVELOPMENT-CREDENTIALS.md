# Credenciales de desarrollo y pruebas

Solo para entornos locales y QA. **Nunca uses estas contraseñas en producción** y no actives `RUN_TEST_SEEDS` allí.

## Qué crea cada seed

| Seed | Cuándo corre | Qué crea |
| --- | --- | --- |
| `create-owner.js` | Siempre, al arrancar el contenedor backend | El OWNER de `OWNER_SEED_EMAIL` / `OWNER_SEED_PASSWORD`, si no existe. Si ya existe no lo toca, salvo que `ALLOW_OWNER_RESET=true`. |
| `seed-test-data.js` | Solo si `RUN_TEST_SEEDS=true` | Tenants, clientes `TEST-ACME` / `TEST-EVIL`, áreas, proyectos, hallazgos y los usuarios de la tabla. Antes de crearlos borra los datos de prueba anteriores. |

Ambos scripts están en [backend/scripts/seeds/](../backend/scripts/seeds/) y solo leen `MONGODB_URI` del entorno; no cargan archivos `.env`.

### Ejecutarlos a mano

```bash
# Con Docker (desde la raíz del repo)
docker compose exec backend node scripts/seeds/create-owner.js
docker compose exec backend node scripts/seeds/seed-test-data.js

# Sin Docker (desde backend/, con MONGODB_URI exportada)
pnpm run seed:owner
pnpm run seed:test
```

Dentro del contenedor usa `node`, no `pnpm run`: con pnpm 11, `pnpm run` puede reinstalar dependencias en tiempo de ejecución.

## Usuarios de prueba (`seed-test-data.js`)

| Correo | Rol (grupo actual) | Contraseña |
| --- | --- | --- |
| admin@shieldtrack.com | OWNER | `Admin123!` |
| owner@shieldtrack.com | OWNER | `Password123!` |
| platformadmin@shieldtrack.com | PLATFORM_ADMIN (grupo OWNER) | `Password123!` |
| clientadmin@acmecorp.com | CLIENT_ADMIN (grupo ADMIN_AREA) | `Password123!` |
| areaadmin@acmecorp.com | AREA_ADMIN (grupo ADMIN_AREA) | `Password123!` |
| analyst@shieldtrack.com | ANALYST (grupo PENTESTER/QA) | `Password123!` |
| viewer@shieldtrack.com | VIEWER (grupo AUDITOR) | `Password123!` |

Los seeds usan los nombres de rol antiguos, que el backend sigue aceptando como alias. Ver [RBAC-PERMISSIONS-MATRIX.md](RBAC-PERMISSIONS-MATRIX.md#mapa-de-migración).

## Si el login falla

Ver [TROUBLESHOOTING.md](TROUBLESHOOTING.md#no-puedo-iniciar-sesión).
