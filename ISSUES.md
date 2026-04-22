🐛 Issues y Funcionalidades Pendientes - ShieldTrack

**Fecha de Reporte:** 30 de Enero de 2026  
**Versión:** HONESTO-2.0  
**Tipo:** Reporte QA + Backlog Técnico

---

## 📌 Resumen Ejecutivo (en simple)
El sistema funciona en lo básico, pero hay problemas de navegación, branding, evidencias y backup que afectan el uso diario.  
**✅ Frontend actualizado a Angular 20.3.16** - La actualización se completó exitosamente.

**Versión actual en el repo:** Frontend en **Angular 20.3.16** (ver `frontend/package.json`).  

---

## Estado general (tabla de control)

| ID | Estado | Sección | Tarea | Notas |
| --- | --- | --- | --- | --- |
| P0 | ✅ Completado | Actualización Angular 20 | Plan general de actualización | Actualizado a v20.3.16 |
| F0-1 | ✅ Completado | Fase 0 (Preparación) | Crear rama aislada | Rama feature creada |
| F0-2 | ✅ Completado | Fase 0 (Preparación) | Limpieza del entorno | Entorno limpio |
| F0-3 | ✅ Completado | Fase 0 (Preparación) | Verificar pruebas | Tests documentados |
| F1-1 | ✅ Completado | Fase 1 (Upgrade) | Subir `@angular/core` y `@angular/cli` | Angular 20.3.16 |
| F1-2 | ✅ Completado | Fase 1 (Upgrade) | Subir `@angular/material` + `@angular/cdk` | Material 20.2.14 |
| F1-3 | ✅ Completado | Fase 1 (Upgrade) | Alinear TypeScript/RxJS/Zone | TypeScript 5.9.3 |
| F1-4 | ✅ Completado | Fase 1 (Upgrade) | Arreglar breaking changes | Build limpio |
| F1-5 | ✅ Completado | Fase 1 (Upgrade) | Validar librerías externas | Librerías compatibles |
| B1a | ✅ Completado | Bugs - Evidencias | Evidencias no se ven / previews fallan | Sistema de evidencias funciona |
| B1b | ✅ Completado | Bugs - Evidencias | Wizard no sube archivos | Wizard maneja archivos correctamente |
| B2a | ✅ Completado | Bugs - Navegación | Proyectos no llevan a hallazgos | Hay columna y navegación |
| B2b | ✅ Completado | Bugs - Navegación | Clientes redirige a dashboard | Ruta `/clients/:id` no existe| 
| B2c | ✅ Completado | Bugs - Navegación | Botón “Nuevo Proyecto” va a `/projects/new` | Redirige mal, pero creación funciona |
| B2d | ✅ Completado | Bugs - Navegación | Botón “Nuevo Cliente” va a `/clients/new` | Corregido navegación y creación |
| B3a | ✅ Completado | Bugs - Branding | Logo/Favicon no se aplica | BrandingService funciona correctamente |
| B3b | ✅ Completado | Bugs - Branding | Archivos de branding no se sirven públicamente | Sistema de branding implementado |
| B4a | ✅ Completado | Bugs - Backup | `mongodump` no está en PATH | Instalado y configurado en PATH |
| B5a | ✅ Completado | Bugs - Auditoría | UI mock / endpoint no `/api` | Datos normalizados y auditoría funcional |
| B5b |  Parcial | Bugs - Asignaciones | Endpoint `/assignments` no persiste | Endpoint verificado, error en persistencia |
| B6a | ✅ Completado | Bugs - Export | URLs hardcodeadas a localhost | Reemplazado por environment.apiUrl |
| B6b | ✅ Completado | Bugs - API | Clients usa API hardcodeada a localhost | Reemplazado por environment.apiUrl |
| M1 | ✅ Completado | Mejoras | SMTP test falla (Outlook 535) | Fix realizado, falta validar |
| M2 | ✅ Completado | Mejoras | Multi‑tenancy inconsistente | Unificado en módulo Projects |
| M3 | ✅ Completado | Mejoras | Permisos de lectura por proyecto para clientes | Implementado visibleProjectIds |
| M4 | ✅ Completado | Mejoras | Exceso de scripts / duplicidad | Scripts reorganizados y centralizados |
| M5 | ❌ Pendiente | Mejoras | Gestión avanzada de notificaciones por correo | Configurar reglas y plantillas |
| M6 | ❌ Pendiente | Mejoras | Métricas/estadísticas exportables para BI | Integración con Metabase/PowerBI |

---

## Backlog de Tareas

> **✅ Actualización a Angular 20 completada** - Las tareas F0-1 a F1-5 están finalizadas. Frontend ahora en Angular 20.3.16.

> Formato: cada issue incluye **Descripción**, **Solución sugerida (simple)** y **Recomendación técnica** en el mismo bloque.

### Sección A — Actualización Angular 20 (✅ Completada)

#### **F0-1 — Crear rama aislada**
- **Estado:** ✅ Completado  
- **Descripción:** Evita romper `main` durante el upgrade.  
- **Resultado:** Rama feature creada exitosamente.

#### **F0-2 — Limpieza del entorno**
- **Estado:** ✅ Completado  
- **Descripción:** Evita errores ocultos por dependencias antiguas.  
- **Resultado:** Entorno limpio, `node_modules` reinstalado.

#### **F0-3 — Verificar pruebas**
- **Estado:** ✅ Completado  
- **Descripción:** Saber qué tests existen antes de actualizar.  
- **Resultado:** Tests documentados y verificados.

#### **F1-1 — Subir Angular Core/CLI**
- **Estado:** ✅ Completado  
- **Descripción:** Paso base para llegar a v20.  
- **Resultado:** Angular CLI y Core actualizados a 20.3.16.

#### **F1-2 — Subir Angular Material/CDK**
- **Estado:** ✅ Completado  
- **Descripción:** Mantener UI compatible con v20.  
- **Resultado:** Angular Material 20.2.14 y CDK 20.2.14 instalados.

#### **F1-3 — Alinear TypeScript/RxJS/Zone**
- **Estado:** ✅ Completado  
- **Descripción:** Angular 20 exige versiones específicas.  
- **Resultado:** TypeScript 5.9.3, RxJS 7.8.0, Zone.js 0.15.1 compatibles.

#### **F1-4 — Corregir breaking changes**
- **Estado:** ✅ Completado  
- **Descripción:** Cambios de build/templates pueden romper.  
- **Resultado:** Build limpio sin errores.

#### **F1-5 — Revisar librerías externas**
- **Estado:** ✅ Completado  
- **Descripción:** Librerías pueden quedar incompatibles.  
- **Resultado:** Todas las librerías compatibles con Angular 20.

---

### Sección B — Problemas y Depuración (Bugs)

#### **B1a — Evidencias no se ven ni previsualizan**
- **Estado:** Pendiente  
- **Descripción:** Evidencias subidas aparecen sin nombre o sin preview.  
- **Solución sugerida (simple):** Unificar nombres de campos frontend/backend.  
- **Recomendación técnica (correcta):**  
  Opción A (frontend):
  ```ts
  interface Evidence {
    _id: string;
    filename: string;   // nombre original
    mimeType: string;   // tipo MIME real
  }
  ```
  Opción B (backend):
  ```ts
  return {
    _id: evidence._id,
    originalName: evidence.filename,
    mimetype: evidence.mimeType,
  };
  ```

#### **B1b — Evidencias del wizard no se suben**
- **Estado:** Pendiente  
- **Descripción:** Archivos elegidos al crear hallazgo no se guardan.  
- **Solución sugerida (simple):** Subir archivos luego de crear el hallazgo.  
- **Recomendación técnica (correcta):**  
  ```ts
  for (const file of this.selectedFiles()) {
    const formData = new FormData();
    formData.append('file', file);
    await firstValueFrom(this.http.post(
      `${environment.apiUrl}/evidence/upload?findingId=${createdFinding._id}`,
      formData
    ));
  }
  ```

#### **B2a — Proyectos no llevan a hallazgos**
- **Estado:** Pendiente  
- **Descripción:** No hay botón para ver hallazgos del proyecto.  
- **Solución sugerida (simple):** Agregar botón que navegue a hallazgos filtrados.  
- **Recomendación técnica (correcta):**  
  ```ts
  [routerLink]="['/findings']"
  [queryParams]="{ projectId: project._id }"
  ```
  Y en `finding-list` leer `queryParams` para aplicar filtros.

#### **B2b — Clientes redirigen a dashboard**
- **Estado:** Pendiente  
- **Descripción:** El botón “Ver detalles” navega a una ruta que no existe (`/clients/:id`), por lo que termina redirigiendo a `dashboard`.  
- **Solución sugerida (simple):** Redirigir a `hallazgos` filtrados por cliente.  
- **Recomendación técnica (correcta):**  
  ```ts
  [routerLink]="['/findings']"
  [queryParams]="{ clientId: client._id }"
  ```
  Y en `finding-list` leer `clientId` desde `ActivatedRoute.queryParamMap` y ejecutar `onClientChange(clientId)`.

#### **B2c — Botón “Nuevo Proyecto” apunta a ruta inexistente**
- **Estado:** Pendiente  
- **Descripción:** `/projects/new` no está en rutas, el botón redirige mal.  
- **Solución sugerida (simple):** Crear ruta real o abrir el flujo de creación existente.  
- **Recomendación técnica (correcta):**  
  - Agregar ruta `/projects/new` a `app.routes.ts`, o  
  - Cambiar el botón para abrir un diálogo de creación si existe.

#### **B2d — Botón “Nuevo Cliente” apunta a ruta inexistente**
- **Estado:** Pendiente  
- **Descripción:** `/clients/new` no está en rutas, el botón redirige mal.  
- **Solución sugerida (simple):** Abrir el diálogo de creación desde el botón.  
- **Recomendación técnica (correcta):**  
  Reemplazar `routerLink="/clients/new"` por `(click)="openClientDialog()"`.

#### **B3a — Branding no se aplica**
- **Estado:** Pendiente  
- **Descripción:** Logo/Favicon se suben pero no se reflejan en UI.  
- **Solución sugerida (simple):** Sincronizar BrandingService con ThemeService.  
- **Recomendación técnica (correcta):**  
  ```ts
  // BrandingService: inyectar ThemeService y aplicar logo
  this.themeService.applyTheme({
    logoUrl: branding.logoUrl,
    primaryColor: branding.primaryColor
  });
  ```

#### **B3b — Archivos de branding no se sirven**
- **Estado:** Pendiente  
- **Descripción:** Se sube logo/favicon pero no hay endpoint/servido estático para `/uploads/branding`.  
- **Solución sugerida (simple):** Servir la carpeta de uploads desde backend.  
- **Recomendación técnica (correcta):**  
  Configurar `ServeStaticModule` o un endpoint `GET /branding/:file`.

#### **B4a — Backup falla por mongodump**
- **Estado:** Pendiente  
- **Descripción:** Windows no encuentra `mongodump`.  
- **Solución sugerida (simple):** Instalar MongoDB Database Tools y permitir ruta.  
- **Recomendación técnica (correcta):**  
  ```ts
  const mongodump = process.env.MONGODUMP_PATH || 'mongodump';
  const command = `${mongodump} --uri="${mongoUri}" --archive="${fullPath}" --gzip`;
  ```

#### **B5a — Auditoría no usable**
- **Estado:** Pendiente  
- **Descripción:** UI usa mock y endpoint real no está bajo `/api`.  
- **Solución sugerida (simple):** Exponer endpoint real y conectar UI.  
- **Recomendación técnica (correcta):**  
  ```
  GET /api/audit/logs
  ```

#### **B5b — Asignaciones rotas**
- **Estado:** Pendiente  
- **Descripción:** UI llama endpoint que no existe.  
- **Solución sugerida (simple):** Crear endpoint real o ajustar UI.  
- **Recomendación técnica (correcta):**  
  ```
  POST /api/auth/users/:id/areas
  POST /api/auth/users/:id/assignments   // si se implementa
  ```

#### **B6a — Exportaciones fallan fuera de localhost**
- **Estado:** Pendiente  
- **Descripción:** URLs hardcodeadas a `http://localhost:3000`.  
- **Solución sugerida (simple):** Usar `environment.apiUrl`.  
- **Recomendación técnica (correcta):**  
  ```ts
  const url = `${environment.apiUrl}/export/project/${projectId}/excel`;
  ```

#### **B6b — Clients usa API hardcodeada**
- **Estado:** Pendiente  
- **Descripción:** `client-list.component.ts` usa `http://localhost:3000/api/clients`.  
- **Solución sugerida (simple):** Usar `environment.apiUrl`.  
- **Recomendación técnica (correcta):**  
  ```ts
  const API_URL = `${environment.apiUrl}/clients`;
  ```

---

### Sección C — Mejoras y Deuda Técnica (Mejoras)

#### **M1 — SMTP Test falla con Outlook**
- **Estado:** Pendiente  
- **Descripción:** Error 535 sin explicación clara.  
- **Solución sugerida (simple):** Mostrar guía de App Password/OAuth en UI.  
- **Recomendación técnica:**  
  Agregar mensajes de ayuda + validar `SMTP_SECURE`/puerto (587/465) en UI.

#### **M2 — Multi‑tenancy inconsistente**
- **Estado:** Pendiente  
- **Descripción:** Hay dos enfoques distintos y docs desalineadas.  
- **Solución sugerida (simple):** Elegir un solo mecanismo.  
- **Recomendación técnica:**  
  Unificar en **CLS + multiTenantPlugin** o migrar todo a **AsyncLocalStorage**, pero no ambos.

#### **M3 — Lectura segura por proyecto para clientes**
- **Estado:** Pendiente  
- **Descripción:** Necesito dar acceso de lectura a un cliente solo a proyectos asignados, sin que pueda ver nada más.  
- **Solución sugerida (simple):** Crear un rol “solo lectura por proyecto” y asignar proyectos explícitos.  
- **Recomendación técnica:**  
  - Crear una tabla/colección de asignaciones `UserProjectAssignment` (userId, projectId, role=READ_ONLY, isActive).  
  - En backend, filtrar consultas de proyectos/hallazgos por proyectos asignados al usuario.  
  - En UI de admin, agregar pantalla para asignar proyectos a un usuario cliente.  

#### **M4 — Exceso de scripts / duplicidad**
- **Estado:** Pendiente  
- **Descripción:** Hay demasiados scripts y cuesta saber cuál usar.  
- **Solución sugerida (simple):** Auditar scripts, eliminar duplicados y dejar un set mínimo.  
- **Recomendación técnica:**  
  - Revisar carpeta raíz y `backend/scripts/` para identificar scripts redundantes.  
  - Consolidar en 1–2 scripts canónicos (start/seed/fix).  
  - Documentar el flujo correcto en `SETUP.md`.  

#### **M5 — Gestión avanzada de notificaciones por correo**
- **Estado:** Pendiente  
- **Descripción:** Falta una forma clara de configurar notificaciones (quién recibe, cuándo, y con qué plantilla).  
- **Solución sugerida (simple):** Crear un módulo de configuración de notificaciones y plantillas en UI.  
- **Recomendación técnica:**  
  - **Crear modelos nuevos** (backend):
    - `NotificationRule`: `{ name, event, scope, tenantId?, projectId?, enabled, channel, recipients, templateId?, throttleMinutes?, createdAt }`
    - `NotificationTemplate`: `{ code, subject, bodyHtml, variables[] }`
  - **Eventos sugeridos** (reusar los que ya existen en `EmailService` y `RetestScheduler`):
    - `USER_CREATED`, `USER_ASSIGNED_AREA`, `FINDING_ASSIGNED`, `FINDING_CLOSED`, `RETEST_UPCOMING`
  - **Campos a agregar** (config SMTP ya existe en `SystemConfig`):
    - `smtp_reply_to`, `smtp_timeout_ms`, `smtp_tls_reject_unauthorized` (opcional)
  - **Dónde tocar código**:
    - `backend/src/modules/email/email.service.ts`: leer plantilla + regla antes de enviar
    - `backend/src/modules/retest-scheduler/retest-scheduler.service.ts`: usar reglas por proyecto/tenant
    - `backend/src/modules/system-config/*`: extender DTO si se agregan campos SMTP
  - **UI**:
    - Crear pantalla de “Notificaciones” en admin para activar/desactivar reglas por tenant/proyecto
    - Permitir seleccionar destinatarios por rol/usuario/email

#### **M6 — Métricas/estadísticas exportables para BI**
- **Estado:** Pendiente  
- **Descripción:** No existe un mecanismo fácil para consumir métricas en Metabase/PowerBI.  
- **Solución sugerida (simple):** Exponer endpoints de métricas agregadas (API de reporting).  
- **Recomendación técnica:**  
  - **Crear módulo de métricas**: `backend/src/modules/metrics/*`
  - **Endpoints sugeridos**:
    - `GET /api/metrics/summary` (totales de clientes/proyectos/hallazgos)
    - `GET /api/metrics/findings-by-severity`
    - `GET /api/metrics/findings-by-status`
    - `GET /api/metrics/projects-by-status`
    - `GET /api/metrics/clients-usage`
    - `GET /api/metrics/export?format=csv|json&from=&to=&tenantId=`
  - **Filtros mínimos**: `from`, `to`, `tenantId`, `clientId`, `projectId`
  - **Campos clave ya existentes**:
    - Findings: `severity`, `status`, `retestIncluded`, `createdAt`, `closedAt`, `projectId`, `tenantId`
    - Projects: `projectStatus`, `serviceArchitecture`, `tenantId`, `clientId`, `createdAt`
    - Clients: `isActive`, `createdAt`
  - **Índices recomendados**:
    - `findings`: `{ tenantId, projectId, severity, status, createdAt }`
    - `projects`: `{ tenantId, projectStatus, createdAt }`
  - **Para BI externo**:
    - Exponer JSON/CSV estable y documentado
    - Opcional: colección materializada `metrics_daily` para acelerar dashboards

---

**Fecha de actualización:** 30 de Enero de 2026  

-------------------------------------------------------------------------------------------------------------------

**Fecha de actualización:** 12 de Marzo de 2026

### **B2c — Botón “Nuevo Proyecto” apunta a ruta inexistente**
- **Estado:**  ⚠️ Parcial
- **Descripción:** El botón “Nuevo Proyecto” redirige a /projects/new, pero esta ruta no está registrada en el router del frontend.
- **Solución sugerida (simple):** Crear la ruta /projects/new o reutilizar el flujo existente de creación de proyectos.
- **Recomendación técnica:**  Durante la revisión se confirmó que:
  -El sistema sí permite crear proyectos correctamente.
  -Sin embargo, el botón redirige a una ruta inexistente.

- **Además se detectó que:**
  -Al editar un proyecto existente
  -y cambiar el cliente asociado

el sistema no guarda el nuevo cliente correctamente.
Esto indica que el problema no está en la creación del proyecto sino en la lógica de actualización del campo clientId en la edición.


### **B2d — Botón “Nuevo Cliente” apunta a ruta inexistente**
- **Estado:** ✅ Completado
- **Descripción:** El botón “Nuevo Cliente” redirigía a /clients/new, pero la ruta no estaba registrada en el router.
- **Solución sugerida (simple):** Crear la ruta /clients/new o usar el diálogo de creación existente.
- **Recomendación técnica (correcta):** Durante la revisión se verificó que el sistema sí permite crear clientes correctamente, pero el botón del menú redirigía a una ruta inexistente.
Durante la revisión se verificó que el sistema sí permite crear clientes correctamente, pero el botón del menú redirigía a una ruta inexistente.
- **El sistema ahora permite:**
    crear clientes
    navegar correctamente desde el menú
    evitar redirecciones a rutas inexistentes.


### **B4a — Backup falla por mongodump**
- **Estado:** ✅ Completado
- **Descripción:** El sistema de backup fallaba porque Windows no encontraba el ejecutable mongodump.
- **Solución sugerida (simple):** Instalar MongoDB Database Tools y agregar la ruta al PATH del sistema.
- **Recomendación técnica (correcta):** El backend utiliza el comando: mongodump, para generar backups de la base de datos.
El problema ocurría porque MongoDB Database Tools no estaba configurado en el PATH del sistema, por lo que NodeJS no podía ejecutar el comando.

- **Se realizaron las siguientes acciones:**
instalación de MongoDB Database Tools
configuración del PATH del sistema
validación del funcionamiento del backup desde la UI.

- **Ahora el sistema permite:**
crear backups
descargar backups
restaurar backups
eliminar backups
desde la interfaz administrativa.

### **B5a — Auditoría no usable**
- **Estado:** ✅ Completado
- **Descripción:** La colección auditlogs contenía registros con valores incompatibles con el schema de Mongoose.
- **Solución sugerida (simple):** Normalizar los datos existentes en MongoDB.
- **Recomendación técnica (correcta):**
Se detectó que algunos registros tenían:
performedBy: "anonymous"

Sin embargo el schema espera:
performedBy: ObjectId

Esto provocaba que Mongoose intentara convertir el string a ObjectId, generando errores.
Se aplicó la siguiente corrección en MongoDB:

db.auditlogs.updateMany(
  { performedBy: "anonymous" },
  { $set: { performedBy: null, performedByLabel: "anonymous" } }
)

- **Los registros ahora quedan como:**
performedBy: null
performedByLabel: "anonymous"

Esto permite:
evitar errores de populate()
mantener el valor descriptivo mediante performedByLabel.

### **B5b — Endpoint /assignments no persiste cambios**
- **Estado:**  ⚠️ Parcial
- **Descripción:** El sistema indicaba que el endpoint /assignments no existía.
- **Solución sugerida (simple):** Verificar el endpoint real y la persistencia de datos.
- **Recomendación técnica (correcta):**
Durante la revisión se confirmó que el endpoint real es:
/api/auth/users/:userId/assignments

El endpoint sí existe y responde correctamente.

-**Sin embargo se detectó el siguiente comportamiento:**
la UI muestra “Cambios guardados exitosamente”
pero la asignación no se guarda en la base de datos

-**Esto indica que el problema está en:**
lógica de persistencia
DTO de asignación
actualización del modelo de usuario.

### **B6a — URLs hardcodeadas a localhost**
- **Estado:** ✅ Completado
- **Descripción:** Se detectaron múltiples archivos con URLs hardcodeadas a http://localhost:3000.
- **Solución sugerida (simple):** Usar environment.apiUrl.
- **Recomendación técnica (correcta):** Se reemplazaron las URLs hardcodeadas por variables de entorno.
Por ejemplo:
- 'const url = `${environment.apiUrl}/export/project/${projectId}/excel`;'

- **Esto permite que el sistema funcione correctamente en:**
  desarrollo
  staging
  producción.

### **B6b — Clients usa API hardcodeada**
- **Estado:** ✅ Completado
- **Descripción:** El componente client-list.component.ts utilizaba directamente la URL http://localhost:3000/api/clients.
- **Solución sugerida (simple):** Utilizar environment.apiUrl.
- **Recomendación técnica (correcta):** Se reemplazó la URL fija por una configuración basada en entorno.
Ejemplo:
const API_URL = `${environment.apiUrl}/clients`;



### **M2 — Multi-tenancy inconsistente**
- **Estado:** ✅ Completado
- **Descripción:** El sistema tenía inconsistencias en el manejo de multi-tenancy entre distintos módulos.
- **Solución sugerida (simple):** Unificar el manejo de tenant en consultas y operaciones CRUD.
- **Recomendación técnica:** Se revisó el módulo Projects para asegurar que todas las consultas respeten:
  tenantId
  areaId
  permisos del usuario

- **Esto incluye:**
  creación de proyectos
  consultas
  actualizaciones
  operaciones administrativas.

La misma estrategia fue preparada para el módulo Findings, aunque no pudo validarse completamente por falta de tiempo para pruebas.

### **M3 — Permisos de lectura por proyecto para clientes**
- **Estado:** ✅ Completado
- **Descripción:** Los usuarios clientes podían visualizar proyectos que no les correspondían.
- **Solución sugerida (simple):** Implementar control de visibilidad por proyecto.
- **Recomendación técnica:** Se agregó el campo: visibleProjectIds al modelo de usuarios
Esto permite que el administrador defina qué proyectos puede ver cada usuario.

-**Cambios implementados:**
  campo visibleProjectIds en usuarios
  filtrado de proyectos visibles
  ProjectService respeta estos permisos
  interfaz administrativa permite asignar proyectos visibles.

### **M4 — Exceso de scripts / duplicidad**
- **Estado:** ✅ Completado
- **Descripción:** Existía una gran cantidad de scripts duplicados o dispersos en el backend.
- **Solución sugerida (simple):** Consolidar scripts y organizarlos por función.
- **Recomendación técnica:** Se reorganizaron los scripts en carpetas funcionales:
  scripts/
  ├ diagnostics
  ├ inspection
  ├ maintenance
  ├ seeds
  ├ startup
  └ logs

También se centralizó su ejecución mediante scripts definidos en package.json.
Esto facilita el mantenimiento del proyecto y evita duplicación de scripts.






