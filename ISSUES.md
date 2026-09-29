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
| B9 | ✅ Completado | Bugs - Permisos | PENTESTER recibe 403 al editar/exportar/eliminar clientes | Faltaba PENTESTER en `validateClientAccess()` del servicio y en el bypass de `exportClientPortfolio/CSV`. Fix en `feature/importar-csv` |
| B10 | ✅ Completado | Bugs - UI | Detalle de cliente no muestra información de contacto | `client-detail.component.ts` solo mostraba nombre, estado y descripción. Corregido mostrando email, teléfono, código y displayName. Fix en `feature/importar-csv` |
| B11 | ✅ Completado | Bugs - Multi-tenant | NORMAL_USER ve 0 hallazgos aunque el proyecto tiene hallazgos | Conflicto doble-filtrado entre `multiTenantPlugin` y la query explícita de `tenantId`. Resuelto con `skipTenantFilter: true` cuando ya existe filtro explícito. Fix en `feature/importar-csv` |
| B12 | ✅ Completado | Bugs - Permisos | AUDITOR recibe 400 Bad Request en proyectos, hallazgos y clientes | `TenantContextGuard` lanzaba 400 para AUDITOR sin `clientId`. Resuelto añadiendo AUDITOR al bypass operacional + filtrado por scope en servicios. Fix en `feature/importar-csv` |
| B13 | ✅ Completado | Bugs - Export | PENTESTER recibe 500 al exportar proyecto a Excel/CSV/JSON | `multiTenantPlugin` lanzaba error al no haber `tenantId` en CLS para roles operacionales. Resuelto con `skipTenantFilter: true` en queries de hallazgos del export service. Fix en `feature/importar-csv` |
| B14 | ✅ Completado | Bugs - Performance | `console.log(currentUser)` spam — cientos de logs por sesión | Log de depuración en `canCloseProject()` de `project-list.component.ts` se ejecutaba en cada ciclo de change detection. Eliminado. Fix en `feature/importar-csv` |
| M5 | ❌ Pendiente | Mejoras | Gestión avanzada de notificaciones por correo | Configurar reglas y plantillas |
| M6 | ⚠️ Revisar | Mejoras | Métricas/estadísticas exportables para BI | Integración con Metabase/PowerBI |
| M8 | ✅ Completado | Mejoras | Carga masiva de hallazgos mediante CSV | Implementado en `feature/importar-csv`. Parser nativo (UTF-8/CP-1252), auto-creación de cliente/proyecto/área, diálogo drag-and-drop en frontend. Mejora (2026-07-02): flujo de previsualización dry-run + relleno de campos con N/A |
| B15 | ✅ Completado | Bugs - Multi-tenant | Error 500 al crear hallazgo (`Proyecto no encontrado para asignar prefijo de código`) | `tenantId` del hallazgo se calculaba priorizando el tenant activo del usuario sobre el tenant real del proyecto. Corregido en `finding.service.ts` (2026-09-22) |
| B16 | ✅ Completado | Bugs - UI | Botón "copiar vector" de la Calculadora CVSS copiaba contenido viejo del portapapeles | `navigator.clipboard.writeText()` fallaba silenciosamente en contextos con Clipboard API restringido (ej. preview embebido de VS Code). Agregado fallback y manejo de error (2026-09-22) |
| B17 | ✅ Completado | Bugs - Accesibilidad | Warning `aria-hidden`/foco retenido al navegar entre pestañas Evidencias ↔ Seguimiento | El botón clickeado retenía el foco al ocultarse su pestaña. Se libera el foco (`blur()`) antes de cambiar de pestaña (2026-09-22) |
| M9 | ✅ Completado | Mejoras - UX | Calculadora CVSS: abierta por defecto + formato de score consistente | La calculadora ahora es el método principal (antes había que buscar cómo activarla); el campo manual de score siempre muestra 1 decimal, tanto en el wizard de creación como en la edición de un hallazgo (2026-09-22) |
| M10 | ✅ Completado | Mejoras - Navegación | Botón "Ver Hallazgos" en detalle de proyecto poco visible | Era un ícono sin texto entre otros íconos de exportación; ahora es un botón con texto destacado en color primario (2026-09-22) |
| M11 | ✅ Completado | Mejoras - UX | Enlace inverso Evidencias → Seguimiento | El número de cada evidencia ahora es clickeable (cuando viene de un seguimiento) y lleva a la pestaña Seguimiento con la entrada resaltada en azul, complementando el enlace ya existente en sentido contrario (2026-09-22) |
| B18 | ✅ Completado | Bugs - UI | "Riesgo de Negocio" no se sincronizaba con la Calculadora CVSS en el wizard | `onCvssCalculated()` solo actualizaba `severity`; `businessRisk` quedaba sin tocar sin importar el resultado del cálculo. Corregido en `finding-wizard.component.ts` (2026-09-28) |
| M12 | ✅ Completado | Mejoras - UX | Campo "Severidad" movido de la página 1 a la página 2 del wizard de hallazgos | Antes se seleccionaba manualmente en Información Básica y la Calculadora CVSS (página 2) la sobreescribía sin avisar. Ahora vive junto a "Riesgo de Negocio" en Información Técnica, mismo estilo visual (2026-09-28) |
| M13 | ✅ Completado | Mejoras - Almacenamiento | Compresión automática de imágenes de evidencia (PNG/JPEG/BMP/TIFF → WebP) | Reduce el uso de disco del volumen de evidencias; probado con reducción real de -90% en una imagen de prueba. GIF excluido para no romper animaciones (2026-09-28) |
| M14 | ✅ Completado | Mejoras - Evidencias | Evidencia de video con límite de tamaño + enlace externo (SharePoint/Drive) | `.mp4/.webm/.mov` permitidos con límite configurable (100MB default); nuevo endpoint `POST /evidence/link` para archivos más grandes sin ocupar disco. Probado en vivo (2026-09-29) |
| B19 | ✅ Completado | Bugs - Infraestructura | nginx bloqueaba subidas de evidencia >1MB independiente del límite del backend | `client_max_body_size` no estaba configurado en `nginx.conf` (default de nginx: 1MB), rechazando con 413 antes de llegar al backend sin importar `EVIDENCE_MAX_FILE_SIZE_MB`. Corregido agregando `client_max_body_size 110M` (2026-09-29) |
| M15 | ✅ Completado | Mejoras - Reportes | Reporte PDF de hallazgo incompleto (solo 6 campos, sin evidencias) | Expandido a todo el detalle del hallazgo (CVE, CWE, vector CVSS, riesgo de negocio, controles, tags, proyecto/cliente, etc.) + nueva sección de Evidencias: imágenes embebidas como miniatura, videos/enlaces referenciados por texto (2026-09-29) |
| M16 | 🔧 Pre-configuración de función | Mejoras - Autenticación | Recuperación de contraseña por correo (self-service) | Flujo completo ya implementado en código (botón, código por correo, nueva contraseña, login). Falta terminar la configuración SMTP real antes de poder usarse en producción (2026-09-29) |

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

### **B9 — PENTESTER recibe 403 al editar, exportar y eliminar clientes**
- **Estado:** ✅ Completado — resuelto en rama `feature/importar-csv` (2026-07-09)
- **Descripción original:** El usuario `PENTESTER` obtenía 403 al intentar editar datos de un cliente, exportar su portfolio (ZIP y CSV) y eliminarlo, a pesar de que el controlador ya tenía los permisos correctos.
- **Causa raíz:** Existencia de dos capas de RBAC independientes: el decorador `@Roles()` en el controlador Y la función `validateClientAccess()` en `client.service.ts`. Ambas debían incluir el rol. Además, `exportClientPortfolio()` y `exportClientPortfolioCSV()` en `export.service.ts` aplicaban una validación de coincidencia de tenant que bloqueaba a usuarios operacionales sin `clientId` fijo.
- **Lo resuelto:**
  - `client.service.ts` `validateClientAccess()`: añadido `UserRole.PENTESTER` en las llamadas de `update()` y `deactivate()`.
  - `export.service.ts`: guard `!this.isGlobalUser(currentUser)` extendido a `!this.isGlobalUser(currentUser) && !this.isOperationalUser(currentUser)` para que PENTESTER, QA y ANALYST no sean bloqueados por la validación de tenant en exportación de cliente.

### **B10 — Detalle de cliente no muestra información de contacto**
- **Estado:** ✅ Completado — resuelto en rama `feature/importar-csv` (2026-07-09)
- **Descripción original:** Al acceder a la vista de detalle de un cliente (botón "Ver detalles"), el panel solo mostraba nombre, estado activo/inactivo y fecha de creación. Los campos `contactEmail`, `contactPhone`, `code` y `displayName` registrados al crear el cliente no aparecían.
- **Lo resuelto:**
  - `frontend/src/app/features/clients/client-detail/client-detail.component.ts`: reemplazado el panel de cabecera por una cuadrícula `client-info-grid` que muestra condicionalmente `description` (ancho completo), `code`, `contactEmail` (enlace `mailto:`), y `contactPhone` (enlace `tel:`). Si ningún campo tiene datos, se muestra "Sin información de contacto registrada."

### **B11 — NORMAL_USER ve 0 hallazgos aunque el proyecto tiene hallazgos registrados**
- **Estado:** ✅ Completado — resuelto en rama `feature/importar-csv` (2026-07-09)
- **Descripción original:** El usuario `NORMAL_USER` podía ver el proyecto con el contador de hallazgos correcto (ej. 3), pero al navegar a la sección de Hallazgos se mostraba lista vacía o cargando indefinidamente.
- **Causa raíz (doble filtrado):** `finding.service.ts findAll()` establece explícitamente `query.tenantId`. El `multiTenantPlugin` (registrado en `finding.schema.ts`) TAMBIÉN llama a `this.where({ tenantId })` de forma independiente al leer el contexto CLS. En Mongoose 7+ la combinación de ambos filtros puede generar una query inválida que devuelve 0 resultados.
- **Causa raíz (contador inconsistente):** `project.service.ts findAll()` contaba todos los hallazgos (incluyendo `CLOSED`) para el badge, mientras la página de Hallazgos excluye los cerrados por defecto.
- **Lo resuelto:**
  - `finding.service.ts findAll()`: añadido `skipTenantFilter: true` siempre que `query.tenantId` esté ya establecido en la query explícita, evitando el doble filtrado del plugin.
  - `project.service.ts findAll()` (badge de hallazgos): añadido `status: { $ne: FindingStatus.CLOSED }` al `countDocuments` y forzado `skipTenantFilter: true` para consistencia con la vista de hallazgos.

### **B12 — AUDITOR recibe 400 Bad Request en proyectos, hallazgos y clientes**
- **Estado:** ✅ Completado — resuelto en rama `feature/importar-csv` (2026-07-09)
- **Descripción original:** Al iniciar sesión con un usuario de rol `AUDITOR`, todas las llamadas a `/api/projects`, `/api/findings` y `/api/clients` retornaban `400 Bad Request`, dejando todas las vistas en estado de carga infinita o mostrando mensajes de error en consola.
- **Causa raíz:** `TenantContextGuard` lanza `BadRequestException` ("Falta X-TENANT-ID o tenant activo en el usuario") cuando no encuentra `clientId`/`activeTenantId`/`tenantIds` para el usuario, y AUDITOR no estaba incluido en el grupo de roles operacionales que bypasean este check. Los usuarios AUDITOR sin `clientId` asignado (scope PER_PROJECT o PER_CLIENT) golpeaban este guard antes de llegar a los servicios.
- **Diseño de AUDITOR:** El rol tiene tres scopes de visibilidad (`PER_PROJECT`, `PER_CLIENT`, `ALL_AREA`) que se configuran con `visibleProjectIds`, `visibleClientIds` y `areaIds` respectivamente. Sin `clientId` fijo, el guard debía dejarlo pasar igual que a PENTESTER/QA.
- **Lo resuelto:**
  - `tenant-context.guard.ts`: añadidos `"AUDITOR"` y `"VIEWER"` al array `isOperationalRole`.
  - `jwt.strategy.ts`: añadidos `visibleClientIds` y `auditorVisibilityScope` al objeto retornado en `validate()` (antes no se propagaban al JWT de sesión, imposibilitando el filtrado en servicios).
  - `client.service.ts findAll()`: AUDITOR con `scopedClientId` ve solo su cliente; AUDITOR sin `clientId` filtra por `visibleClientIds`; sin ninguno, retorna array vacío en lugar de lanzar `ForbiddenException`.
  - `project.service.ts`: corregido `isRestrictedByArea()` para AUDITOR (antes retornaba `true` siempre; ahora solo si tiene `areaIds` asignados, igual que `finding.service.ts`); añadido `isAuditorUser()`; `shouldBypassTenantFilter()` retorna `true` también para AUDITOR sin tenant; añadido bloque PER_CLIENT que filtra por `visibleClientIds` cuando no hay tenant propio; AUDITOR sin ningún scope retorna array vacío.
  - `finding.service.ts`: añadido `isAuditorUser()`; `shouldBypassTenantFilter()` actualizado igual que en project service; añadido bloque PER_CLIENT que establece `query.tenantId = { $in: visibleClientIds }` cuando el scope es PER_CLIENT; AUDITOR sin scope ni tenant retorna array vacío.
- **Nota operativa:** Un AUDITOR recién creado sin scope asignado verá páginas vacías (sin 400). Para que vea datos debe ser editado para asignarle un `clientId`, proyectos específicos (`PER_PROJECT`) o clientes específicos (`PER_CLIENT`).

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
    - **Nota informativa (2026-07-10):** La importación CSV no incluye evidencias (imágenes/archivos adjuntos). El usuario debe subirlas manualmente desde el detalle del hallazgo tras la importación.

---

### **B13 — PENTESTER recibe 500 al exportar proyecto a Excel / CSV / JSON**
- **Estado:** ✅ Completado — resuelto en rama `feature/importar-csv`
- **Descripción:** `GET /api/export/project/:id/excel` retornaba 500 Internal Server Error para usuarios con rol PENTESTER.
- **Causa raíz:** Los métodos `exportProjectToExcel`, `exportProjectToCSV` y `exportProjectToJSON` en `export.service.ts` consultaban `findingModel.find({ projectId: ... })` sin `skipTenantFilter: true`. El `multiTenantPlugin` lanzaba `Error("No hay contexto de tenant activo")` cuando el PENTESTER no tiene `clientId` (y por tanto no hay `tenantId` en el CLS namespace), causando el 500.
- **Lo resuelto:**
  - Añadido `.setOptions({ skipTenantFilter: true })` a las queries de hallazgos en los tres métodos de exportación de proyecto (`exportProjectToExcel`, `exportProjectToCSV`, `exportProjectToJSON`).
  - El RBAC de acceso al proyecto ya está validado antes de la query de hallazgos (`isOperationalUser` bypass en el check de tenant), por lo que `skipTenantFilter` es seguro aquí — el scope está garantizado por `projectId`.
- **Archivos modificados:** `backend/src/modules/export/export.service.ts`

---

### **B14 — console.log(currentUser) spam — cientos de logs por sesión de navegación**
- **Estado:** ✅ Completado — resuelto en rama `feature/importar-csv`
- **Descripción:** El navegador mostraba en consola cientos de líneas `currentUser: {_id: ..., email: ..., role: ...}` por sesión, degradando el rendimiento del frontend.
- **Causa raíz:** Existía un `console.log('currentUser:', user)` de depuración dentro del método `canCloseProject()` en `project-list.component.ts`. Este método es llamado desde el template Angular para cada fila de proyecto en cada ciclo de change detection, resultando en decenas/cientos de invocaciones por segundo.
- **Lo resuelto:** Eliminada la línea `console.log('currentUser:', user)` del método `canCloseProject()`.
- **Archivos modificados:** `frontend/src/app/features/projects/project-list/project-list.component.ts`

---

### **B15 — Error 500 al crear hallazgo: "Proyecto no encontrado para asignar prefijo de código"**
- **Estado:** ✅ Completado (2026-09-22)
- **Descripción:** Al guardar un hallazgo nuevo desde el wizard, el backend respondía 500 con el mensaje "Error interno del servidor". El log del backend mostraba `Error: Proyecto no encontrado para asignar prefijo de código` lanzado desde el hook `pre-save` de `FindingSchema`.
- **Causa raíz:** En `FindingService.create()`, el `tenantId` que se asignaba al hallazgo se calculaba con `this.getCurrentTenantId(currentUser) || this.resolveProjectTenantId(project)` — es decir, priorizaba el tenant activo del **usuario** por sobre el tenant real del **proyecto**. Esto viola el invariante documentado en `CLAUDE.md` ("el `tenantId` del hallazgo se deriva del proyecto, nunca del cliente/usuario"). Cuando un usuario OWNER/PLATFORM_ADMIN tenía un tenant activo distinto al del proyecto donde creaba el hallazgo (ej. tras cambiar de contexto de tenant), el hallazgo se guardaba con un `tenantId` que no correspondía a su `projectId`. El hook `pre-save` que asigna el código `VULN-YYYY-NNNNNN` busca el proyecto con `ProjectModel.findOne({ _id: projectId, tenantId })`, y al no encontrar coincidencia, lanzaba el error.
- **Lo resuelto:** Se invirtió la prioridad — `this.resolveProjectTenantId(project) || this.getCurrentTenantId(currentUser)` — para que el `tenantId` del hallazgo siempre se derive primero del proyecto, con el tenant del usuario solo como fallback si el proyecto no tuviera tenant resoluble.
- **Archivos modificados:** `backend/src/modules/finding/finding.service.ts`

### **B16 — El botón "copiar vector" de la Calculadora CVSS copiaba contenido antiguo del portapapeles**
- **Estado:** ✅ Completado (2026-09-22)
- **Descripción:** Al calcular un CVSS y presionar el ícono de copiar junto al vector (ej. `CVSS:3.1/AV:A/AC:L/...`), el ícono cambiaba a "✓" (indicando éxito), pero al pegar en otro lugar aparecía contenido de una copia anterior no relacionada, en vez del vector completo.
- **Causa raíz:** `copyVector()` llamaba a `navigator.clipboard?.writeText(this.result.vector)` sin manejar el resultado de la promesa ni sus posibles rechazos. En contextos donde el Clipboard API está bloqueado por política de permisos (ej. el preview embebido "Simple Browser" de VS Code), la escritura fallaba silenciosamente, pero el código igual marcaba `copied = true` de forma síncrona, dando una falsa confirmación de éxito mientras el portapapeles quedaba con su contenido previo.
- **Lo resuelto:** `copyVector()` ahora espera la promesa de `navigator.clipboard.writeText()`; si falla o el API no está disponible, cae a un fallback con `<textarea>` oculto + `document.execCommand('copy')`. El ícono de "✓" solo se muestra si alguno de los dos métodos realmente tuvo éxito.
- **Archivos modificados:** `frontend/src/app/shared/components/cvss-calculator/cvss-calculator.component.ts`

### **B17 — Warning de accesibilidad `aria-hidden`/foco retenido al navegar entre pestañas Evidencias ↔ Seguimiento**
- **Estado:** ✅ Completado (2026-09-22)
- **Descripción:** En la consola del navegador aparecía el warning `Blocked aria-hidden on an element because its descendant retained focus` al hacer clic en los botones que navegan entre las pestañas Evidencias y Seguimiento del detalle de un hallazgo.
- **Causa raíz:** `goToEvidence()`/`goToUpdate()` cambian de pestaña con `selectedTabIndex.set(...)`, lo que hace que Angular Material oculte inmediatamente el panel de la pestaña anterior (`aria-hidden="true"` + `inert`). El botón recién clickeado —que retenía el foco de teclado— quedaba dentro de ese panel ahora oculto, y el navegador bloquea esa combinación por accesibilidad (un elemento oculto para lectores de pantalla no puede contener el foco activo).
- **Lo resuelto:** Se agregó `(document.activeElement as HTMLElement | null)?.blur()` al inicio de ambos métodos, liberando el foco antes de ocultar el panel de la pestaña anterior.
- **Archivos modificados:** `frontend/src/app/features/findings/finding-detail/finding-detail.component.ts`

### **M9 — Calculadora CVSS: abierta por defecto + formato de score consistente**
- **Estado:** ✅ Completado (2026-09-22)
- **Descripción:** Feedback de uso: con la Calculadora CVSS 3.1 ya disponible, no tenía sentido que el campo de score manual siguiera siendo la opción por defecto — la calculadora debía ser el método principal.
- **Lo implementado:**
  - `finding-wizard.component.ts`: la calculadora ahora aparece **abierta por defecto** (`showCvssCalculator = signal(true)`), agrupada en una tarjeta `.cvss-section` con encabezado "Puntuación CVSS" y un botón que invierte el flujo ("Ingresar puntaje manualmente" en vez de "Calcular con CVSS 3.1"). El campo CVSS Score quedó justo debajo de la calculadora, con hint contextual ("Completado por la calculadora — editable" / "0.0 - 10.0").
  - Nueva función compartida `formatCvssScore()` en `shared/utils/cvss.ts`: formatea el score a 1 decimal fijo (`5` → `"5.0"`) para que el campo manual luzca igual sin importar si el valor viene de la calculadora, de una plantilla predefinida, o de editar un hallazgo ya guardado. Aplicada en `finding-wizard.component.ts` (`onCvssCalculated`, `applyTemplate`) y en `finding-detail.component.ts` (`onCvssCalculated`).
- **Archivos modificados:** `frontend/src/app/shared/utils/cvss.ts`, `frontend/src/app/features/findings/finding-wizard/finding-wizard.component.ts`, `frontend/src/app/features/findings/finding-detail/finding-detail.component.ts`

### **M10 — Botón "Ver Hallazgos" en detalle de proyecto poco visible**
- **Estado:** ✅ Completado (2026-09-22)
- **Descripción:** Feedback de un pentester: "quiero revisar un proyecto en específico y no puedo, tengo que ir a hallazgos para verlos, pero como hay muchos no sé cuál es de un proyecto específico". Al investigar, el filtrado por proyecto ya existía (`viewFindings()` en `project-detail.component.ts` navega a `/findings?projectId=...`, y `finding-list.component.ts` ya lee ese query param), pero el botón para activarlo era un ícono (`bug_report`) sin texto, fácil de pasar por alto entre los botones de exportar PDF/ZIP.
- **Lo resuelto:** El botón pasó de `mat-icon-button` a `mat-raised-button` con ícono + texto "Ver Hallazgos", en color primario. Se agregó `.header-actions { margin-left: auto }` para alinear los botones de acción a la derecha del header. No se tocó `finding-list.component.ts`/`project-list.component.ts`, que ya tenían un patrón equivalente (badge clickeable con el conteo de hallazgos por fila).
- **Archivos modificados:** `frontend/src/app/features/projects/project-detail/project-detail.component.ts`

### **M11 — Enlace inverso Evidencias → Seguimiento**
- **Estado:** ✅ Completado (2026-09-22)
- **Descripción:** Ya existía el enlace "Ver evidencia asociada" desde un seguimiento hacia la evidencia correspondiente (con destaque azul en la pestaña Evidencias). Faltaba el camino inverso: desde la pestaña Evidencias, poder ir directo al seguimiento donde una evidencia fue adjuntada.
- **Lo implementado:**
  - Nuevo `evidenceToUpdateMap` (computed): mapea cada `evidenceId` al seguimiento donde fue adjuntada, recorriendo `updates()`. Si una evidencia estuviera referenciada por más de un seguimiento, se enlaza al primero.
  - El número `#N` de cada evidencia es ahora un botón clickeable **solo si esa evidencia viene de un seguimiento** (evidencias subidas directamente se quedan como texto plano, sin destino al cual navegar).
  - Nuevo método `goToUpdate()`: cambia a la pestaña Seguimiento, hace scroll hasta la tarjeta correspondiente y la resalta en azul ~2 segundos (mismo patrón visual y timing que `goToEvidence()`).
- **Archivos modificados:** `frontend/src/app/features/findings/finding-detail/finding-detail.component.ts`

### **B18 — "Riesgo de Negocio" no se sincronizaba con la Calculadora CVSS**
- **Estado:** ✅ Completado (2026-09-28)
- **Descripción:** Al calcular el CVSS en el wizard de creación de hallazgos, el campo "CVSS Score" y la "Severidad" se actualizaban correctamente, pero "Riesgo de Negocio" quedaba siempre con su valor anterior (o vacío), sin importar qué resultado diera la calculadora.
- **Causa raíz:** `onCvssCalculated()` solo incluía `cvssScore`, `cvssVector` y `severity` en el `patchValue()`; el campo `businessRisk` del `technicalForm` nunca se tocaba.
- **Lo resuelto:** Se agregó `businessRisk: severity` al mismo `patchValue()`, sincronizando ambos campos con cada recálculo de la calculadora. El campo sigue siendo editable manualmente después (no se re-sobreescribe salvo que se recalcule el CVSS), ya que Severidad y Riesgo de Negocio son ejes conceptualmente distintos (impacto técnico vs. impacto de negocio) y no siempre deben coincidir.
- **Archivos modificados:** `frontend/src/app/features/findings/finding-wizard/finding-wizard.component.ts`

### **M12 — Campo "Severidad" movido de la página 1 a la página 2 del wizard**
- **Estado:** ✅ Completado (2026-09-28)
- **Descripción:** Feedback de un pentester: era extraño seleccionar "Severidad" manualmente en la página 1 (Información Básica) para que la Calculadora CVSS, en la página 2 (Información Técnica), la sobreescribiera silenciosamente al calcular. La ubicación no coincidía con el flujo real de uso.
- **Lo resuelto:**
  - El control `severity` se movió de `basicForm` a `technicalForm` (con `Validators.required` ahí ahora).
  - En el template, el campo se quitó de la página 1 y se agregó en la página 2, en la sección de riesgo, justo al lado de "Riesgo de Negocio", con el mismo estilo visual (íconos de color, borde rojo al tener valor, validación requerida).
  - `onCvssCalculated()`, `applyTemplate()` y el payload final de `createFinding()` actualizados para leer/escribir `severity` desde `technicalForm`. Aplicar una plantilla ahora también sincroniza `businessRisk` con la severidad de la plantilla, igual que hace la calculadora.
- **Archivos modificados:** `frontend/src/app/features/findings/finding-wizard/finding-wizard.component.ts`

### **M13 — Compresión automática de imágenes de evidencia (PNG/JPEG/BMP/TIFF → WebP)**
- **Estado:** ✅ Completado (2026-09-28)
- **Descripción:** Consulta de un pentester: el volumen de evidencias en Docker crece rápido porque las imágenes se guardan tal cual se suben (capturas de pantalla en PNG sin comprimir, por ejemplo). Se pidió comprimir automáticamente las imágenes al subirlas para aliviar el uso de disco.
- **Lo implementado:**
  - Nueva dependencia `sharp` en el backend (con su build habilitado en `pnpm-workspace.yaml`, mismo mecanismo que B8 para evitar `ERR_PNPM_IGNORED_BUILDS`).
  - `EvidenceService.upload()`: si el archivo es PNG/JPEG/JPG/BMP/TIFF, se recomprime a WebP (calidad 80) redimensionando a un máximo de 1920px en el lado más largo (`fit: inside`, sin agrandar imágenes pequeñas). GIF se excluye para no romper animaciones; SVG no aplica (vectorial).
  - Si la versión comprimida no resulta más liviana que el original (casos raros: imágenes ya muy pequeñas u optimizadas), se descarta y se conserva el archivo original sin modificar.
  - El nombre de archivo mostrado y el `mimeType` guardado se ajustan a `.webp`/`image/webp` para mantener coherencia entre extensión, tipo de contenido y bytes reales — evita el problema de descargar un archivo `.png` que en realidad contiene datos WebP.
  - **Probado en vivo:** imagen de prueba de 10.7 MB (2400×1600) → 1.06 MB en WebP (1920×1280), **-90%**. Verificado que la descarga sirve `Content-Type: image/webp` y el archivo resultante es un WebP válido.
  - Sin cambios necesarios en frontend: el manejo de `mimeType` ya usa comparaciones genéricas tipo `startsWith('image/')`.
- **Archivos modificados:** `backend/src/modules/evidence/evidence.service.ts`, `backend/package.json`, `backend/pnpm-workspace.yaml`

### **M14 — Evidencia de video con límite de tamaño + enlace externo (SharePoint/Drive)**
- **Estado:** ✅ Completado (2026-09-29)
- **Descripción:** Consulta de un pentester: poder subir evidencia en video (ej. grabación de la explotación) sin que eso dispare demasiado el uso de disco del volumen de Docker; para archivos que superan el límite, poder registrar en su lugar un enlace a SharePoint/Drive.
- **Lo implementado:**
  - **Backend — schema:** `Evidence.evidenceType: "FILE" | "LINK"` (default `"FILE"`); campos `storedFilename`, `filePath`, `mimeType`, `size` ahora opcionales (solo aplican a `FILE`); nuevo campo `externalUrl` (solo `LINK`).
  - **Backend — extensiones:** `.mp4`, `.webm`, `.mov` agregados a las extensiones permitidas de evidencia.
  - **Backend — límite de tamaño:** `FileInterceptor` en `POST /evidence/upload` configurado con `limits.fileSize` según `EVIDENCE_MAX_FILE_SIZE_MB` (default 100MB, ajustable por variable de entorno sin tocar código).
  - **Backend — endpoint de enlace:** nuevo `POST /evidence/link` (`AddEvidenceLinkDto`: `findingId`, `url`, `description?`, `updateId?`) crea una evidencia `LINK` sin ocupar disco. `downloadFile()` rechaza con mensaje claro si se intenta descargar un `LINK`; `delete()` omite el borrado de archivo físico para evidencias `LINK`.
  - **Backend — mensaje de error:** `HttpExceptionFilter` intercepta las respuestas 413 de Multer (mensaje genérico "File too large") y las reemplaza por un mensaje accionable: *"El archivo supera el límite de tamaño permitido. Para archivos grandes (ej. videos), usa la opción de enlace externo (SharePoint, Drive, etc.)"*.
  - **Frontend:** nuevo `AddEvidenceLinkDialogComponent` (URL + descripción opcional) y botón "Agregar Enlace" junto a "Subir Evidencia" en la pestaña Evidencias. Las evidencias tipo `LINK` se muestran con ícono de enlace, la URL como texto clickeable, y un botón "Abrir enlace" en vez de "Descargar". El selector de archivos ahora acepta `.mp4/.webm/.mov`.
  - **Probado en vivo:** enlace a YouTube agregado correctamente; video de 2.33MB subido sin problema; intento de descargar un `LINK` rechazado con el mensaje esperado.
- **Archivos modificados:** `backend/src/modules/evidence/schemas/evidence.schema.ts`, `backend/src/modules/evidence/evidence.service.ts`, `backend/src/modules/evidence/evidence.controller.ts`, `backend/src/modules/evidence/dto/evidence.dto.ts` (nuevo), `backend/src/common/filters/http-exception.filter.ts`, `backend/.env.example`, `frontend/src/app/features/findings/add-evidence-link-dialog/add-evidence-link-dialog.component.ts` (nuevo), `frontend/src/app/features/findings/finding-detail/finding-detail.component.ts`

### **B19 — nginx bloqueaba subidas de evidencia >1MB independiente del límite del backend**
- **Estado:** ✅ Completado (2026-09-29)
- **Descripción:** Al probar la subida de un video real de 2.32MB (bien por debajo del límite de 100MB configurado en el backend para M14), la subida fallaba con `413 Request Entity Too Large` — incluso archivos apenas superiores a 1MB fallaban.
- **Causa raíz:** `frontend/nginx.conf` (que sirve el frontend y hace de proxy inverso hacia `/api/`) no tenía configurado `client_max_body_size`, por lo que nginx aplicaba su valor por defecto de **1MB**, rechazando la petición antes de que llegara al backend — sin importar qué límite se hubiera configurado ahí (`EVIDENCE_MAX_FILE_SIZE_MB`).
- **Lo resuelto:** Agregado `client_max_body_size 110M;` en el bloque `location /api/` de `nginx.conf` (con margen sobre el límite de 100MB del backend).
- **Archivos modificados:** `frontend/nginx.conf`

### **M15 — Reporte PDF de hallazgo incompleto (solo 6 campos, sin evidencias)**
- **Estado:** ✅ Completado (2026-09-29)
- **Descripción:** El botón de exportar PDF en el detalle de un hallazgo generaba un reporte con solo 6 campos (ID, Título, Severidad, Estado, CVSS, Activos Afectados) más Descripción/Impacto/Recomendación/Referencias — sin CVE, CWE, vector CVSS, riesgo de negocio, controles, tags, ni ninguna mención a las evidencias adjuntas.
- **Lo implementado:**
  - **Detalle completo:** código interno, riesgo de negocio, motivo y fecha de cierre, vector CVSS, CVE ID, CWE ID, origen de detección, proyecto/cliente, fecha de creación, implicancias, justificación del riesgo, controles (CIS/NIST/OWASP) y tags — todos condicionales (solo se muestran si el hallazgo tiene el dato).
  - **Sección de Evidencias (nueva):** `ExportService.exportFindingPdf()` ahora obtiene las evidencias del hallazgo (mismo orden `#1 = más antigua` que usa el frontend) y las pasa a `PdfService.generateFindingReport()`.
  - **Imágenes embebidas:** cada evidencia de imagen se lee del disco y se convierte a PNG con `sharp` (el WebP de M13 no lo soporta pdfmake nativamente) para incrustarla como miniatura (`width: 260`) directamente en el PDF.
  - **Videos y enlaces externos:** no se pueden "imprimir" — se referencian por texto: `[Video] — visualizar en la plataforma (no se incluye en el PDF)` para archivos de video, y la URL como texto clickeable para evidencias tipo `LINK` (M14).
  - **Bug encontrado y corregido en la misma sesión:** los textos usaban emojis (🎥/📎) que la fuente estándar del PDF (Helvetica) no soporta, renderizando bytes corruptos (`Ø<ß¥`) en vez del ícono. Reemplazados por etiquetas de texto plano (`[Video]`/`[Archivo]`).
  - **Probado en vivo:** PDF real de un hallazgo con 6 evidencias (3 imágenes, 1 documento, 2 videos) — todo el detalle presente, imágenes embebidas correctamente (incluyendo una en WebP), videos/documento con nota de texto limpia.
- **Archivos modificados:** `backend/src/common/services/pdf.service.ts`, `backend/src/modules/export/export.service.ts`

### **M16 — Recuperación de contraseña por correo (self-service)**
- **Estado:** 🔧 Pre-configuración de función (2026-09-29) — el flujo completo ya está implementado en código; falta terminar la configuración SMTP real del ambiente antes de poder usarse en producción.
- **Descripción:** Flujo de autoservicio para que cualquier usuario pueda restablecer su propia contraseña sin depender de un admin: (1) el usuario presiona "¿Olvidaste tu contraseña?", (2) recibe un código de 6 dígitos por correo, (3) define una contraseña nueva que cumpla los requisitos de seguridad, (4) inicia sesión con la contraseña nueva.
- **Lo que ya existía (antes de esta sesión):**
  - **Backend:** `AuthService.forgotPassword()` (código de 6 dígitos, hash con bcrypt, TTL de 15 min, cooldown de reenvío de 60s, respuesta genérica anti-enumeración) y `resetPasswordWithCode()` (valida código y expiración, actualiza `password`). Endpoints `POST /api/auth/forgot-password` y `POST /api/auth/reset-password`, marcados `@Public()` (nuevo decorator + `Reflector` en `JwtAuthGuard`) para no requerir JWT.
  - **Frontend:** botón "¿Olvidaste tu contraseña?" en `login.component.ts`, diálogo de 2 pasos (email → código + nueva contraseña), y el mismo flujo reutilizado para el cambio de contraseña forzado (`forcePasswordChange`) en el primer login.
- **Lo agregado en esta sesión (endurecimiento):**
  - El frontend ya validaba la fortaleza de la contraseña (`isStrongSuggestedPassword()`) antes de enviar, pero el backend solo exigía `MinLength(6)` — cualquiera que llamara la API directamente podía poner una contraseña débil. Se agregó un decorador compartido `IsStrongPassword()` en `auth.dto.ts`, aplicado a los 4 campos de contraseña del sistema: `RegisterUserDto.password`, `ResetPasswordDto.newPassword`, `UpdateUserDto.password`, `UpdateProfileDto.newPassword`.
  - **Bug encontrado y corregido en la misma sesión:** la primera versión usaba 3 `@Matches` separados (mayúscula, número, especial) en el mismo campo; class-validator agrupa los errores por nombre de validador ("matches"), por lo que los 3 se pisaban entre sí y solo sobrevivía el último mensaje. Solucionado combinando las 3 reglas en un único regex con lookaheads y un solo mensaje.
  - **Caracteres especiales ampliados:** a pedido del usuario, se cambió de una lista fija (`-`, `.`, `*`) a aceptar cualquier carácter que no sea letra, número ni espacio (`!@#$%^&*()-_=+` etc.), tanto en el backend (`auth.dto.ts`) como en el frontend (`isStrongSuggestedPassword()` en `login.component.ts`), manteniendo ambos sincronizados.
  - **Probado en vivo:** contraseña débil rechazada con mensaje claro; contraseña fuerte con caracteres antes no aceptados (`!`, `+`) pasa la validación y llega correctamente a la lógica de negocio.
- **Pendiente para poder usarse en producción:** configurar credenciales SMTP reales en el Centro de Administración (actualmente solo hay un placeholder `localhost` cargado) — sin esto, `EmailService` no puede enviar el correo con el código.
- **Archivos modificados:** `backend/src/modules/auth/dto/auth.dto.ts`, `frontend/src/app/features/auth/login/login.component.ts`
