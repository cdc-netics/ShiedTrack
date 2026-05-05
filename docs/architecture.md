# Arquitectura ShieldTrack

## Modelo de Datos Multi-Tenant

```
┌──────────────────────────────────────────────────────────────────┐
│                     Cliente (Tenant comercial)                    │
│  - ID, nombre, industria, isActive                                │
│  - Multi-tenant lógico (una sola base de datos)                  │
└────────────────────┬─────────────────────────────────────────────┘
                     │ 1:N
                     │
        ┌────────────┴──────────────┐
        │                           │
        │                           │
┌───────▼──────────┐       ┌────────▼──────────┐
│      Área        │       │     Proyecto      │
│  - tenantId (FK) │       │  - clientId (FK)  │
│  - clientId leg. │       │  - areaId (FK)    │
│  - nombre        │◄──────┤  - serviceArch    │
└──────────────────┘  1:N  │  - projectStatus  │
                            │  - retestPolicy   │
                            └────────┬──────────┘
                                     │ 1:N
                                     │
                            ┌────────▼──────────┐
                            │     Hallazgo      │
                            │  - projectId (FK) │
                            │  - code           │
                            │  - severity       │
                            │  - status         │
                            │  - retestIncluded │
                            │  - closeReason    │
                            └────┬──────────┬───┘
                                 │          │
                            1:N  │          │ 1:N
                                 │          │
                    ┌────────────▼───┐  ┌──▼─────────────┐
                    │ FindingUpdate  │  │   Evidencia    │
                    │  - findingId   │  │  - findingId   │
                    │  - type        │  │  - filename    │
                    │  - content     │  │  - mimeType    │
                    │  - createdBy   │  │  - storagePath │
                    │  - timestamps  │  │  - uploadedBy  │
                    └────────────────┘  └────────────────┘
```

## Entidades Principales

### 1. Cliente (Tenant)
**Archivo:** `backend/src/modules/client/schemas/client.schema.ts`

**Propósito:** Representa un cliente/empresa en el modelo multi-tenant lógico.

**Campos clave:**
- `name`: Nombre del cliente
- `industry`: Industria (Technology, Finance, Healthcare, etc.)
- `isActive`: Estado activo/inactivo
- `primaryContact`: Email de contacto principal

**Índices:**
- `{ name: 1 }` - Búsqueda por nombre
- `{ isActive: 1 }` - Filtrado de activos

**Regla de negocio:**
- Todos los usuarios, áreas y proyectos pertenecen a un único cliente.
- El clientId se usa para aislar datos entre tenants.

---

### 2. Área
**Archivo:** `backend/src/modules/area/schemas/area.schema.ts`

**Propósito:** Subdivisión organizacional dentro del modelo (ej: TI, Legal, Operaciones). En UI se presenta como **Área**; en datos el aislamiento fuerte se apoya en **`tenantId`**.

**Campos clave:**
- `tenantId`: Referencia al **Tenant** (obligatorio, indexado) — frontera principal de multi-tenancy en el schema actual
- `clientId`: Referencia al Cliente (**legacy**, opcional; mantener mientras existan integraciones antiguas)
- `name`, `code`, `description`: Identificación y metadatos
- `findingCodePrefix`, `nextFindingNumber`: Numeración de hallazgos por área

**Índices (orientativos):**
- `{ tenantId: 1, name: 1 }`, `{ tenantId: 1, code: 1 }` (único por tenant), etc.

**Regla de negocio:**
- Un área queda anclada a un tenant; los proyectos se asocian al área (`areaId`).
- Usuarios **AREA_ADMIN** tienen alcance acotado a sus áreas asignadas.

---

### 3. Proyecto
**Archivo:** `backend/src/modules/project/schemas/project.schema.ts`

**Propósito:** Representa un contrato o engagement de ciberseguridad. Es la **unidad contractual** sobre la que se configuran los retest.

**Campos clave:**
- `clientId`: Cliente propietario (FK)
- `areaId`: Área responsable (FK)
- `name`: Nombre del proyecto
- `code`: Código identificador operativo (ej: PROJ-2024-001)
- `serviceArchitecture`: Tipo de servicio (CLOUD, WEB, FTP, API, ONPREM, HYBRID, OTHER)
- `projectStatus`: Estado (ACTIVE, CLOSED, ARCHIVED)
- `retestPolicy`: Subdocumento con configuración de retest
  - `enabled`: Boolean - Si tiene retest activo
  - `nextRetestAt`: Date - Fecha del próximo retest
  - `notify.recipients`: Array de emails (máx 3)
  - `notify.offsetDays`: Array de días antes del retest (ej: [30, 15, 3])

**Índices:**
- `{ clientId: 1, projectStatus: 1 }` - Filtrado multi-tenant
- `{ areaId: 1 }` - Filtrado por área
- `{ code: 1 }` - Búsqueda por código
- `{ 'retestPolicy.enabled': 1, 'retestPolicy.nextRetestAt': 1 }` - Para scheduler

**Reglas de negocio críticas:**
1. **Cierre de proyecto:**
   - Todos los hallazgos abiertos se cierran automáticamente con `closeReason = CONTRACT_ENDED`
   - El scheduler detiene las notificaciones (`retestPolicy.enabled = false`)
   - Se crea un FindingUpdate automático en cada hallazgo cerrado

2. **Retest:**
   - La configuración es a nivel proyecto, NO por hallazgo individual
   - Solo hallazgos con `retestIncluded = true` se incluyen en notificaciones
   - Las notificaciones se envían según `offsetDays` antes de `nextRetestAt`

---

### 4. Hallazgo (Finding)
**Archivo:** `backend/src/modules/finding/schemas/finding.schema.ts`

**Propósito:** Representa una vulnerabilidad o hallazgo de ciberseguridad detectado en un proyecto.

**Campos clave:**
- `projectId`: Proyecto al que pertenece (FK)
- `code`: Identificador operativo humano (ej: ACME-2024-001)
- `title`: Título descriptivo
- `description`: Descripción técnica
- `severity`: CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL
- `status`: OPEN, IN_PROGRESS, RETEST_REQUIRED, RETEST_PASSED, RETEST_FAILED, CLOSED
- `retestIncluded`: Boolean - Si entra en el retest del proyecto
- `closeReason`: Enum con motivos de cierre (FIXED, RISK_ACCEPTED, FALSE_POSITIVE, CONTRACT_ENDED, OUT_OF_SCOPE, DUPLICATE)
- `closedAt`: Fecha de cierre
- `closedBy`: Usuario que cerró (FK a User)

**Índices:**
- `{ projectId: 1, status: 1 }` - Filtrado por proyecto y estado
- `{ code: 1 }` - Búsqueda por código (único)
- `{ severity: 1 }` - Filtrado por severidad
- `{ retestIncluded: 1 }` - Para queries de retest

**Reglas de negocio:**
1. **Estados del ciclo de vida:**
   - OPEN → IN_PROGRESS → RETEST_REQUIRED → RETEST_PASSED/RETEST_FAILED → CLOSED
   - Un hallazgo puede cerrarse directamente sin pasar por retest (ej: FALSE_POSITIVE)

2. **Visibilidad:**
   - Hallazgos cerrados NO aparecen en vistas operativas por defecto
   - Filtro `includeClosed = true` necesario para ver histórico completo

3. **Cierre:**
   - Solo usuarios con rol OWNER, PLATFORM_ADMIN, CLIENT_ADMIN, AREA_ADMIN pueden cerrar
   - AREA_ADMIN solo puede cerrar hallazgos de su área
   - Al cerrar, se debe especificar `closeReason` obligatoriamente

---

### 5. FindingUpdate (Timeline)
**Archivo:** `backend/src/modules/finding/schemas/finding-update.schema.ts`

**Propósito:** Historial **inmutable** de todos los cambios y actualizaciones de un hallazgo. Implementa audit trail completo.

**Campos clave:**
- `findingId`: Hallazgo al que pertenece (FK)
- `type`: FOLLOWUP, TECHNICAL, STATUS_CHANGE, COMMENT
- `content`: Descripción del cambio
- `createdBy`: Usuario que creó el update (FK a User)
- `previousStatus`: Estado anterior (solo para STATUS_CHANGE)
- `newStatus`: Nuevo estado (solo para STATUS_CHANGE)
- `sourcesAdded`: Array de URLs con fuentes técnicas (ej: CVE links)
- `artifactsAdded`: Array de IDs de evidencias subidas (FK a Evidence)
- `createdAt`: Timestamp inmutable

**Índices:**
- `{ findingId: 1, createdAt: -1 }` - Timeline ordenado cronológicamente
- `{ createdBy: 1 }` - Filtrado por usuario

**Tipos de update:**

1. **FOLLOWUP:** Seguimiento operativo general
   - Ejemplo: "Cliente confirmó que aplicará parche en Q1 2024"

2. **TECHNICAL:** Actualización técnica con fuentes/evidencias
   - Requiere: `sourcesAdded` y/o `artifactsAdded`
   - Ejemplo: "Se agregó PoC de explotación (ver artifacts)"

3. **STATUS_CHANGE:** Cambio de estado automático
   - Requiere: `previousStatus` y `newStatus`
   - Generado automáticamente por el sistema
   - Ejemplo: "Estado actualizado de OPEN a IN_PROGRESS"

4. **COMMENT:** Comentario libre
   - Ejemplo: "Priorizar para próxima sprint"

**Reglas de negocio:**
- Los updates son **inmutables** - NO se pueden editar ni borrar
- Cada cambio de status genera automáticamente un update tipo STATUS_CHANGE
- Los updates se muestran en orden cronológico descendente (más reciente primero)

---

### 6. Evidencia (Evidence/Artifact)
**Archivo:** `backend/src/modules/evidence/schemas/evidence.schema.ts`

**Propósito:** Almacena archivos asociados a hallazgos (screenshots, PoCs, logs, PDFs).

**Campos clave:**
- `findingId`: Hallazgo al que pertenece (FK)
- `updateId`: FindingUpdate asociado (opcional, FK)
- `filename`: Nombre original del archivo
- `storagePath`: Ruta interna en servidor (NO exponer al cliente)
- `mimeType`: Tipo MIME del archivo
- `size`: Tamaño en bytes
- `description`: Descripción opcional
- `uploadedBy`: Usuario que subió (FK a User)

**Índices:**
- `{ findingId: 1 }` - Filtrado por hallazgo
- `{ uploadedBy: 1 }` - Filtrado por usuario

**Seguridad:**
1. **Validación de tipo:** Solo se permiten extensiones seguras (PDF, PNG, JPG, TXT, CSV, JSON)
2. **Storage:** Archivos almacenados en `/uploads` local (NO público)
3. **Descarga protegida:** Endpoint `GET /evidence/:id/download` valida JWT antes de hacer stream
4. **Path traversal:** Validar que filename no contenga `..` o `/`
5. **Límite de tamaño:** Máximo 50MB por archivo (configurable en main.ts)
6. **Rate limiting:** 10 descargas por minuto por usuario (prevenir DoS)

---

### 7. Usuario (User)
**Archivo:** `backend/src/modules/auth/schemas/user.schema.ts`

**Propósito:** Representa usuarios del sistema con autenticación y roles RBAC.

**Campos clave:**
- `email`: Email único (username)
- `password`: Hash bcrypt (NO plano)
- `firstName`, `lastName`: Datos personales
- `role`: OWNER, PLATFORM_ADMIN, CLIENT_ADMIN, AREA_ADMIN, ANALYST, VIEWER
- `clientId`: Cliente al que pertenece (nullable para OWNER)
- `areaIds`: Array de áreas asignadas (para AREA_ADMIN)
- `mfaEnabled`: Boolean - Si tiene MFA activado
- `mfaSecret`: Secreto TOTP (encriptado)
- `isActive`: Estado activo/inactivo

**Índices:**
- `{ email: 1 }` - Único, para login
- `{ clientId: 1, role: 1 }` - Filtrado multi-tenant

**Roles y permisos:** Ver decoradores y guards en `backend/src/modules/auth/` (`Roles`, `JwtAuthGuard`, `RolesGuard`, aislamiento por área según servicio).

---

### 8. AuditLog
**Archivo:** `backend/src/modules/audit/schemas/audit-log.schema.ts`

**Propósito:** Registro de auditoría para acciones críticas (hard delete, cambios de rol, cierre masivo).

**Campos clave:**
- `action`: String descriptivo (ej: "USER_ROLE_CHANGED", "FINDING_HARD_DELETED")
- `entityType`: Tipo de entidad afectada (User, Project, Finding)
- `entityId`: ID del documento afectado
- `performedBy`: Usuario que ejecutó la acción (FK a User)
- `metadata`: JSON con detalles adicionales (ej: `{ oldRole: 'VIEWER', newRole: 'ANALYST' }`)
- `ip`: IP del usuario
- `userAgent`: Navegador/cliente
- `severity`: INFO, WARNING, CRITICAL
- `createdAt`: Timestamp inmutable

**Índices:**
- `{ performedBy: 1, createdAt: -1 }` - Auditoría por usuario
- `{ entityType: 1, entityId: 1 }` - Búsqueda por entidad
- `{ action: 1 }` - Filtrado por tipo de acción
- `{ severity: 1, createdAt: -1 }` - Eventos críticos

**Uso:**
```typescript
await this.auditService.log({
  action: 'PROJECT_CLOSED',
  entityType: 'Project',
  entityId: projectId,
  performedBy: userId,
  metadata: { totalFindings: 42, closedReason: 'CONTRACT_ENDED' },
  severity: 'INFO',
});
```

---

## Flujo de Datos Crítico: Cierre de Proyecto

```
1. Usuario ejecuta: POST /api/projects/:id/close
   ↓
2. ProjectController valida JWT + Rol (OWNER/PLATFORM_ADMIN/CLIENT_ADMIN)
   ↓
3. ProjectService.closeProject(id, userId)
   ↓
4. Iniciar TRANSACCIÓN MongoDB
   ↓
5. Actualizar Proyecto:
   - projectStatus = CLOSED
   - retestPolicy.enabled = false
   ↓
6. Buscar hallazgos abiertos: { projectId: id, status != CLOSED }
   ↓
7. Para cada hallazgo:
   - status = CLOSED
   - closeReason = CONTRACT_ENDED
   - closedAt = now()
   - closedBy = userId
   ↓
8. Crear FindingUpdate para cada hallazgo:
   - type = STATUS_CHANGE
   - content = "Proyecto cerrado automáticamente"
   - previousStatus = <status anterior>
   - newStatus = CLOSED
   ↓
9. Crear AuditLog:
   - action = PROJECT_CLOSED
   - entityType = Project
   - metadata = { totalFindings: N, totalClosed: M }
   ↓
10. COMMIT transacción
    ↓
11. ReturnSuccessResponse
```

**Archivos involucrados:**
- `backend/src/modules/project/project.service.ts` (líneas 76-100)
- `backend/src/modules/finding/finding.service.ts` (método bulkClose - si existe)
- `backend/src/modules/audit/audit.service.ts`

---

## Flujo de Datos: Scheduler de Retest

```
1. Cron Job diario: @Cron('0 0 * * *') - 00:00 cada día
   ↓
2. RetestSchedulerService.handleRetestNotifications()
   ↓
3. Query: Proyectos con retestPolicy.enabled = true
   ↓
4. Para cada proyecto:
   ↓
   4.1. Calcular fechas: offsetDays [30, 15, 3]
        nextRetestAt = 2024-02-15
        hoy = 2024-01-16
        ¿hoy == nextRetestAt - 30? → SÍ → Enviar email
   ↓
   4.2. Query hallazgos: { projectId, retestIncluded: true, status != CLOSED }
   ↓
   4.3. Generar email con:
        - Cliente: ACME Corp
        - Proyecto: Pentest Q1 2024
        - Fecha retest: 15/02/2024
        - Días restantes: 30
        - Hallazgos pendientes:
          * ACME-001: SQL Injection (CRITICAL)
          * ACME-002: XSS Reflejado (HIGH)
          * ACME-005: Info Disclosure (MEDIUM)
   ↓
   4.4. Enviar email a notify.recipients (máx 3)
   ↓
5. Log resultado (éxito/fallo)
```

**Archivos involucrados:**
- `backend/src/modules/retest-scheduler/retest-scheduler.service.ts`
- `backend/src/modules/finding/finding.service.ts` (método findForRetest)
- `backend/src/modules/project/schemas/project.schema.ts` (retestPolicy)

---

## Flujo de Datos: Upload de Evidencia

```
1. Usuario ejecuta: POST /api/evidence/upload (multipart/form-data)
   Headers: Authorization: Bearer <JWT>
   Body: file + findingId + description
   ↓
2. EvidenceController:
   - Validar JWT (JwtAuthGuard)
   - Validar rol (ANALYST, AREA_ADMIN, CLIENT_ADMIN, PLATFORM_ADMIN, OWNER)
   - Multer intercepta archivo
   ↓
3. Validaciones de seguridad:
   - Tipo MIME permitido? (PDF, JPG, PNG, TXT, CSV)
   - Tamaño < 50MB?
   - Filename sin path traversal (../)?
   ↓
4. EvidenceService.upload():
   - Generar nombre único: `${uuid}-${originalFilename}`
   - Guardar en /uploads/
   - Calcular hash SHA256 (opcional)
   ↓
5. Crear documento Evidence:
   - findingId
   - filename original
   - storagePath interno
   - mimeType
   - size
   - uploadedBy = userId
   ↓
6. Return { id, filename, size, uploadedAt }
```

**Seguridad:**
- Archivos NO accesibles vía URL directa
- Descarga requiere JWT válido
- Rate limiting: 10 descargas/min
- Path traversal prevenido
- Validación de tipo MIME estricta

**Archivos involucrados:**
- `backend/src/modules/evidence/evidence.controller.ts`
- `backend/src/modules/evidence/evidence.service.ts`

---

## Tecnologías y Decisiones Arquitectónicas

### Backend
- **Framework:** NestJS 10.x (modular, inyección de dependencias, decoradores)
- **Database:** MongoDB 6.x–8.x con Mongoose (TypeScript strict mode)
- **Autenticación:** JWT con estrategia Passport
- **Validación:** class-validator + class-transformer (obligatorio en todos los DTOs)
- **Scheduler:** @nestjs/schedule (cron nativo)
- **File Upload:** Multer (local storage)
- **Documentación:** Swagger (@nestjs/swagger)

### Frontend
- **Framework:** Angular 20+ (Standalone Components)
- **State Management:** ANGULAR SIGNALS (signal(), computed(), effect()) - NO NgRx
- **Routing:** Router standalone
- **HTTP:** HttpClient con interceptor JWT
- **UI Kit:** (pendiente definir) Angular Material o PrimeNG

### Decisiones Clave

1. **Multi-tenant lógico vs físico:**
   - Decisión: Lógico (una sola base de datos; filtrado por `tenantId` y, donde aún exista, `clientId` legacy)
   - Razón: Simplifica operaciones, backups y mantenimiento
   - Trade-off: Validación estricta en servidor en todas las consultas y contexto de tenant activo

2. **Retest a nivel proyecto vs hallazgo:**
   - Decisión: A nivel proyecto (según prompt.txt)
   - Razón: En SOC/MSSP los retest son engagements contractuales completos
   - Implementación: retestPolicy en Project schema, retestIncluded flag en Finding

3. **Timeline inmutable:**
   - Decisión: FindingUpdate sin UPDATE ni DELETE
   - Razón: Compliance SOC2/ISO27001 requiere audit trail completo
   - Implementación: Schema sin métodos de modificación

4. **Storage local vs S3:**
   - Decisión: Local disk (según prompt.txt)
   - Razón: Control total, sin dependencias cloud
   - Trade-off: Requiere backups manuales

5. **Desktop-only vs responsive:**
   - Decisión: Desktop-only ≥1366px (según prompt.txt)
   - Razón: Analistas SOC usan estaciones de trabajo, no móviles
   - Implementación: No media queries para mobile

---

---

## 🛠️ Guía de Desarrollo

### Agregar un Nuevo Módulo en el Backend

1. **Crear carpeta** en `backend/src/modules/nombre-modulo/`.
2. **Generar archivos base**:
   - `nombre-modulo.module.ts`: Definición del módulo.
   - `nombre-modulo.service.ts`: Lógica de negocio.
   - `nombre-modulo.controller.ts`: Endpoints de la API.
   - `schemas/`: Para modelos de Mongoose (si aplica).
   - `dto/`: Para validación de datos (usando `class-validator`).

3. **Registrar en AppModule**: Importar el nuevo módulo en `backend/src/app.module.ts`.

### Crear un Nuevo Componente en el Frontend

1. **Usar Standalone Components**: Todos los componentes nuevos deben ser `standalone: true`.
2. **Estado con Signals**: Utilizar `signal()`, `computed()` y `effect()` para la gestión de estado.
3. **Servicios**: Inyectar servicios mediante el constructor o `inject()`.

```typescript
// Ejemplo de componente con Signals
@Component({
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `<div>{{ count() }}</div>`
})
export class MiComponente {
  count = signal(0);
}
```

---

## 🔐 Seguridad y Cumplimiento

### Autenticación y Autorización
- **JWT**: Firma de tokens con 8h de expiración.
- **RBAC**: Guardias de seguridad (`RolesGuard`) aplicados a nivel de controlador o método.
- **MFA**: Implementado con `speakeasy` y códigos QR para el login inicial del Owner.

### Protección de Datos
- **Aislamiento Multi-Tenant**: Las consultas deben respetar el contexto de tenant (`tenantId` en schemas que lo usan) y las reglas de rol; no basar el aislamiento solo en el cliente.
- **Evidencias**: Almacenamiento fuera de la raíz pública (`/uploads`) y descarga protegida por token.

---

📖 Para volver al inicio, consulta el **[README.md](../README.md)**.
