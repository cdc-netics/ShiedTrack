# Multi-tenancy y áreas — ShieldTrack

Documento canónico (2026). Describe el **estado del código** y la relación entre tenant, áreas y datos legacy. Otros borradores antiguos sobre “solo áreas” o “solo tenants” quedaron **obsoletos** y se retiraron del repositorio para evitar contradicciones.

---

## Resumen

- **Seguridad y datos:** el límite principal de aislamiento es el **tenant** (`tenantId` en entidades que lo requieren, plugins Mongoose y guards/interceptors en NestJS).
- **Producto / UI:** se sigue hablando de **Áreas** como unidad organizativa visible; los roles incluyen **AREA_ADMIN**.
- **Compatibilidad:** coexisten campos **legacy** (`clientId` en cliente/área/proyecto donde aún aplique) y el modelo actual con **`tenantId`**. Los servicios deben seguir resolviendo ambos durante la transición.

---

## Backend (NestJS + Mongoose)

- **Contexto de tenant:** `TenantContextGuard`, interceptors y utilidades en `backend/src/common/` establecen y validan el tenant activo (p. ej. desde JWT o cabecera `X-Tenant-Id` cuando corresponda).
- **Plugins:** en `main.ts` se registra un plugin global de Mongoose (`tenantPlugin`) para filtrado por tenant; los schemas críticos pueden usar además `multiTenantPlugin` donde esté aplicado.
- **Área (`Area`):** incluye `tenantId` **obligatorio** e índices compuestos por tenant; `clientId` es opcional y **legacy** (ver `area.schema.ts`).

No confiar solo en el frontend: toda query debe respetar el contexto de tenant y RBAC en servidor.

---

## Autorización

Los roles (OWNER, PLATFORM_ADMIN, CLIENT_ADMIN, AREA_ADMIN, ANALYST, VIEWER) y el aislamiento por cliente/área/tenant se aplican con guards de JWT y roles. El detalle de flujos está repartido entre `docs/architecture.md` y el código de `auth` / `user-area`.

---

## API

- Los endpoints siguen bajo `/api`; ver [API.md](API.md) y Swagger en `/api/docs`.
- Donde un endpoint requiera contexto explícito de tenant, validar en Swagger la cabecera o el cuerpo esperado.

---

## Despliegue

Variables `CORS_ORIGINS`, `FRONTEND_URL` y `JWT_SECRET` afectan cómo los clientes legítimos hablan con la API; ver [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Evolución

Prioridad actual: **áreas como concepto funcional principal** con **tenant como capa de compatibilidad y segregación** hasta completar migraciones de datos y DTOs. Cualquier nuevo desarrollo debe:

1. Filtrar por `tenantId` cuando el schema lo tenga.
2. Mantener pruebas de IDOR y cruces de tenant antes de publicar cambios en autorización.

---

Documentación relacionada: [architecture.md](architecture.md), [API.md](API.md), [DEPLOYMENT.md](DEPLOYMENT.md).
