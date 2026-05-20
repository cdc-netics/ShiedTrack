<!-- markdownlint-disable MD013 MD007 MD030 MD031 MD034 MD036 MD050 MD032 -->
# Estado del archivo

Este archivo se mantiene solo como referencia historica de analisis y propuestas.

Fuente canonica de backlog activo: [../ISSUES.md](../ISSUES.md)

Si existe conflicto entre ambos, prevalece `../ISSUES.md`.

# Plan de Trabajo: Bitácora SOC

## Tablas de Control

**Alcance de seguimiento:** Las filas `AI-SUMMARY-001` … `AI-SUMMARY-001G` se mantienen como **referencia** (especificación/archivo), pero **no forman parte** del backlog operativo que el equipo prioriza para iteraciones UI/QA ni de las **métricas por oleada** históricas (`UI-MIG-060` cerrado como proceso). Para trabajo vivo: obligaciones **Recurrente**, métricas §9 en `docs/UI-GOVERNANCE.md`, y nuevos `UI-*` si se abren.

### Leyenda de estados (tablas de control)

| Estado | Uso |
| --- | --- |
| **En progreso** | Issues `UI-*` con trabajo abierto. Si la tabla solo muestra el marcador de posición, no hay `UI-*` activos; usar **Listas** para cerrados y **Recurrente** para QA. |
| **Recurrente** | Política viva (cada PR); no se marca **Listo** como ticket único. |
| **Archivo** | Epic IA documentado; sin seguimiento operativo UI (ver nota de alcance). |

**Mejora continua (no son filas En progreso):** bajar `!important` global (`styles.scss`), ejecutar WCAG con herramienta por PR que toque UI (ver `docs/wcag-audit-handoff.md`), y reconteos `rg` §9 cuando cambien tokens o temas.

### En progreso

| ID | Estado | Seccion | Tarea | Notas |
| --- | --- | --- | --- | --- |
| SEC-RBAC-001 | En progreso | Backend / Seguridad | Endurecer CRUD de evidencias (listar/descargar/eliminar) con validacion de acceso por tenant y recurso | Riesgo IDOR y fuga cross-tenant. Implementar control contra Finding asociado + pruebas E2E negativas (403). |
| SEC-RBAC-002 | En progreso | Backend / Seguridad | Proteger endpoints de asignaciones de usuario (`/auth/users/:userId/areas` y `/assignments`) con regla self/admin | Actualmente solo JWT. Agregar validacion ownership y alcance por tenant para admin de cliente. |
| SEC-RBAC-003 | En progreso | Backend / Seguridad | Corregir alcance en CRUD de clientes (`findById`/`update`) para evitar acceso cross-tenant | Pasar `currentUser` al servicio y validar scope por rol antes de leer/modificar. |
| DB-IDX-001 | En progreso | MongoDB / Datos | Corregir conflicto de unicidad en `CustomRole` (`name` global vs índice compuesto `name+clientId`) | Preparar migración de índice segura y mantener unicidad por contexto tenant. |
| APP-RBAC-002 | En progreso | Backend / Arquitectura | Unificar politica RBAC (evitar mezcla de decorators + strings hardcodeados) | Definir matriz rol-recurso-accion y centralizar helpers de permiso. |
| APP-RBAC-003 | En progreso | Backend / Permisos granulares | Implementar `hasPermission()` real en CustomRoleService | Hoy retorna `true` siempre; agregar evaluación real y tests unitarios. |
| DB-MT-002 | En progreso | Backend / Multi-tenant | Homologar estrategia de aislamiento tenant en entidades CRUD fuera de plugin | `multiTenantPlugin` parcial; documentar excepciones y agregar tests de no-fuga. |
| FE-RBAC-001 | En progreso | Frontend / Permisos UI | Unificar criterio de visibilidad “admin” en menú/componentes | El criterio varía entre servicios/componentes; alinear con permisos backend. |

### Guardrails para IA (evitar fallas por malas practicas)

Estas reglas aplican a cualquier agente IA que tome items de este backlog:

1. No inventar arquitectura ni stack: antes de codificar, leer documentación vigente del módulo impactado (`docs/COMPLEMENTS.md`, `docs/UI-GOVERNANCE.md`, `docs/API.md`, etc.).
2. No usar Docker cuando el issue no lo requiere: para complementos simples, priorizar `zip-static` con HTML/CSS/JS y publicación por Admin > Complementos.
3. No introducir complejidad innecesaria: si el requerimiento es de consulta visual, evitar backend nuevo, base de datos o servicios externos.
4. No romper contratos existentes: respetar rutas, nombres de campos, scopes y estructuras ya definidas por la plataforma.
5. No hardcodear secretos ni credenciales: prohibido tokens, passwords o endpoints sensibles en frontend/documentación.
6. No usar datos ficticios ambiguos sin etiquetarlos: los ejemplos deben ser claramente de referencia y no simular producción real.
7. No omitir validación funcional: todo cambio debe incluir criterio verificable (qué probar, dónde, y cuándo pasa a `Listo`).
8. No cerrar issues sin evidencia mínima: registrar archivos tocados, resultado esperado y estado (`Pendiente`, `En progreso`, `Listo`).
9. No degradar UX/Accesibilidad: mantener contraste legible, responsive básico y navegación clara; evitar UI recargada o inconsistente con el sistema.
10. No editar de forma destructiva: no revertir cambios ajenos ni sobrescribir secciones históricas de este documento sin justificación explícita.
11. No dejar decisiones implícitas: documentar supuestos clave en la nota del issue (alcance, límites y exclusiones).
12. No saltarse seguridad básica de frontend: escapar contenido dinámico renderizado y evitar inserciones HTML inseguras.

Checklist mínimo recomendado para agentes IA antes de marcar un item como `Listo`:

- Implementación alineada a documentación del repo.
- Sin sobreingeniería para el alcance solicitado.
- Evidencia en `Notas` del issue (qué se hizo y cómo validarlo).
- Riesgos y pendientes explícitos si aplica.

### Recurrente (QA — cada cambio UI)

| ID | Estado | Seccion | Tarea | Notas |
| --- | --- | --- | --- | --- |


### Archivo (referencia — sin seguimiento operativo)

| ID | Estado | Seccion | Tarea | Notas |
| --- | --- | --- | --- | --- |


### ✅ Listas

| ID | Estado | Seccion | Tarea | Notas |
| --- | --- | --- | --- | --- |
| UI-NAV-001 | Listo | UX / Navegación | Simplificar menú de administración y normalizar terminología `Tenant` -> `Áreas` | Aplicado en navegación visible: menú enlaza a `admin/areas`, títulos y textos clave de UI actualizados a `Área/Áreas`, manteniendo compatibilidad técnica con `tenantId` en backend. |
| UI-NAV-002 | Listo | UX / IA | Revisar arquitectura de menú para reducir ruido visual | Menú consolidado en dos bloques claros (`Operación` implícito + `Administración`) sin duplicidad Tenant/Área, con nomenclatura homogénea (`Áreas`, `Plantillas`, `Marca`) y accesos por rol conservados. |
| UI-ENC-001 | Listo  | Frontend / Layout | Corregir caracteres corruptos (`�`) en menú y vistas (`Administración`, `Auditoría`, `Configuración`, `Código`, `Título`) | Se observa mojibake en textos de navegación y tablas. Revisar codificación UTF-8 real en archivos HTML/TS/MD, headers `Content-Type` y `charset` en `index.html`/nginx. Validar que no se estén guardando archivos en ANSI/Windows-1252. |
| UI-ENC-002 | Listo  | Frontend / Tipografía | Verificar si la fuente actual cubre correctamente tildes y caracteres latinos extendidos | No asumir cambio de fuente como única solución. Primero confirmar encoding. Si la fuente falla en glyphs, proponer fallback robusto (`system-ui`, `Segoe UI`, `Inter`, `Roboto`, `Arial`, `sans-serif`) y pruebas visuales. |
| UI-BRAND-001 | Listo  | Branding / Header | Reparar logo roto en sidebar y topbar | El logo no está cargando en capturas. Revisar ruta de `theme.currentLogo`, fallback por defecto, existencia de asset en build final, y comportamiento cuando tenant no tiene logo cargado. |
| APP-ENUM-001 | Listo | Frontend + Backend / Contratos | Alinear `FindingStatus` compartido entre frontend y backend | Estados verificados sin desalineación entre capas; backend y frontend usan la misma taxonomía (`OPEN`, `IN_PROGRESS`, `RETEST_REQUIRED`, `RETEST_PASSED`, `RETEST_FAILED`, `CLOSED`) y los componentes de hallazgos ya consumen esos valores. |

Los items marcados como `Listo` deben quedar reflejados en `CHANGELOG.md` como fuente de historial.
---


# Propuestas de solucion  por codigo

Issues  enumerado por su codigo y los pasos a seguir para solucionar, reparar o agregar nuevas caracetristicas al desarrollo

## UI-ENC-001 - Caracteres corruptos en interfaz

**Diagnóstico técnico propuesto**
- Verificar que todos los archivos frontend estén en UTF-8 (sin ANSI/ISO-8859-1).
- Revisar `frontend/src/index.html` (`<meta charset="utf-8">`) y respuesta HTTP real.
- Confirmar en nginx `charset utf-8` y `Content-Type` coherente para HTML/CSS/JS.
- Buscar cadenas ya dañadas en código fuente y reemplazarlas por texto correcto.

**Criterio de cierre**
- No aparece `�` en menú, cabeceras ni tablas.
- Términos con tildes se renderizan correctamente en desktop y responsive.

**Hallazgos en entorno Docker (validado)**
- El contenedor `frontend` sirve chunks hashados actualizados, pero el navegador puede conservar un `index.html` previo y terminar mezclando assets viejos/nuevos.
- Esto genera síntomas intermitentes: textos corruptos reaparecen aunque el build actual esté correcto.
- Mitigación aplicada: política `Cache-Control` estricta para `index.html` en nginx del frontend.

## UI-ENC-002 - Validación de tipografía y fallback

**Diagnóstico técnico propuesto**
- Medir si la fuente activa contiene glyphs para español (acentos, ñ, mayúsculas acentuadas).
- Si hay huecos de glyph, aplicar stack de fallback global.
- Evitar hardcode de fuentes por componente; centralizar en estilos base.

**Criterio de cierre**
- Textos con acentos y caracteres especiales se ven correctos sin depender del navegador.

**Hallazgos en entorno Docker (validado)**
- El HTML servido ya expone stack tipográfico con fallback robusto para español.
- El problema principal observado no es solo fuente; también hay efecto de caché de bundles.

## UI-BRAND-001 - Logo no visible

**Diagnóstico técnico propuesto**
- Validar valor de `currentLogo` y fallback cuando no hay branding de tenant.
- Verificar que el asset exista en `dist` y no falle por ruta relativa.
- Comprobar permisos/URL de logo cargado desde backend.
- Añadir placeholder visual consistente para evitar icono roto.

**Criterio de cierre**
- Siempre se muestra logo válido (tenant o fallback) sin imagen rota.

**Hallazgos en entorno Docker (validado)**
- Se detectó riesgo de ruta relativa (`assets/logo.svg`) que puede romper en rutas anidadas (`/admin/*`).
- Mitigación aplicada: default logo absoluto `'/assets/logo.svg'`, normalización de URL y fallback visual con icono si falla la imagen.
- Nota: el endpoint `/api/system-config/branding` responde `401` sin sesión; para diagnóstico de branding siempre validar con usuario autenticado.

## UI-NAV-001 - Unificación Tenant/Áreas

**Propuesta**
- Estandarizar término de producto a `Áreas` en frontend.
- Mantener compatibilidad técnica interna si backend conserva `tenantId`.
- Actualizar etiquetas de menú, títulos y breadcrumbs para consistencia.

**Criterio de cierre**
- El usuario no ve mezcla de `Tenant` y `Área` para el mismo concepto operativo.

**Implementación aplicada**
- Menú lateral actualizado para usar una única entrada funcional `Áreas` apuntando a `routerLink="/admin/areas"`.
- Se añadieron alias de ruta (`/admin/tenants` -> `/admin/areas`) para compatibilidad con enlaces anteriores.
- Se renombraron textos visibles en vistas clave: `Configuración de Área`, `ID del Área`, `Cliente / Área`, y tooltip/acciones de configuración de área.

## UI-NAV-002 - Simplificación de menú

**Propuesta**
- Diseñar menú único con dos bloques:
  - Operación: `Dashboard`, `Proyectos`, `Hallazgos`, `Clientes`.
  - Administración: `Usuarios`, `Áreas`, `Plantillas`, `Auditoría`, `Branding`, `Backup`, `Configuración`, `Notificaciones`.
- Eliminar entradas redundantes y mantener jerarquía visual clara.
- Añadir validación por rol para ocultar opciones no permitidas.

**Criterio de cierre**
- Menú más corto, consistente y sin duplicidad conceptual.

**Implementación aplicada**
- Se mantiene una única sección administrativa, sin entradas redundantes para el mismo concepto.
- Se homogenizó la taxonomía visual del menú para reducir ruido cognitivo: `Plantillas` y `Marca` en lugar de mezclas inglés/español.
- Se preservó control de visibilidad por permisos (`authService.isAdmin()` y `canAccessNotifications()`), evitando sobreexposición de opciones.

## Verificación Docker (obligatoria para UI-ENC-001 / UI-ENC-002 / UI-BRAND-001)

**Objetivo**
- Evitar falsos negativos por caché del navegador o por servir bundles anteriores en contenedor.

**Protocolo de validación**
1. Reconstruir frontend:
   - `docker compose build --no-cache frontend`
   - `docker compose up -d frontend`
2. Confirmar contenedor activo:
   - `docker compose ps`
3. Confirmar asset de logo:
   - `curl -I http://localhost/assets/logo.svg` debe responder `200`.
4. Forzar recarga cliente:
   - `Ctrl + F5` o abrir en incógnito para invalidar caché de `index.html`.
5. Revalidar textos críticos en UI:
   - `Administración`, `Auditoría`, `Configuración`, `Cerrar sesión`, `Código`, `Título`.

**Riesgos detectados**
- Si el logo viene de endpoint protegido y no de asset público, `<img>` no puede enviar Bearer token por header de forma nativa.
- Rutas relativas (`assets/logo.svg`) pueden romper en rutas anidadas (`/admin/*`); usar siempre ruta absoluta (`/assets/logo.svg`).
- En Docker build, Angular puede fallar por conectividad externa al intentar inlining de fuentes de Google (`EAI_AGAIN`). Mitigación aplicada: `optimization.fonts=false` en configuración de producción para evitar dependencia de red durante `docker build`.

---

## Hallazgos CRUD/RBAC (Analisis integral para reparacion)

Fuente: revision de controladores, servicios, guards, schemas e indices de backend/frontend.

### Resumen ejecutivo

- El principal riesgo actual no es de performance: es de autorizacion inconsistente en varios endpoints CRUD.
- Hay desalineacion entre estados/enums frontend-backend que puede romper filtros y flujos.
- Existen inconsistencias de indices unicos que deben corregirse antes de plantear una reindexacion amplia.

---

## Bloque Critico (P0)

### SEC-RBAC-001 - Evidencias sin validacion de acceso por tenant/ownership

**Severidad:** Critica  
**Impacto:** Posible exposicion de evidencias entre tenants o usuarios no autorizados (IDOR)

**Problema detectado**
- En `EvidenceController`, endpoints de lectura/descarga no tienen `@Roles(...)` explicitos.
- En `EvidenceService`, consultas por `findingId` y `_id` no validan tenant del usuario ni pertenencia al recurso.

**Reparacion propuesta**
1. Antes de listar/descargar/eliminar evidencia, validar acceso contra el `Finding` asociado.
2. Restringir por tenant efectivo y por reglas de rol (OWNER/PLATFORM_ADMIN global; resto limitado).
3. Agregar tests E2E: usuario de tenant A no debe leer evidencia de tenant B.

**Criterio de cierre**
- Ningun endpoint de evidencia retorna datos fuera del tenant/alcance autorizado.
- Casos de intento cruzado responden `403`.

---

### SEC-RBAC-002 - Endpoints de asignaciones de usuario con riesgo IDOR

**Severidad:** Critica  
**Impacto:** Un usuario autenticado podria consultar asignaciones de otro usuario por `userId`.

**Problema detectado**
- `GET /auth/users/:userId/areas` y `GET /auth/users/:userId/assignments` usan solo `JwtAuthGuard`.
- No existe validacion "self or admin" en esos endpoints.

**Reparacion propuesta**
1. Aplicar `RolesGuard` + `@Roles(...)` o check de ownership en servicio.
2. Regla minima: permitir solo OWNER/PLATFORM_ADMIN/CLIENT_ADMIN (con alcance tenant) o al propio usuario (`userId === currentUser.userId`).
3. Agregar pruebas de autorizacion negativa y positiva.

**Criterio de cierre**
- Usuario comun no puede leer asignaciones de terceros.
- Admin de cliente solo puede operar dentro de su tenant.

---

### SEC-RBAC-003 - CRUD de clientes con validacion de alcance incompleta

**Severidad:** Alta  
**Impacto:** Lectura/actualizacion de clientes fuera de alcance para roles tenant-scoped.

**Problema detectado**
- En `ClientController`/`ClientService`, `findById` y `update` no validan siempre alcance del `currentUser` en tenant.

**Reparacion propuesta**
1. Pasar `currentUser` a `findById` y `update`.
2. En servicio: validar alcance por rol y tenant antes de devolver/modificar.
3. Rechazar operaciones cross-tenant con `403`.

**Criterio de cierre**
- CLIENT_ADMIN no puede consultar/editar clientes fuera de su tenant.

---

## Bloque Importante (P1)

### APP-ENUM-001 - Desalineacion de `FindingStatus` entre backend y frontend

**Severidad:** Alta funcional  
**Impacto:** Filtros/estados inconsistentes, errores de UI y flujo de negocio.

**Problema detectado**
- Backend: `RETEST_REQUIRED`, `RETEST_PASSED`, `RETEST_FAILED`.
- Frontend: `PENDING_RETEST` (no alineado al backend).

**Reparacion propuesta**
1. Definir fuente unica de verdad para enums compartidos.
2. Alinear frontend a backend (o viceversa con migracion controlada).
3. Agregar test de contrato API (respuesta y filtros por status).

**Criterio de cierre**
- Frontend y backend comparten exactamente los mismos valores de `FindingStatus`.

---

### APP-RBAC-002 - Politica RBAC dispersa entre decoradores y strings hardcodeados

**Severidad:** Media-alta  
**Impacto:** Mantenimiento costoso, riesgo de regresiones de permisos.

**Problema detectado**
- Coexisten `@Roles(...)` y validaciones manuales con strings en multiples servicios.
- `RolesGuard` permite acceso cuando no hay metadata de roles; depende de disciplina endpoint por endpoint.

**Reparacion propuesta**
1. Crear matriz unica `rol x recurso x accion`.
2. Extraer helpers centralizados (evitar strings repetidos).
3. Revisar todos los endpoints sin `@Roles(...)` y decidir explicita su politica.

**Criterio de cierre**
- Reglas RBAC centralizadas y consistentes en controllers/services.

---

### APP-RBAC-003 - Modulo de roles personalizados incompleto

**Severidad:** Media  
**Impacto:** Si se habilita permiso granular real, hoy no protege (retorna true).

**Problema detectado**
- `hasPermission()` en `CustomRoleService` retorna `true` siempre.

**Reparacion propuesta**
1. Implementar evaluador real de permisos por `resource/action`.
2. Integrar con guard/decorator de permisos (si aplica).
3. Agregar tests unitarios de autorizacion granular.

**Criterio de cierre**
- Permisos personalizados aplican efectivamente y fallan con `403` cuando corresponde.

---

## Bloque Datos/Indices (P1-P2)

### DB-IDX-001 - Inconsistencia de unicidad en CustomRole

**Severidad:** Alta de integridad  
**Impacto:** Bloqueo de roles por tenant y conflictos de escritura.

**Problema detectado**
- `name` marcado como `unique: true` (global).
- Adicionalmente existe indice compuesto unico `{ name, clientId }`.

**Reparacion propuesta**
1. Eliminar unicidad global de `name` en schema.
2. Mantener unicidad compuesta por contexto tenant (`name + clientId`).
3. Preparar migracion segura de indice en MongoDB.

**Criterio de cierre**
- Se pueden crear roles con mismo nombre en tenants distintos sin colision.

---

### DB-MT-002 - Aislamiento multi-tenant aplicado de forma parcial

**Severidad:** Alta de seguridad/consistencia  
**Impacto:** Riesgo de consultas sin filtro tenant en entidades no protegidas por plugin.

**Problema detectado**
- `multiTenantPlugin` aplicado en `Project`, `Area`, `Finding`.
- No aplicado en otras entidades sensibles (ej. `Evidence`) que dependen de filtros manuales.

**Reparacion propuesta**
1. Definir estrategia unica por entidad: plugin o guardas de acceso explícitas robustas.
2. Documentar claramente excepciones donde no se usa plugin y por que.
3. Añadir tests de no-fuga entre tenants para cada modulo CRUD.

**Criterio de cierre**
- Cada entidad CRUD tiene mecanismo de aislamiento tenant verificable por prueba.

---

## Bloque Frontend (P2)

### FE-RBAC-001 - Criterio de "admin" desalineado en componentes

**Severidad:** Media UX/autorizacion visual  
**Impacto:** Menus/acciones visibles inconsistentes segun componente.

**Problema detectado**
- `AuthService.isAdmin` considera `OWNER|PLATFORM_ADMIN`.
- Otras vistas consideran tambien `CLIENT_ADMIN` como admin.

**Reparacion propuesta**
1. Unificar helper de permisos de UI.
2. Evitar checks duplicados por string en componentes.
3. Alinear visibilidad de menu con permisos reales backend.

**Criterio de cierre**
- La UI muestra acciones de forma consistente para cada rol.

---

## Orden recomendado de ejecucion

1. `SEC-RBAC-001` (Evidence)
2. `SEC-RBAC-002` (Asignaciones auth)
3. `SEC-RBAC-003` (Client scope)
4. `APP-ENUM-001` (Estados compartidos)
5. `DB-IDX-001` (Unicidad CustomRole)
6. `APP-RBAC-002` y `APP-RBAC-003` (refactor RBAC/permisos)
7. `DB-MT-002` y `FE-RBAC-001` (endurecimiento y homogeneizacion)

---

## Nota sobre reindexacion

No ejecutar reindexacion masiva primero.  
Primero cerrar brechas de autorizacion y corregir definiciones de indices conflictivas.  
Luego aplicar plan de migracion de indices con ventana controlada y respaldo.