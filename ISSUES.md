# 🐛 Issues y Funcionalidades Pendientes - ShieldTrack

**Fecha de Reporte:** 29 de Mayo de 2026  
**Versión:** HONESTO-2.0  
**Tipo:** Backlog de Tareas Activas / Pendientes

---

## 📌 Resumen Ejecutivo
Este documento contiene únicamente los problemas, mejoras y funcionalidades que están actualmente pendientes, en revisión o con resolución parcial.

---

## 📅 Tareas en Proceso y Pendientes (Tabla de Control)

| ID | Estado | Sección | Tarea | Notas |
| --- | --- | --- | --- | --- |
| B2c | ✅ Completado | Bugs - Navegación | Botón “Nuevo Proyecto” va a `/projects/new` | Ruta registrada, formulario carga/guarda correctamente (clientId, fechas, estado). Fix en `feature/importar-csv` |
| B5b | ✅ Completado | Bugs - Asignaciones | Endpoint `/assignments` no persiste | `visibleProjectIds` ahora se persiste en el modelo de usuario; `getAssignments` devuelve los proyectos exactos asignados. Fix en `feature/importar-csv` |
| B6 | ✅ Completado | Bugs - Permisos | PENTESTER recibe 403 al exportar proyecto | Corregido en `export.service.ts`: lógica de comparación de tenant era demasiado estricta para roles operacionales. Fix en `feature/importar-csv` |
| B7 | ✅ Completado | Bugs - Permisos | PENTESTER recibe 403/500 al cerrar hallazgos | 403 por falta de rol en `@Roles` de `bulk-close`; 500 por falta de contexto CLS de tenant en `updateMany`. Fix en `feature/importar-csv` |
| B8 | ✅ Completado | Bugs - Docker | Build de frontend falla con `ERR_PNPM_IGNORED_BUILDS` | `pnpm-workspace.yaml` no se copiaba al contexto Docker y sus valores eran placeholders. Fix en `feature/importar-csv` |
| M5 | ❌ Pendiente | Mejoras | Gestión avanzada de notificaciones por correo | Configurar reglas y plantillas |
| M6 | ⚠️ Revisar | Mejoras | Métricas/estadísticas exportables para BI | Integración con Metabase/PowerBI |
| M8 | ✅ Completado | Mejoras | Carga masiva de hallazgos mediante CSV | Implementado en `feature/importar-csv`. Parser nativo (UTF-8/CP-1252), auto-creación de cliente/proyecto/área, diálogo drag-and-drop en frontend. Mejora (2026-07-02): flujo de previsualización dry-run + relleno de campos con N/A |

---

## 📋 Detalle de Tareas Backlog Activo

### **B2c — Botón “Nuevo Proyecto” apunta a ruta inexistente**
- **Estado:** ✅ Completado — resuelto en rama `feature/importar-csv`
- **Descripción original:** El botón “Nuevo Proyecto” redirigía a `/projects/new` sin ruta registrada. Al editar un proyecto existente y cambiar el cliente asociado, el `clientId` no se guardaba.
- **Lo resuelto:**
  - Ruta `/projects/new` registrada en `app.routes.ts` cargando `ProjectDetailComponent` en modo creación.
  - Guard de tenant (`!tenantId && !selectedClientId`) corregido para no bloquear la edición — solo aplica en modo CREATE.
  - `resolveTenantId()` ampliado para incluir `user.clientId` y `jwt.clientId`.
  - Campo de fecha renombrado de `serviceStartDate` (inexistente en el schema) a `startDate`; las fechas ahora cargan y se guardan correctamente.
  - `projectStatus` incluido en el payload de actualización cuando el usuario tiene permisos.
  - Eliminados 4 `console.log` de depuración.

### **B5b — Endpoint /assignments no persiste cambios**
- **Estado:** ✅ Completado — resuelto en rama `feature/importar-csv`
- **Descripción original:** El endpoint `POST /api/auth/users/:userId/assignments` guardaba las asignaciones de áreas en `UserAreaAssignment` correctamente, pero los proyectos explícitamente seleccionados se descartaban. Al reabrir el diálogo, se mostraban todos los proyectos de las áreas asignadas en lugar de los proyectos que el administrador había seleccionado.
- **Lo resuelto:**
  - `updateAssignments()` ahora guarda los proyectos validados en `user.visibleProjectIds` después de llamar a `replaceUserAreas()`. Esto activa también el control de acceso por proyecto en `project.service.ts` (`isRestrictedByVisibleProjects`).
  - `getAssignments()` ahora devuelve `projectIds` desde `user.visibleProjectIds` cuando está poblado. Si está vacío (usuarios anteriores), hace fallback a la derivación por áreas. Esto garantiza que al reabrir el diálogo se pre-seleccionen exactamente los proyectos asignados.
  - Para evitar filtrado por tenant al leer `visibleProjectIds` en `getAssignments()`, se usa `.setOptions({ skipTenantFilter: true })` en la consulta de proyectos visibles.

### **B6 — PENTESTER recibe 403 al exportar proyecto**
- **Estado:** ✅ Completado — resuelto en rama `feature/importar-csv` (2026-07-02)
- **Descripción original:** El usuario con rol `PENTESTER` recibía un error 403 al intentar exportar un proyecto a Excel desde la vista de detalles del proyecto.
- **Causa raíz:** `exportProjectToExcel` en `export.service.ts` obtenía el tenant del usuario con `(currentUser.activeTenantId || currentUser.clientId)?.toString()`. El JWT strategy no devuelve un campo `tenantId` directo; para ciertos PENTESTER sin `activeTenantId` ni `clientId` poblados, la expresión resolvía `undefined`, y el guard lanzaba `ForbiddenException` por `!userTenantId` incluso cuando el usuario era legítimo.
- **Lo resuelto:**
  - Se reemplazó la obtención del tenant por `this.getCurrentTenantId(currentUser)`, que revisa correctamente `tenantId ?? activeTenantId ?? clientId`.
  - La comparación de tenant ahora solo lanza `ForbiddenException` cuando **ambos** tenants son conocidos y no coinciden, en lugar de bloquear cuando el tenant del usuario es indeterminado.
  - Archivo modificado: `backend/src/modules/export/export.service.ts`.

### **B7 — PENTESTER recibe 403 / 500 al cerrar hallazgos en masa**
- **Estado:** ✅ Completado — resuelto en rama `feature/importar-csv` (2026-07-02)
- **Descripción original:** El usuario `PENTESTER` no podía cerrar hallazgos individualmente ni en masa: el cierre individual retornaba 403 por restricción de área, y `POST /findings/bulk-close` retornaba primero 403 y luego 500 tras intentar corregirlo.
- **Causa raíz (403 en cierre individual):** `validateProjectAreaAccess` lanzaba `ForbiddenException` cuando el PENTESTER no tenía asignada el área `IMP-DEFAULT`, área que se crea automáticamente para todo proyecto importado por CSV. La restricción de área es organizacional/de filtrado para usuarios operacionales, no debe bloquear escrituras.
- **Causa raíz (403 en bulk-close):** `POST /findings/bulk-close` no incluía `PENTESTER`, `QA` ni `ANALYST` en el decorador `@Roles()`.
- **Causa raíz (500 en bulk-close):** Tras agregar los roles, el `updateMany` de `bulkClose` pasaba por `multiTenantPlugin`, que lanza `"No hay contexto de tenant activo"` cuando el PENTESTER no tiene `activeTenantId`/`clientId` y por ende no hay contexto CLS de tenant disponible.
- **Lo resuelto:**
  - `validateProjectAreaAccess`: usuarios operacionales (`isOperationalUser`: PENTESTER, QA, ANALYST) reciben solo un warning en log en caso de área mismatch; nunca se lanza `ForbiddenException` para este grupo.
  - `POST /findings/bulk-close` `@Roles()`: se agregaron `ANALYST`, `PENTESTER`, `QA`.
  - `bulkClose` `updateMany`: se añadió `.setOptions({ skipTenantFilter: true })` ya que cada `_id` fue validado previamente por `findFindingOrFailWithAccess` con el tenant correcto.
  - Archivos modificados: `backend/src/modules/finding/finding.controller.ts`, `backend/src/modules/finding/finding.service.ts`.

### **B8 — Build de frontend Docker falla con `ERR_PNPM_IGNORED_BUILDS`**
- **Estado:** ✅ Completado — resuelto en rama `feature/importar-csv` (2026-07-02)
- **Descripción original:** El build Docker del frontend fallaba con `ERR_PNPM_IGNORED_BUILDS` para los paquetes `@parcel/watcher`, `esbuild`, `lmdb` y `msgpackr-extract`.
- **Causa raíz:** Dos problemas combinados:
  1. `frontend/pnpm-workspace.yaml` tenía valores placeholder (`set this to true or false`) en lugar de `true` en la sección `allowBuilds`.
  2. `frontend/Dockerfile` no copiaba `pnpm-workspace.yaml` al contexto de build antes del `pnpm install`, por lo que el archivo nunca llegaba al contenedor incluso después de corregir los valores.
- **Lo resuelto:**
  - `frontend/pnpm-workspace.yaml`: todos los valores de `allowBuilds` cambiados a `true`.
  - `frontend/Dockerfile`: se añadió `frontend/pnpm-workspace.yaml*` a la instrucción `COPY` que precede al `pnpm install`.

### **M5 — Gestión avanzada de notificaciones por correo**
- **Estado:** ❌ Pendiente
- **Descripción:** Falta una forma clara de configurar notificaciones (quién recibe, cuándo, y con qué plantilla).
- **Sugerencia/Recomendación:**
  - **Crear modelos nuevos** (backend):
    - `NotificationRule`: `{ name, event, scope, tenantId?, projectId?, enabled, channel, recipients, templateId?, throttleMinutes?, createdAt }`
    - `NotificationTemplate`: `{ code, subject, bodyHtml, variables[] }`
  - **Eventos sugeridos**: `USER_CREATED`, `USER_ASSIGNED_AREA`, `FINDING_ASSIGNED`, `FINDING_CLOSED`, `RETEST_UPCOMING`
  - **Campos a agregar** (config SMTP ya existe en `SystemConfig`): `smtp_reply_to`, `smtp_timeout_ms`, `smtp_tls_reject_unauthorized` (opcional).
  - **Ubicaciones de código**: `backend/src/modules/email/email.service.ts` (leer plantilla + regla antes de enviar), `backend/src/modules/retest-scheduler/retest-scheduler.service.ts` (usar reglas por proyecto/tenant).
  - **UI**: Crear pantalla de “Notificaciones” en admin para activar/desactivar reglas por tenant/proyecto y configurar destinatarios.

### **M6 — Métricas/estadísticas exportables para BI**
- **Estado:** ⚠️ Revisar
- **Descripción:** No existe un mecanismo fácil para consumir métricas agregadas en herramientas externas como Metabase o PowerBI.
- **Sugerencia/Recomendación:**
  - **Crear módulo de métricas**: `backend/src/modules/metrics/*`
  - **Endpoints sugeridos**:
    - `GET /api/metrics/summary` (totales de clientes/proyectos/hallazgos)
    - `GET /api/metrics/findings-by-severity`
    - `GET /api/metrics/findings-by-status`
    - `GET /api/metrics/projects-by-status`
    - `GET /api/metrics/clients-usage`
    - `GET /api/metrics/export?format=csv|json&from=&to=&tenantId=`
  - **Filtros mínimos**: `from`, `to`, `tenantId`, `clientId`, `projectId`.
  - **Índices recomendados**: `{ tenantId, projectId, severity, status, createdAt }`.

### **M8 — Carga masiva de hallazgos mediante CSV**
- **Estado:** ✅ Completado — implementado en rama `feature/importar-csv` (2026-06-30); mejorado (2026-07-02)
- **Descripción:** Importación masiva de hallazgos desde archivos CSV (separador `;`, codificación UTF-8 o Windows-1252) y Excel `.xlsx`. El cliente/tenant, proyecto y área se resuelven o crean automáticamente. Los hallazgos se insertan uno a uno con `.save()` para disparar el hook de generación de códigos `VULN-YYYY-NNNNNN`.
- **Lo implementado:**
  - **Backend:** `POST /api/findings/bulk-import` en `FindingController`; `bulkImport()` en `FindingService` con parser CSV nativo (detecta UTF-8 BOM, UTF-8 válido, y CP-1252 vía `iconv-lite`). Auto-creación de `Client`, `Project` y `Area IMP-DEFAULT` por tenant. Caché N+1 por nombre de cliente. Respuesta `{ creados, fallidos, errores[] }`.
  - **Frontend:** `BulkImportDialogComponent` con zona drag-and-drop, campo opcional de nombre de proyecto, descarga de plantilla CSV, barra de progreso y resumen de resultados. Botón "Importar CSV" en `FindingListComponent` mediante `canImport = computed(...)`.
  - **RBAC:** `OWNER`, `PLATFORM_ADMIN`, `PENTESTER`, `QA`, `ANALYST`.
- **Mejora (2026-07-02) — Flujo de previsualización dry-run:**
  - **Backend:** query params `dryRun=true` (valida el archivo sin guardar, devuelve errores por fila sin crear ningún registro) y `fillMissing=true` (rellena campos obligatorios vacíos con `"N/A"` en lugar de reportar error; `Criticidad` vacía se mapea a `MEDIUM`). Implementados en `FindingController.bulkImport()` y `FindingService.bulkImport()`.
  - **Frontend:** `BulkImportDialogComponent` reimplementado como máquina de estados de 5 pasos (`select → analyzing → preview → importing → done`). Al seleccionar el archivo se ejecuta automáticamente `?dryRun=true`; si hay errores se muestra una pantalla de previsualización con el detalle de fila y el mensaje de error, y se pregunta al usuario "¿Deseas subirlo de todos modos?" con botones Cancelar / Continuar. Si el usuario acepta, la importación real se realiza con `?fillMissing=true` para completar datos faltantes. Si no hay errores, el import se lanza directamente sin paso de confirmación.
  - **Bug resuelto:** archivos CSV exportados por Excel en Windows usan CP-1252; los bytes inválidos en UTF-8 corrompían los headers con tildes → 0 hallazgos importados. Solucionado con detección automática de encoding.
- **Spec original (referencia histórica):**
- **Roles Autorizados (RBAC):** Solo `OWNER`, `PLATFORM_ADMIN`, `PENTESTER` y `QA` (o `ANALYST`) tienen permitido realizar la importación masiva.
- **Sugerencias de Diseño Técnico:**
  - **Mapeo de Columnas (CSV -> MongoDB FindingSchema):**
    - `Cliente` -> Buscar cliente por nombre (`Client.findOne({ name: val })`). En ShieldTrack, los clientes representan los tenants. Al resolver el cliente se obtiene su `_id`, que se usará como `clientId` y `tenantId` para el hallazgo, garantizando el aislamiento del multi-tenant.
    - `cod_netics` -> Representa el código operativo del proyecto (`Project.code`). Para garantizar la consistencia relacional y seguridad, se debe buscar el proyecto en base de datos usando tanto el código del proyecto como el tenant resuelto: `Project.findOne({ code: cod_netics, tenantId: clientId })`. Si no se encuentra, se reporta error en la fila.
    - `Dominio asociado` / `Subdominio` -> Se agregan a `affectedAssets[]` (activos afectados) y se usa `Dominio asociado` como fallback de `detection_source`.
    - `CAT-COD-interno` -> Mapea a `internal_code` (Código de categoría).
    - `fecha_hallazgo` -> Mapea a `createdAt` / fecha de registro histórica (se parsea a Date).
    - `Criticidad` -> Se normaliza al enum `FindingSeverity` (mapeando de español a inglés: `CRÍTICA` -> `CRITICAL`, `ALTA` -> `HIGH`, `MEDIA` -> `MEDIUM`, `BAJA` -> `LOW`, `INFORMATIVA`/`INFO` -> `INFORMATIONAL`).
    - `Categoria` -> Se agrega a `tags[]`.
    - `Título` -> Mapea a `title`.
    - `Descripción` -> Mapea a `description`.
    - `Evidencia` -> Se concatena en la descripción o se registra en `riskJustification`.
    - `Metodo_de_busqueda` / `fuente_detectado` -> Se asigna a `detection_source` o se agrega a `tags[]`.
    - `CVE/EUVD` -> Mapea a `cve_id` (debe validar regex `^CVE-\d{4}-\d{4,7}$`).
    - `cvss_score (si aplica)` -> Parsea a número y mapea a `cvss_score` (validar rango 0.0 - 10.0).
    - `Impacto` -> Mapea a `impact`.
    - `Recomendación` -> Mapea a `recommendation`.
    - `referencias(...)` -> Separar por comas/líneas y mapear a `references[]`.
    - `Observaciones` -> Mapea a `riskJustification` o `implications`.
    - `Revisar en profundidad` -> Si es afirmativo ("Sí", "si", "true"), agrega el tag `REQUIRES_DEEP_REVIEW` a la lista de `tags[]`.
  - **Backend (NestJS):**
    - **Endpoint:** `POST /api/findings/bulk-import`
    - **Control de Acceso:** `@Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.PENTESTER, UserRole.QA)`
    - **Procesamiento:**
      - Uso de `csv-parser` o `papaparse` para leer el buffer.
      - Validación de datos obligatorios por fila (`Cliente`, `Título`, `Descripción`, `Criticidad`, `CAT-COD-interno`).
      - **Generación de Códigos VULN:** El CSV no debe proveer el código incremental del hallazgo (ej: `VULN-2026-000001`). Los hallazgos se deben instanciar e insertar de forma individual usando `.save()`. Esto disparará el hook `pre-save` de `FindingSchema`, el cual resuelve automáticamente el área del proyecto (`areaIds`/`areaId`) para generar el prefijo de código secuencial a través de la colección `counters` de forma atómica y sin colisiones.
      - Retornar resumen detallado de la carga: `{ creados: X, fallidos: Y, errores: [{ fila: N, detalle: "..." }] }`.
  - **Frontend (Angular):**
    - **Ubicación del Botón:** En la vista de listado de hallazgos (`FindingListComponent`), visible únicamente si `canImport()` es verdadero mediante `computed()` contra el `AuthService`.
    - **Interfaz de Usuario:** Un modal/diálogo `BulkImportDialogComponent` con drag-and-drop para cargar el archivo, enlace para descargar una plantilla base de CSV, y visualización de resultados de la importación detallando filas exitosas y errores específicos.
