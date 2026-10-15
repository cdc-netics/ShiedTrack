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

## Contratos corregidos en los ciclos QA de octubre de 2026

Las rutas de esta tabla son relativas al prefijo /api. [Detalle y aceptación pendiente](QA-CORRECTIONS-2026-10.md).

| Ruta | Contrato / autorización |
| --- | --- |
| PUT /system-config/branding | Enviar solo campos admitidos: appName, faviconUrl, logoUrl, primaryColor, secondaryColor (isActive también está admitido por el DTO). No reenviar _id, __v ni timestamps de GET. Los colores conservan validación hexadecimal. |
| PATCH /auth/users/:id | Al cambiar clientId se sincronizan activeTenantId y tenantIds y se limpian restricciones previas no enviadas. Mantiene autorización administrativa. |
| POST /auth/users/:userId/assignments | OWNER/PLATFORM_ADMIN; persiste clientIds, proyectos visibles y áreas derivadas/explícitas. Clientes sin áreas también quedan asignados. |
| GET /areas y POST /areas | ADMIN_AREA puede operar sin tenant fijo; la creación recibe tenantId del cliente elegido cuando falta contexto. Un administrador con tenant no puede indicar otro cliente. |
| GET /export/project/:id/pdf | Consulta hallazgos vigentes por project._id, excluye CLOSED y genera tabla y detalle. |
| GET /export/project/:id/excel y /zip | AUDITOR habilitado dentro de su alcance, además de los roles existentes. |
| GET /export/finding/:id/pdf | AUDITOR habilitado dentro de su alcance; admite hallazgos importados con referencias y controles. |
| DELETE /projects/:id/hard | OWNER y grupo PENTESTER/QA/ANALYST, previa validación de acceso; borra permanentemente proyecto y hallazgos asociados. |
| DELETE /clients/:id | OWNER y grupo PENTESTER/QA/ANALYST; desactiva cliente. DELETE /clients/:id/hard sigue reservado a OWNER (incluye alias PLATFORM_ADMIN). |
| DELETE /auth/users/:id/soft | Administración habilitada; ADMIN_AREA solo puede desactivar AUDITOR/VIEWER. DELETE /auth/users/:id sigue reservado a OWNER y alias global. |

Las descargas del auditor no habilitan escritura ni backups. Los alias de rutas de exportación en plural se conservan. Consultar [matriz RBAC](RBAC-PERMISSIONS-MATRIX.md) para los grupos de roles.

## Recuperación de contraseña (M16)

**Estado:** función corregida; registro actualizado el 2026-10-15.

| Ruta | Contrato |
| --- | --- |
| POST /auth/forgot-password | Pública; recibe email y responde de forma genérica. Para usuarios activos genera código de seis dígitos, vigencia de 15 minutos y espera de 60 segundos entre reenvíos. SMTP válido requerido para entregar correo. |
| POST /auth/reset-password | Pública; recibe email, code y newPassword. Valida código y vencimiento, exige contraseña fuerte, guarda su hash e invalida el código utilizado. |

El autoservicio es distinto de POST /auth/users/:id/reset-password, reservado a administración. El registro de corrección no implica una nueva prueba SMTP en esta actualización.

## Gestión de áreas por pentester (QA-202610-11)

POST /areas, PUT /areas/:id, DELETE /areas/:id (desactivación) y DELETE /areas/:id/hard (borrado permanente) admiten PENTESTER y sus alias QA/ANALYST. GET /areas y GET /areas/:id funcionan para el rol operacional sin tenant fijo; con cliente asignado conservan el filtro de tenant. La reactivación usa PUT con isActive: true. No se implementa borrado en cascada de proyectos ni asignaciones.
