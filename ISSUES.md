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
| B2c | ⚠️ Parcial | Bugs - Navegación | Botón “Nuevo Proyecto” va a `/projects/new` | Redirige mal, pero creación funciona. Error en lógica de actualización de clientId en edición |
| B5b | ⚠️ Parcial | Bugs - Asignaciones | Endpoint `/assignments` no persiste | La UI muestra guardado exitoso pero no persiste en base de datos. Validar DTO y modelo |
| M5 | ❌ Pendiente | Mejoras | Gestión avanzada de notificaciones por correo | Configurar reglas y plantillas |
| M6 | ⚠️ Revisar | Mejoras | Métricas/estadísticas exportables para BI | Integración con Metabase/PowerBI |
| M8 | ❌ Pendiente | Mejoras | Carga masiva de hallazgos mediante CSV | Importación masiva con validación y RBAC |

---

## 📋 Detalle de Tareas Backlog Activo

### **B2c — Botón “Nuevo Proyecto” apunta a ruta inexistente**
- **Estado:** ⚠️ Parcial
- **Descripción:** El botón “Nuevo Proyecto” redirige a `/projects/new`, pero esta ruta no está registrada en el router del frontend.
- **Sugerencia/Recomendación:** Crear la ruta `/projects/new` o reutilizar el flujo existente de creación de proyectos. Además, al editar un proyecto existente y cambiar el cliente asociado, el sistema no guarda el nuevo cliente correctamente (lógica de actualización de `clientId` en edición).

### **B5b — Endpoint /assignments no persiste cambios**
- **Estado:** ⚠️ Parcial
- **Descripción:** El sistema indicaba que el endpoint `/assignments` no existía. El endpoint real en backend es `/api/auth/users/:userId/assignments`, pero no persiste las asignaciones.
- **Sugerencia/Recomendación:** Corregir la lógica de persistencia en el backend, el DTO de asignación y la actualización del modelo de usuario (la UI muestra "Cambios guardados exitosamente" pero no se persisten en MongoDB).

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
- **Estado:** ❌ Pendiente
- **Descripción:** Implementar la carga masiva de hallazgos desde un archivo CSV. La funcionalidad debe validar la estructura del archivo, resolver las relaciones de cliente/proyecto de forma segura respetando el aislamiento multi-tenant, mapear los campos del hallazgo a MongoDB y restringir la acción exclusivamente a los roles autorizados.
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
