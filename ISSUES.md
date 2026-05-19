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
| B4a | ✅ Completado | Bugs - Backup | mongodump no está en PATH | Instalado en contenedor y mejorado error handling |
| B5a | ✅ Completado | Bugs - Auditoría | UI mock / endpoint no `/api` | Datos normalizados y auditoría funcional |
| B5b | ✅ Completado | Bugs - Asignaciones | Endpoint `/assignments` no persiste | Corregido persistencia y lógica de actualización |
| B8b | ✅ Completado | Bugs - Backend | Campo "Cliente" vacío en Tenants/Áreas | Frontend muestra tenantId si falta clientId; Backend ajustado |
| B9a | ✅ Completado | Bugs - Frontend | Escritura al revés en campos enriquecidos | Sincronización manual del DOM implementada |
| B6a | ✅ Completado | Bugs - Export | URLs hardcodeadas a localhost | Reemplazado por environment.apiUrl |
| B6b | ✅ Completado | Bugs - API | Clients usa API hardcodeada a localhost | Reemplazado por environment.apiUrl |
| B6c | ✅ Completado | Bugs - Export | Error 401 / Ruta finding missing | Implementada ruta /export/finding y filtrado |
| B7a | ✅ Completado | Bugs - Frontend | Nuevo Hallazgo - Wizard Profesional, seleccion de cliente no permite corregir | Agregado evento focus para mostrar lista completa |
| B7b | ✅ Completado | Bugs - Frontend | Wizard Profesional campo proyecto no carga de forma inmediata toda la informacion | Corregido filtrado reactivo para soportar objetos poblados y tenantId |
| B7c | ✅ Completado | Bugs - Frontend | Duración del proyecto no actualiza contador | Implementado seguimiento reactivo de fechas con signals |
| B7d | ✅ Completado | Bugs - Findings | Nuevo Hallazgo falla al guardar con cve_id, detection_source y references | DTO/backend y payload del wizard alineados; contador de codes autocorregido |
| B7e | ✅ Completado | Bugs - Findings | Cierre masivo desde `/findings` no cierra ni oculta hallazgos | Frontend envia `_id` como `ids`; backend usa motivo valido y lista se refresca |
| B7f | ✅ Completado | Bugs - Findings | Boton editar de hallazgo redirige a dashboard | Agregada ruta `/findings/:id/edit` y entrada directa en modo edicion |
| B7g | ✅ Completado | Bugs - Findings | Guardar edicion de hallazgo responde 400 Bad Request | Payload de edicion alineado: `cvssScore` y `references` string[] |
| B7h | ✅ Completado | Bugs - Findings | Boton ver timeline redirige a dashboard | Agregada ruta `/findings/:id/timeline` y apertura directa en pestaña Seguimiento |
| B7i | ✅ Completado | Bugs - Findings | Seguimiento agregado con evidencia desaparece al volver a entrar | Backend guarda timeline con ObjectId, datos existentes migrados y frontend normaliza render |
| B7j | ✅ Completado | Bugs - Findings | Modal Agregar Seguimiento aparece desordenado | Formato original restaurado con ejemplos/adjuntos y guardado conservado |
| B8a | ✅ Completado | Bugs - Backend | Error E11000 duplicidad en códigos VULN-000001 | Implementado correlativo por año con ordenamiento DESC robusto |
| B10a | ✅ Completado | Bugs - Docker/Seeds | Login falla con credenciales seed en Docker | Runtime copia scripts/package; seeds usan bcryptjs; owner se normaliza |
| M1 | ✅ Completado | Mejoras | SMTP test falla (Outlook 535) | Fix realizado, falta validar |
| M2 | ✅ Completado | Mejoras | Multi‑tenancy inconsistente | Unificado en módulo Projects |
| M3 | ✅ Completado | Mejoras | Permisos de lectura por proyecto para clientes | Implementado visibleProjectIds |
| M4 | ✅ Completado | Mejoras | Exceso de scripts / duplicidad | Scripts reorganizados y centralizados |
| M5 | ❌ Pendiente | Mejoras | Gestión avanzada de notificaciones por correo | Configurar reglas y plantillas |
| M6 | ⚠️ Revisar | Mejoras | Métricas/estadísticas exportables para BI | Integración con Metabase/PowerBI |

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

#### **B10a - Login falla con credenciales seed en Docker**
- **Estado:** ✅ Completado
- **Fecha:** 2026-05-08
- **Descripcion:** El sitio rechazaba credenciales de desarrollo aunque Docker estaba levantado y el selector de login mostraba usuarios seed validos.
- **Causa raiz:** La imagen runtime del backend no copiaba `package*.json` ni `scripts/`, pero `docker-entrypoint.sh` intentaba ejecutar `npm run seed:owner` y `npm run seed:test`. Ademas, los seeds requerian `bcrypt`, mientras que el backend y la imagen solo tienen `bcryptjs`. Los errores quedaban ocultos por `|| echo`, dejando el contenedor arriba con usuarios/credenciales antiguas en Mongo.
- **Solucion aplicada:** `backend/Dockerfile` copia `package*.json` y `scripts/`; `backend/docker-entrypoint.sh` ya no oculta errores de seed; `create-owner.js` y `seed-test-data.js` usan `bcryptjs`; `create-owner.js` normaliza `admin@shieldtrack.com` si ya existe.
- **Validacion:** Backend reconstruido con `docker compose up --build -d backend`; login por API OK para `admin@shieldtrack.com / Admin123!`, `owner@shieldtrack.com / Password123!`, `clientadmin@acmecorp.com / Password123!` y `viewer@shieldtrack.com / Password123!`.

#### **B7d - Nuevo Hallazgo falla al guardar con campos tecnicos**
- **Estado:** ✅ Completado
- **Fecha:** 2026-05-11
- **Descripcion:** Al guardar un hallazgo desde `/findings/new`, la API respondia `property cve_id should not exist`, `property detection_source should not exist` y `each value in references must be a string`.
- **Causa raiz:** El wizard enviaba `cve_id` y `detection_source`, pero los DTOs de hallazgos no los aceptaban. Ademas, `references` se enviaba como objetos `{ label, url }` aunque el backend espera `string[]`. Durante la validacion se detecto tambien que el contador de `code` podia quedar desfasado con datos seed y generar duplicados `VULN-2026-000001`.
- **Solucion aplicada:** `CreateFindingDto` y `UpdateFindingDto` aceptan `cve_id` y `detection_source`; el wizard convierte referencias a strings antes de guardar; `FindingService` mapea `cvssScore` a `cvss_score`; el hook de correlativos sincroniza el contador con el mayor codigo existente por prefijo/anio antes de incrementar.
- **Validacion:** Backend y frontend reconstruidos con `docker compose up --build -d backend frontend`. Prueba por API creada con `cve_id`, `detection_source`, `references: string[]` y `cvssScore`; se genero `VULN-2026-000002` correctamente y el hallazgo temporal fue eliminado.

#### **B7e - Cierre masivo no oculta hallazgos en listado**
- **Estado:** ✅ Completado
- **Fecha:** 2026-05-11
- **Descripcion:** En `/findings`, al marcar un hallazgo y presionar `Cerrar`, el hallazgo no se cerraba ni desaparecia del listado activo.
- **Causa raiz:** El frontend tomaba `f.id` aunque los documentos usan `_id`, y enviaba el body como `{ findingIds }`, mientras que el backend esperaba `{ ids }`. Ademas, el servicio frontend marcaba estado local como `Closed`, valor que no coincide con el enum real `CLOSED`.
- **Solucion aplicada:** El listado ahora obtiene `_id`, el servicio envia `{ ids, closeReason: 'FIXED' }`, elimina localmente los hallazgos cerrados y recarga la lista. El backend valida `closeReason` como enum y usa `FIXED` por defecto.
- **Validacion:** Prueba por API creada con hallazgo temporal `VULN-2026-000004`; `/findings/bulk-close` devolvio `1`, el detalle quedo `CLOSED/FIXED`, el hallazgo ya no aparecio en `/findings` y luego fue eliminado permanentemente.

#### **B7f - Boton editar de hallazgo redirige a dashboard**
- **Estado:** ✅ Completado
- **Fecha:** 2026-05-12
- **Descripcion:** En `/findings`, al presionar el icono del lapiz, la app navegaba a `/findings/:id/edit` pero terminaba en `/dashboard`.
- **Causa raiz:** El router no tenia declarada la ruta `/findings/:id/edit`; por eso Angular caia en la ruta wildcard `**` y redirigia a `dashboard`.
- **Solucion aplicada:** Se agrego la ruta `/findings/:id/edit` reutilizando `FindingDetailComponent` con `data: { editMode: true }`. El componente ahora activa `editMode` al entrar por esa ruta.
- **Validacion:** Build frontend exitoso con `npm.cmd run build`; contenedor `frontend` reconstruido con `docker compose up --build -d frontend`.

#### **B7g - Guardar edicion de hallazgo responde 400 Bad Request**
- **Estado:** ✅ Completado
- **Fecha:** 2026-05-12
- **Descripcion:** Desde `/findings/:id/edit`, al guardar cambios, el backend respondia 400 y la consola mostraba `Failed to load resource`.
- **Causa raiz:** El editor enviaba `cvss_score` y `references`; `UpdateFindingDto` esperaba `cvssScore` y no permitia `references`, por lo que el `ValidationPipe` rechazaba el payload con `property cvss_score should not exist` y `property references should not exist`.
- **Solucion aplicada:** El editor envia `cvssScore`, normaliza referencias a `string[]`, y renderiza referencias existentes aunque vengan desde API como strings. `UpdateFindingDto` ahora acepta `references` y `FindingService.update()` mapea `cvssScore` a `cvss_score` antes de persistir.
- **Validacion:** Frontend compila con `npm.cmd run build`; Docker reconstruido con `docker compose up --build -d backend frontend`. Prueba por API edito un hallazgo temporal con `cvssScore: 7.1` y `references`, confirmando respuesta OK y persistencia en `cvss_score`; el hallazgo temporal fue eliminado.

#### **B7h - Boton ver timeline redirige a dashboard**
- **Estado:** ✅ Completado
- **Fecha:** 2026-05-12
- **Descripcion:** En `/findings`, al presionar el icono de historial/timeline, la app navegaba a `/findings/:id/timeline` pero terminaba en `/dashboard`.
- **Causa raiz:** El router no tenia declarada la ruta `/findings/:id/timeline`; Angular caia en la ruta wildcard `**` y redirigia a `dashboard`.
- **Solucion aplicada:** Se agrego la ruta `/findings/:id/timeline` reutilizando `FindingDetailComponent` con `data: { tabIndex: 3 }`. El componente ahora permite seleccionar la pestaña inicial y abre directamente `Seguimiento`.
- **Validacion:** Build frontend exitoso con `npm.cmd run build`; contenedor `frontend` reconstruido con `docker compose up --build -d frontend`.

#### **B7i - Seguimiento con evidencia no aparece tras guardar**
- **Estado:** ✅ Completado
- **Fecha:** 2026-05-12
- **Descripcion:** En `/findings/:id/timeline`, al agregar un seguimiento con evidencia, podia aparecer inmediatamente pero desaparecer al salir y volver a entrar. Tambien se podia desordenar el render del timeline al recibir evidencias pobladas.
- **Causa raiz:** `FindingUpdate` define `findingId`, `createdBy` y `evidenceIds` como `ObjectId`, pero el servicio creaba updates usando strings del DTO. Ademas, el seed de Docker se ejecutaba en cada arranque y recreaba los hallazgos de prueba con IDs nuevos, dejando huerfanos los seguimientos creados sobre esos hallazgos.
- **Solucion aplicada:** `FindingService.createUpdate()`, `getTimeline()` y los cambios de estado ahora convierten IDs a `ObjectId` de forma explicita. Se migraron los updates existentes en MongoDB para recuperar los seguimientos ya creados. El seed de prueba usa IDs estables para tenants, clientes, areas, proyectos, usuarios y hallazgos. En frontend, `FindingDetailComponent` normaliza y ordena los updates antes de renderizar, soportando evidencias como IDs o documentos poblados.
- **Validacion:** Se confirmo por API que `/api/findings/6a0376fcba97a85a6ae4a3c4/timeline` devuelve `COUNT=1` con el seguimiento `6a0377695d0c126a104e0e10` y 1 evidencia despues de reconstruir Docker. Build frontend exitoso, build Docker backend/frontend exitoso y contenedores reconstruidos.

#### **B7j - Modal Agregar Seguimiento desordenado**
- **Estado:** ✅ Completado
- **Fecha:** 2026-05-12
- **Descripcion:** Al presionar `Agregar Seguimiento`, el formulario del modal se veia desordenado y dificil de usar.
- **Causa raiz:** El dialogo tenia textos largos dentro de `mat-option`, caracteres rotos y chips de archivos sin una estructura visual estable.
- **Solucion aplicada:** Se restauro `AddUpdateDialogComponent` con el formato original: titulo, selector de tipo, descripcion, adjuntar evidencias y recuadro de ejemplos. Se corrigieron textos/estilos que desordenaban el modal y se conserva el mismo payload (`type`, `content`, `files`) usado por `FindingDetailComponent`.
- **Validacion:** Build frontend exitoso con `npm.cmd run build`.

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

#### **B7a — Nuevo Hallazgo - Wizard Profesional**
- **Estado:** ✅ Completado
- **Descripción:** Al seleccionar cliente, si me equivoco en seleccionar, comboBox `Cliente` no permite seleccionar otro, por ende debo salir y crear nuevamente.
- **Solución sugerida (simple):** Mostrar en todo momento la lista total de Clientes.
- **Recomendación técnica (correcta):**    
  **Problema raíz:** Cuando el usuario selecciona un cliente, el campo `clientName` se actualiza con el nombre del cliente seleccionado. Esto dispara `valueChanges`, lo que aplica un filtro que solo muestra el cliente seleccionado.
  
  **Solución implementada:**
  - Agregado evento `(focus)="onClientInputFocus()"` al input del cliente en el template
  - Método `onClientInputFocus()` resetea `filteredClients` a la lista completa de clientes
  - Cuando el usuario hace click en el input, siempre ve la lista completa, permitiendo cambiar de cliente
  
  **Cambios en código:**
  ```ts
  onClientInputFocus(): void {
    // Mostrar todos los clientes cuando el usuario hace focus
    this.filteredClients.set(this.clients());
    this.showCreateClient.set(false);
  }
  ```

#### **B7b — Nuevo Hallazgo - Wizard Profesional - campo Proyecto**
- **Estado:** ✅ Completado
- **Descripción:** Al seleccionar cliente, en el cuadro `Proyecto` no se pobla con la información. Si escribo algo, elimino, recién en ese momento se puebla con la información ya existente. Existe un lag.
- **Solución sugerida (simple):** Mostrar en todo momento la lista total de proyectos del cliente
- **Recomendación técnica (correcta):**
  **Problema raíz (v1):** El filtrado de proyectos no consideraba el `clientId` seleccionado. Buscaba en TODOS los proyectos del sistema, causando lag y mostrando datos incorrectos.
  
  **Problema identificado (v2):** Después de la primera corrección, el filtro por `clientId` en `setupProjectFilter()` funcionaba solo cuando el usuario escribía. Sin embargo, cuando se seleccionaba un cliente, los proyectos no se poblaban inmediatamente porque no había evento que dispare la actualización.
  
  **Solución final implementada:**
  - Agregado nuevo signal `currentClientProjects` para mantener los proyectos del cliente sin filtrar por búsqueda de texto
  - Mejorado listener en `setupClientFilter()` para que al cambiar `clientId`, se actualize inmediatamente `currentClientProjects` y `filteredProjects`
  - `setupProjectFilter()` ahora filtra desde `currentClientProjects` (que siempre tiene los datos correctos del cliente)
  - El evento `focus` resetea la lista a la completa del cliente
  - Arquitectura de dos capas: 
    1. `currentClientProjects`: proyectos del cliente actual (actualizado cuando cambia clientId)
    2. `filteredProjects`: resultado después de aplicar búsqueda de texto
  
  **Cambios en código:**
  ```ts
  // Signal para mantener proyectos sin filtrar por texto
  currentClientProjects = signal<any[]>([]);
  filteredProjects = signal<any[]>([]);

  // En setupClientFilter(), cuando cambia clientId:
  this.basicForm.get('clientId')?.valueChanges.subscribe(clientId => {
    if (clientId && clientId !== 'new') {
      const allProjects = this.projectService.projects();
      const clientProjects = allProjects.filter(p => p.clientId === clientId);
      this.currentClientProjects.set(clientProjects);
      this.filteredProjects.set(clientProjects);  // Mostrar inmediatamente
      this.basicForm.get('projectName')?.reset('', { emitEvent: false });
    }
  });

  // En setupProjectFilter(), filtra desde currentClientProjects:
  const filtered = this.currentClientProjects().filter(p => 
    p.name.toLowerCase().includes(filter)
  );
  this.filteredProjects.set(filtered);
  ```
  
  **Resultado:** Los proyectos se cargan inmediatamente sin lag, y siempre se puede cambiar de proyecto haciendo click en el input.

  

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
- **Descripción:** El sistema tenía inconsistencias en el manejo de multi-tenancy entre distintos módulos y fallaba en cargas masivas de áreas sin contexto de tenant.
- **Solución sugerida (simple):** Unificar el manejo de tenant en consultas y operaciones CRUD.
- **Recomendación técnica:** 
  - Se implementó la **Asignación Correlativa (Round-Robin)** en el `AreaService`.
  - Si un `OWNER` no especifica `tenantId`, el sistema calcula el siguiente tenant basándose en `totalAreas % activeTenants.length`.
  - Se añadieron tests unitarios para garantizar el aislamiento de datos y la correcta distribución.
  - Se revisó el módulo Projects para asegurar que todas las consultas respeten el contexto.

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

-------------------------------------------------------------------------------------------------------------------

**Fecha de actualización:** 4 de Mayo de 2026

### **B9a — Escritura al revés en campos enriquecidos (Wizard)**
- **Estado:** ✅ Completado
- **Descripción:** Al escribir en los campos "Descripción Técnica" o "Recomendación de Remediación" del Wizard de Hallazgos, el texto se ingresaba de forma invertida o el cursor saltaba al inicio en cada pulsación.
- **Solución sugerida (simple):** Desactivar el binding reactivo del DOM que reinicia el caret.
- **Recomendación técnica (correcta):** Se eliminó el uso de `[innerHTML]` (que causaba el reinicio del cursor al re-renderizar) y se implementó una sincronización manual del DOM. El componente ahora solo actualiza el `innerHTML` si el contenido del modelo es realmente diferente al del DOM, preservando la posición del cursor durante la escritura. Se utilizaron setters de `ViewChild` y suscripciones a `valueChanges` con `takeUntilDestroyed` para mantener la reactividad sin afectar la experiencia de usuario.





-------------------------------------------------------------------------------------------------------------------

**Fecha de actualizacion:** 19 de Mayo de 2026

### **B7k - Evidencias de seguimiento rompen el render del timeline**
- **Estado:** Completado
- **Descripcion:** En `/findings/:id/timeline`, al adjuntar una evidencia a un seguimiento, la consola mostraba `Cannot read properties of undefined (reading 'includes')` y la vista podia dejar de renderizar evidencias correctamente.
- **Causa raiz:** El backend guarda y devuelve evidencias con `mimeType` y `filename`, mientras partes del frontend esperaban `mimetype` y `originalName`.
- **Solucion aplicada:** Se normalizan evidencias en frontend para soportar `mimeType/mimetype` y `filename/originalName`; la plantilla usa helpers seguros antes de llamar `includes()` o `startsWith()`.
- **Validacion:** Build frontend exitoso con `npm.cmd run build`; contenedor frontend reconstruido con Docker.

### **B2e - Proyecto creado no muestra cliente o no aparece en listado**
- **Estado:** Completado
- **Descripcion:** Al crear un proyecto desde `/projects`, el proyecto se guardaba, pero podia quedar con cliente `N/A` o no aparecer en el listado.
- **Causa raiz:** La UI creaba el proyecto sin `clientId` y luego intentaba asignarlo con un segundo `PUT`; ademas el listado del backend filtraba por tenant actual incluso para usuarios globales.
- **Solucion aplicada:** La creacion envia `clientId` en el `POST` inicial, se elimino la asignacion posterior y el listado de proyectos permite a usuarios globales ver proyectos de distintos clientes.
- **Validacion:** Build frontend y reconstruccion Docker completados; creacion de proyectos validada manualmente en `localhost/projects`.

### **B2f - Editar proyecto y cambiar cliente responde 400**
- **Estado:** Completado
- **Descripcion:** Al editar un proyecto y cambiar el cliente, el backend respondia `No se pudo determinar el cliente del usuario actual`.
- **Causa raiz:** `ProjectService.update()` exigia siempre un tenant/cliente propio en el usuario autenticado, lo que falla para usuarios globales como `OWNER` o `PLATFORM_ADMIN`.
- **Solucion aplicada:** Usuarios globales pueden reasignar `clientId`; cuando lo hacen, el backend alinea tambien `tenantId` para mantener consistencia.
- **Validacion:** Backend reconstruido en Docker; cambio de cliente validado manualmente.

### **B3c - Configuracion completa de area falla al guardar branding**
- **Estado:** Completado
- **Descripcion:** Guardar la configuracion completa de area con textos, colores, logo y favicon podia devolver 500.
- **Causa raiz:** Faltaban campos visuales en DTO/schema y el body JSON por defecto no soportaba payloads grandes con imagenes base64.
- **Solucion aplicada:** `UpdateAreaDto` y `AreaSchema` aceptan campos de branding; `main.ts` configura body parser con limite mayor para JSON/urlencoded.
- **Validacion:** Backend reconstruido en Docker y guardado validado desde la UI.

### **M7 - Estandarizacion frontend de contratos API**
- **Estado:** Completado
- **Descripcion:** El frontend recibia respuestas con variantes de nombre y tipo (`mimeType/mimetype`, `filename/originalName`, `tenantId/clientId`, `areaId/areaIds`, fechas `Date|string`), lo que generaba bugs puntuales entre pantallas.
- **Solucion aplicada:** Se agrego `frontend/src/app/shared/utils/domain-normalizers.ts` con normalizadores de evidencias, seguimientos, hallazgos y proyectos; `ProjectService`, `FindingService` y `FindingDetailComponent` consumen esa capa.
- **Validacion:** Build frontend exitoso y contenedor frontend reconstruido.


