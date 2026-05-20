# API HTTP - ShieldTrack

Referencia operativa de la API backend (NestJS).

## Base URL y prefijo

- Todas las rutas usan prefijo global: `/api`
- Ejemplo local: `http://localhost:3000/api/...`

## Swagger (fuente por endpoint)

| Entorno | URL |
| --- | --- |
| Local | `http://localhost:<BACKEND_PORT>/api/docs` |
| Despliegue | `https://<dominio-api>/api/docs` |

Para rutas protegidas, usar `Authorize` con esquema `JWT-auth`.

## Autenticacion

- Header: `Authorization: Bearer <access_token>`
- El token se obtiene en endpoints del modulo Auth.

## Headers frecuentes

| Header | Uso |
| --- | --- |
| `Authorization` | JWT para rutas protegidas |
| `Content-Type` | `application/json` en payloads JSON |
| `X-Tenant-Id` | Contexto tenant cuando el endpoint lo exige |

## Validacion de requests

El backend usa `ValidationPipe` global con:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

Implica que payloads con campos extra generan `400 Bad Request`.

## Codigos de error comunes

| Codigo | Causa tipica |
| --- | --- |
| 400 | DTO invalido, tipos incorrectos, campos no permitidos |
| 401 | Token ausente o invalido |
| 403 | Sin permisos por rol/alcance |
| 404 | Recurso inexistente o fuera de alcance |

## Multi-tenant y RBAC

- El alcance de datos usa `tenantId` y compatibilidad con `clientId` legacy.
- Las reglas de autorizacion se aplican en guards y servicios backend.

Referencias:

- [MULTI-TENANCY.md](MULTI-TENANCY.md)
- [RBAC-PERMISSIONS-MATRIX.md](RBAC-PERMISSIONS-MATRIX.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
