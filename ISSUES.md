🐛 Issues y Funcionalidades Pendientes - ShieldTrack

**Fecha de Reporte:** 30 de Enero de 2026  
**Versión:** HONESTO-2.0  
**Tipo:** Reporte QA + Backlog Técnico

---

## 📌 Resumen Ejecutivo (en simple)
El sistema funciona en lo básico, pero hay problemas de navegación, branding, evidencias y backup que afectan el uso diario.  
Además, antes de arreglar todo, se definió como prioridad **actualizar el frontend a Angular 20** para no corregir sobre una base obsoleta.

**Versión actual en el repo:** Frontend en **Angular 17.x** (ver `frontend/package.json`).  

---

## Estado general (tabla de control)

| ID | Sección | Tarea | Estado | Notas |
| --- | --- | --- | --- | --- |
| P0 | Actualización Angular 20 | Plan general de actualización | Pendiente | Debe hacerse primero |
| F0-1 | Fase 0 (Preparación) | Crear rama aislada | Pendiente | Sugerido: `feature/angular-20-upgrade` |
| F0-2 | Fase 0 (Preparación) | Limpieza del entorno | Pendiente | Borrar `node_modules` y reinstalar |
| F0-3 | Fase 0 (Preparación) | Verificar pruebas | Pendiente | Documentar qué tests existen |
| F1-1 | Fase 1 (Upgrade) | Subir `@angular/core` y `@angular/cli` | Pendiente | `ng update` |
| F1-2 | Fase 1 (Upgrade) | Subir `@angular/material` + `@angular/cdk` | Pendiente | Revisión de estilos |
| F1-3 | Fase 1 (Upgrade) | Alinear TypeScript/RxJS/Zone | Pendiente | Según guía Angular 20 |
| F1-4 | Fase 1 (Upgrade) | Arreglar breaking changes | Pendiente | Hasta `ng build` limpio |
| F1-5 | Fase 1 (Upgrade) | Validar librerías externas | Pendiente | ngx‑charts, animejs, etc. |
| B1a | Bugs - Evidencias | Evidencias no se ven / previews fallan | Pendiente | Campos no coinciden |
| B1b | Bugs - Evidencias | Wizard no sube archivos | Pendiente | Se pierde evidencia inicial |
| B2a | Bugs - Navegación | Proyectos no llevan a hallazgos | Pendiente | Falta acción |
| B2b | Bugs - Navegación | Clientes redirige a dashboard | Pendiente | Ruta `/clients/:id` no existe |
| B2c | Bugs - Navegación | Botón “Nuevo Proyecto” va a `/projects/new` (ruta no existe) | Pendiente | Redirige mal |
| B2d | Bugs - Navegación | Botón “Nuevo Cliente” va a `/clients/new` (ruta no existe) | Pendiente | Redirige mal |
| B3a | Bugs - Branding | Logo/Favicon no se aplica | Pendiente | Se sube pero no se ve |
| B3b | Bugs - Branding | Archivos de branding no se sirven públicamente | Pendiente | `/uploads/branding` no expuesto |
| B4a | Bugs - Backup | `mongodump` no está en PATH | Pendiente | Falla en Windows |
| B5a | Bugs - Auditoría | UI mock / endpoint no `/api` | Pendiente | Auditoría no usable |
| B5b | Bugs - Asignaciones | Endpoint `/assignments` no existe | Pendiente | Funcionalidad rota |
| B6a | Bugs - Export | URLs hardcodeadas a localhost | Pendiente | Falla fuera de localhost |
| B6b | Bugs - API | Clients usa API hardcodeada a localhost | Pendiente | Falla fuera de localhost |
| M1 | Mejoras | SMTP test falla (Outlook 535) | Pendiente | Falta guía |
| M2 | Mejoras | Multi‑tenancy inconsistente | Pendiente | CLS vs AsyncLocalStorage |
| M3 | Mejoras | Permisos de lectura por proyecto para clientes | Pendiente | Asignar proyectos visibles por admin |
| M4 | Mejoras | Exceso de scripts / duplicidad | Pendiente | Revisar y consolidar scripts |
| M5 | Mejoras | Gestión avanzada de notificaciones por correo | Pendiente | Configurar reglas y plantillas |
| M6 | Mejoras | Métricas/estadísticas exportables para BI | Pendiente | Integración con Metabase/PowerBI |

---

## Backlog de Tareas (Post‑Actualización a Angular 20)

> Formato: cada issue incluye **Descripción**, **Solución sugerida (simple)** y **Recomendación técnica** en el mismo bloque.

### Sección A — Actualización Angular 20 (Prioridad 0)

#### **F0-1 — Crear rama aislada**
- **Estado:** Pendiente  
- **Descripción:** Evita romper `main` durante el upgrade.  
- **Solución sugerida (simple):** Crear una rama dedicada.  
- **Recomendación técnica:**  
  ```bash
  git checkout -b feature/angular-20-upgrade
  ```

#### **F0-2 — Limpieza del entorno**
- **Estado:** Pendiente  
- **Descripción:** Evita errores ocultos por dependencias antiguas.  
- **Solución sugerida (simple):** Borrar `node_modules` y reinstalar.  
- **Recomendación técnica:**  
  ```bash
  # frontend
  rm -rf node_modules package-lock.json
  npm install
  ```

#### **F0-3 — Verificar pruebas**
- **Estado:** Pendiente  
- **Descripción:** Saber qué tests existen antes de actualizar.  
- **Solución sugerida (simple):** Ejecutar pruebas y documentar resultados.  
- **Recomendación técnica:**  
  ```bash
  # frontend
  ng test
  # backend
  npm test
  ```

#### **F1-1 — Subir Angular Core/CLI**
- **Estado:** Pendiente  
- **Descripción:** Paso base para llegar a v20.  
- **Solución sugerida (simple):** Actualizar core y CLI.  
- **Recomendación técnica:**  
  ```bash
  cd frontend
  npx ng update @angular/core@20 @angular/cli@20
  ```

#### **F1-2 — Subir Angular Material/CDK**
- **Estado:** Pendiente  
- **Descripción:** Mantener UI compatible con v20.  
- **Solución sugerida (simple):** Actualizar Material/CDK.  
- **Recomendación técnica:**  
  ```bash
  npx ng update @angular/material@20
  ```

#### **F1-3 — Alinear TypeScript/RxJS/Zone**
- **Estado:** Pendiente  
- **Descripción:** Angular 20 exige versiones específicas.  
- **Solución sugerida (simple):** Seguir el output de `ng update`.  
- **Recomendación técnica:**  
  Ajustar versiones en `frontend/package.json` según lo que indique `ng update`.

#### **F1-4 — Corregir breaking changes**
- **Estado:** Pendiente  
- **Descripción:** Cambios de build/templates pueden romper.  
- **Solución sugerida (simple):** Arreglar errores hasta compilar limpio.  
- **Recomendación técnica:**  
  ```bash
  ng build
  # corregir errores de templates o typings hasta quedar limpio
  ```

#### **F1-5 — Revisar librerías externas**
- **Estado:** Pendiente  
- **Descripción:** Librerías pueden quedar incompatibles.  
- **Solución sugerida (simple):** Actualizar o reemplazar.  
- **Recomendación técnica:**  
  Revisar `ngx-charts`, `animejs`, etc. y subir versiones si el build lo exige.

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

#### **B2b — Clientes redirige a dashboard**
- **Estado:** Pendiente  
- **Descripción:** “Ver detalles” apunta a ruta inexistente.  
- **Solución sugerida (simple):** Crear `/clients/:id` o redirigir a hallazgos filtrados.  
- **Recomendación técnica (correcta):**  
  ```ts
  [routerLink]="['/findings']"
  [queryParams]="{ clientId: client._id }"
  ```

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
