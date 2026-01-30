# ShieldTrack Multi-Tenancy (Tenant Isolation)

Este documento define el rediseño para multi-tenancy real (aislamiento por Tenant) y la transición desde el modelo actual basado en "Áreas".

## Objetivos
- Aislamiento total por Tenant: datos, roles, proyectos, hallazgos, configuraciones, nomenclaturas, estados y workflows.
- Roles globales vs por Tenant: `OWNER` global con capacidades cross-tenant; roles por Tenant restringidos a su propio contexto.
- Configuración centralizada por Tenant: un único lugar para definir todo lo específico del Tenant.
- Tenancy como frontera de seguridad: enforcement en backend, queries y servicios (sin confiar en filtros frontend).

## Entidades Clave
- `Tenant` (nuevo): representa una organización/cliente aislada.
  - Campos: `name`, `code`, `isActive`, `createdAt`, `branding`, `settings`.
- `TenantConfig` (por Tenant): nomenclaturas, workflows, criticidades, estados, campos personalizados, reglas.
- `User`: puede tener acceso a uno o más tenants; debe incluir `tenantIds` (lista) y contexto activo.
- Todas las entidades operativas deben incluir `tenantId` obligatorio: `Client`, `Project`, `Finding`, `Evidence`, `Template`, `AuditLog`, etc.

## Roles y Permisos
- `OWNER` (global):
  - Ver todos los tenants y administrar configuración global.
  - Mover usuarios entre tenants, asignar multi-tenant.
  - Acceso total a datos de cualquier tenant.
- Roles por Tenant (ejemplos): `TENANT_ADMIN`, `ANALYST`, `VIEWER`.
  - Visibilidad y acciones limitadas a su `tenantId`.

## Contexto de Tenant (Runtime)
- Determinación de tenant:
  - Desde JWT: `tenantId` activo del usuario (establecido al login/cambio de contexto).
  - Alternativamente, header `X-Tenant-ID` validado contra permisos del usuario.
- En NestJS:
  - `TenantContextGuard`: obtiene `tenantId` y valida acceso.
  - `TenantFilterInterceptor`: aplica `tenantId` a cada consulta Mongoose.
  - `TenantService`: utilidades para resolver/validar contexto, cambiar tenant activo del usuario.

## Enforcement Técnico
- Mongoose:
  - Todos los Schemas incluyen `tenantId: ObjectId` (required, indexed).
  - Repositorios/servicios aplican filtros `{ tenantId: ctxTenantId }` en todas las queries.
- Controladores:
  - Decorador `@TenantScoped()` para endpoints; aplica guard y filtros.
- No confiar en frontend: todos los endpoints validan/filtran por `tenantId`.

## Configuración Centralizada por Tenant
- Endpoint: `GET/PUT /api/tenants/:tenantId/config`.
- Contiene:
  - Nomenclaturas (códigos, prefijos por entidad).
  - Workflows de hallazgos (estados, transiciones).
  - Criticidades, etiquetas, categorías.
  - Campos personalizados.
  - Reglas específicas (por ejemplo, retest policy).

## Migración desde "Áreas" a Tenants
1. Crear colección `tenants`.
2. Migrar `areas` → `tenants` (1:1 inicialmente):
   - `areas.name` → `tenants.name`
   - `areas.code` → `tenants.code`
   - `areas.clientId` evaluado; en multi-tenancy real, `client` puede ser parte del Tenant o quedar como entidad del Tenant.
3. Agregar `tenantId` en todas las colecciones y backfill con el `tenant` derivado de área.
4. Actualizar usuarios:
   - `areaIds` → `tenantIds`.
   - Rol `AREA_ADMIN` → `TENANT_ADMIN`.
5. Adaptar servicios/repositorios para filtrar por `tenantId`.
6. Mantener compatibilidad temporal (legacy):
   - Alias de endpoints `/api/areas` → `/api/tenants` según feature flag.
   - DTOs con campos `areaId` marcados como `Legacy` mientras se migra.

## Cambios de API (Faseada)
- Nuevos endpoints:
  - `GET /api/tenants` (OWNER global)
  - `POST /api/tenants` (OWNER)
  - `GET/PUT /api/tenants/:tenantId/config` (OWNER / TENANT_ADMIN)
  - `POST /api/auth/context/tenant/:tenantId` (cambio de contexto)
- Endpoints existentes actualizados para requerir `tenantId`.

## UX / Visibilidad
- Usuario normal: solo ve su `tenant`.
- TENANT_ADMIN: experiencia completa de administración dentro de su tenant.
- OWNER: vista global con cambio de contexto a cualquier tenant.

## Seed y Datos de Prueba
- Actualizar seed para crear dos tenants (ACME, Evil Corp) y asociar usuarios con `tenantIds`.
- Incluir hallazgos en ambos tenants para validar aislamiento (IDOR tests).

## Plan de Implementación (por fases)
1. Introducir `Tenant` y `TenantConfig` + `tenantId` en Schemas.
2. Guards/Interceptors para enforcement de `tenantId`.
3. Endpoints de Tenants y cambio de contexto.
4. Migración de datos `areas` → `tenants` y compatibilidad legacy.
5. UI: renombrar “Áreas” a “Tenants” y centralizar configuración por Tenant.
6. Pruebas P0: RBAC, IDOR, aislamiento, performance.

## Consideraciones
- Índices por `tenantId` en colecciones de alto volumen.
- Auditoría: incluir siempre `tenantId` en eventos.
- Backups: estrategia por `tenant` cuando aplique.
- Seguridad: `tenantId` como frontera; nunca mezclar resultados entre tenants.
