# 🐛 Issues y Funcionalidades Pendientes - ShieldTrack

**Fecha de Reporte:** 22 de Diciembre de 2025  
**Versión:** 1.0  
**Tipo:** Reporte de Soporte Técnico

---

## 📋 Resumen Ejecutivo

Este documento lista todos los problemas detectados en el sistema ShieldTrack, tanto por pruebas de usuario como por revisión del código vs. los requerimientos originales del `Promp.txt`.

**Estado General:**
- ✅ Funcionalidades Core implementadas (Hallazgos, Proyectos, Usuarios, Timeline)
- ⚠️ Funcionalidades parcialmente implementadas (Áreas, Retest Scheduler)
- ❌ Funcionalidades no implementadas (White-labeling, Animaciones, Backup completo)

---

## 🔴 CRÍTICO - P0 (Impacto Alto, Bloquea funcionalidad principal)

### 1. Clientes muestran 0 proyectos cuando sí existen
**Módulo:** Frontend - Client List  
**Descripción:** En la vista de clientes, la columna "Proyectos" aparece con valor `0` aunque el cliente tenga proyectos asociados.

**Comportamiento Esperado:**
- Mostrar el conteo real de proyectos por cliente
- Query debería ser: `projectModel.countDocuments({ clientId: client._id })`

**Impacto:** Alto - Los usuarios no pueden identificar qué clientes tienen actividad

**Archivos Involucrados:**
- `frontend/src/app/features/clients/client-list.component.ts`
- `backend/src/modules/client/client.service.ts`

**Reproducción:**
1. Crear cliente "ACME Corp"
2. Crear proyecto asignado a "ACME Corp"
3. Ir a vista de Clientes
4. Observar que muestra "0 Proyectos"

---

### 2. Usuarios pueden ver TODO sin restricciones de Área
**Módulo:** Backend - RBAC / Area Guards  
**Descripción:** Un usuario con rol ANALYST sin áreas asignadas puede ver todos los proyectos, hallazgos y clientes del sistema. El sistema de áreas no está funcionando como filtro de visibilidad.

**Comportamiento Esperado:**
- Usuario sin áreas asignadas → No puede ver ningún proyecto/hallazgo
- Usuario con Área "Red Team" → Solo ve proyectos de esa área
- Implementar middleware de filtrado por área en todas las queries

**Impacto:** Crítico - Violación de seguridad de aislamiento multi-tenant

**Archivos Involucrados:**
- `backend/src/modules/area/area.guard.ts` (¿existe?)
- `backend/src/modules/project/project.service.ts` (falta filtro por userId → areas)
- `backend/src/modules/finding/finding.service.ts` (falta filtro por área)

**Requerimiento Original (Promp.txt):**
> "Restricción por Áreas: Los analistas solo ven proyectos de las áreas asignadas"

**Reproducción:**
1. Crear usuario `analyst1@test.com` con rol ANALYST
2. NO asignar áreas al usuario
3. Login con `analyst1`
4. Navegar a Proyectos → Observar que ve TODOS los proyectos del sistema

**Solución Sugerida:**
```typescript
// Ejemplo: project.service.ts
async findAll(userId: string) {
  const user = await this.userModel.findById(userId).populate('assignedAreas');
  if (user.role === 'ANALYST' && user.assignedAreas.length === 0) {
    return []; // Sin áreas = sin acceso
  }
  const query = user.role === 'ANALYST' 
    ? { areaId: { $in: user.assignedAreas.map(a => a._id) } }
    : {};
  return this.projectModel.find(query);
}
```

---

### 3. Áreas dicen "Sin Administradores" aunque usuarios tengan el rol
**Módulo:** Frontend - Area List  
**Descripción:** La vista de Áreas muestra "Sin Administradores asignados" en todas las áreas, incluso cuando hay usuarios con rol ADMIN asignados a esas áreas.

**Comportamiento Esperado:**
- Cargar usuarios asignados al área con populate()
- Mostrar nombres de los administradores: "Juan Pérez, María González"

**Impacto:** Medio-Alto - No se puede auditar qué admins gestionan cada área

**Archivos Involucrados:**
- `frontend/src/app/features/areas/area-list.component.ts` (línea ~80)
- `backend/src/modules/area/area.service.ts` (falta populate de users)

**Reproducción:**
1. Ir a Usuarios
2. Asignar usuario `admin1` como ADMIN al Área "Red Team"
3. Ir a vista de Áreas
4. Ver que "Red Team" dice "Sin Administradores"

---

### 5. Registro de Auditoría no funciona correctamente
**Módulo:** Backend - Audit Module  
**Descripción:** Los logs de auditoría no registran todas las acciones del sistema. Faltan eventos como: UPDATE, DELETE, EXPORT.

**Comportamiento Esperado:**
- Interceptor global que registre TODAS las operaciones CRUD
- Registrar: usuario, acción, entidad, IP, timestamp, cambios (before/after)

**Impacto:** Crítico - No hay trazabilidad para compliance (ISO 27001, SOC 2)

**Archivos Involucrados:**
- `backend/src/modules/audit/audit.service.ts`
- `backend/src/modules/audit/audit.interceptor.ts` (¿existe?)

**Reproducción:**
1. Login como ADMIN
2. Editar un hallazgo (cambiar severidad)
3. Ir a Registros de Auditoría
4. Observar que NO aparece el evento UPDATE

**Requerimiento Original (Promp.txt - Punto 7):**
> "Timeline (Auditoría): Historial inmutable de cambios (OldValue vs NewValue)"

**Solución Sugerida:**
```typescript
// audit.interceptor.ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method; // POST, PUT, DELETE
    const url = req.url;
    const userId = req.user?.userId;
    
    return next.handle().pipe(
      tap((response) => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          this.auditService.log({
            userId,
            action: `${method} ${url}`,
            ipAddress: req.ip,
            timestamp: new Date(),
            data: { body: req.body, response }
          });
        }
      })
    );
  }
}
```

---

### 7. Códigos de Proyecto no son automáticos
**Módulo:** Backend - Project Creation  
**Descripción:** Al crear un proyecto desde un hallazgo, se crea solo el nombre pero el código no es auto-generado. El usuario debe editarlo manualmente.

**Comportamiento Esperado:**
- Auto-generar código en formato: `PROJ-YYYY-NNN` (ej: `PROJ-2025-001`)
- Usar un contador o timestamp para garantizar unicidad

**Impacto:** Medio - UX deficiente, inconsistencia en nomenclatura

**Archivos Involucrados:**
- `backend/src/modules/project/project.service.ts` (método `create()`)

**Reproducción:**
1. Ir a un hallazgo existente
2. Hacer clic en "Crear Proyecto desde Hallazgo"
3. Observar que solo se crea el nombre del proyecto
4. El código queda vacío

**Solución Sugerida:**
```typescript
// project.service.ts
async create(dto: CreateProjectDto) {
  if (!dto.code) {
    const year = new Date().getFullYear();
    const count = await this.projectModel.countDocuments();
    dto.code = `PROJ-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  return this.projectModel.create(dto);
}
```

---

## 🟠 ALTO - P1 (Funcionalidad importante no implementada)

### 4. Plantillas (FindingTemplate) no probadas
**Módulo:** Backend + Frontend - Template Module  
**Descripción:** El módulo de Plantillas de Hallazgos existe en el código pero no ha sido probado end-to-end.

**Funcionalidades a Validar:**
- ✅ Crear plantilla (global o por tenant)
- ❓ Buscar plantilla en wizard de hallazgos (Autocomplete)
- ❓ Aplicar plantilla → poblar formulario automáticamente
- ❓ Editar plantilla existente
- ❓ Eliminar plantilla (solo ADMIN/OWNER)

**Impacto:** Medio - Los analistas no pueden reutilizar hallazgos repetitivos

**Archivos Involucrados:**
- `backend/src/modules/template/template.service.ts`
- `frontend/src/app/features/admin/templates/template-list.component.ts`
- `frontend/src/app/features/findings/finding-wizard/finding-wizard.component.ts` (línea ~180)

**Test Requerido:**
1. Ir a Admin → Plantillas
2. Crear plantilla "SQL Injection Template"
3. Ir a Crear Hallazgo
4. En el Step 1, buscar "SQL" en el autocomplete
5. Seleccionar plantilla → Verificar que se pobla description, recommendation, references

---

### 6. Configuración del Sistema (SystemConfig) no probada
**Módulo:** Backend + Frontend - System Config  
**Descripción:** El módulo de configuración SMTP y ajustes del sistema existe pero no ha sido validado.

**Funcionalidades a Validar:**
- ✅ Pantalla de configuración SMTP (host, port, user, pass)
- ❓ Encriptación de credenciales en BD
- ❓ Configuración de retención de backups
- ❓ Configuración de políticas globales

**Impacto:** Medio - El scheduler de retest no puede enviar emails sin SMTP configurado

**Archivos Involucrados:**
- `backend/src/modules/system-config/system-config.service.ts`
- `frontend/src/app/features/admin/config/system-config.component.ts`

**Test Requerido:**
1. Login como OWNER
2. Ir a Admin → Configuración
3. Ingresar credenciales SMTP: host=smtp.gmail.com, port=587, user=test@test.com, pass=secret
4. Guardar configuración
5. Verificar en MongoDB que la contraseña esté encriptada
6. Ejecutar cron de retest manualmente → Verificar que se envíe email

**Requerimiento Original (Promp.txt - Punto 6):**
> "Crear entidad 'SystemConfig' (Solo accesible por OWNER) para guardar (encriptado): SMTP Host, Port, User, Pass."

---

### 8. Evidencias no permiten previsualización
**Módulo:** Frontend - Evidence Component  
**Descripción:** Al cargar evidencias (imágenes, TXT), el sistema solo permite descargar. No hay botón de previsualización en modal.

**Comportamiento Esperado:**
- Imágenes (JPG, PNG) → Mostrar en lightbox con zoom
- Archivos de texto (TXT, LOG) → Mostrar contenido en textarea readonly
- PDFs → Abrir en visor integrado (iframe)

**Impacto:** Medio - Los analistas deben descargar todo para revisar

**Archivos Involucrados:**
- `frontend/src/app/features/findings/finding-detail/finding-detail.component.ts` (líneas 450-470)

**Reproducción:**
1. Ir a un hallazgo
2. Subir evidencia: `screenshot.png`
3. Ver que solo hay botón "Descargar"
4. NO hay botón "Ver" o "Previsualizar"

**Nota del Usuario:**
> "esta con animejs pero no me mostró ninguna animación para ver la imagen o el txt"

**Solución Sugerida:**
```typescript
// finding-detail.component.ts
viewImageEvidence(evidence: Evidence) {
  const dialogRef = this.dialog.open(ImagePreviewDialog, {
    data: { imageUrl: `/api/files/${evidence.filename}` },
    width: '80vw',
    height: '80vh'
  });
}

viewTextEvidence(evidence: Evidence) {
  this.http.get(`/api/files/${evidence.filename}`, { responseType: 'text' })
    .subscribe(content => {
      this.dialog.open(TextPreviewDialog, {
        data: { content, filename: evidence.originalName }
      });
    });
}
```

---

### 9. Exportación de Proyectos solo en Excel
**Módulo:** Backend + Frontend - Export Module  
**Descripción:** Los proyectos solo se pueden exportar en Excel. Falta exportación en ZIP con evidencias y CSV.

**Comportamiento Esperado:**
- Excel: ✅ Implementado (Dashboard + Detalle)
- CSV: ❓ No probado
- **ZIP:** ❌ No implementado
  - Estructura: `Cliente_Proyecto_2025-12-22.zip`
    - `hallazgos.xlsx`
    - `evidencias/` (carpeta con archivos)

**Impacto:** Medio - Los clientes no pueden descargar paquete completo con evidencias

**Archivos Involucrados:**
- `backend/src/modules/export/export.service.ts` (método `exportProjectAsZip()` pendiente)

**Requerimiento Original (Promp.txt - Punto 5A):**
> "Nivel PROYECTO: Formatos: Excel (.xlsx), CSV, JSON"

**Solución Sugerida:**
```typescript
// export.service.ts
async exportProjectAsZip(projectId: string) {
  const archiver = require('archiver');
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  // Agregar Excel
  const excelBuffer = await this.exportProjectToExcel(projectId);
  archive.append(excelBuffer, { name: 'hallazgos.xlsx' });
  
  // Agregar evidencias
  const findings = await this.findingModel.find({ projectId });
  for (const finding of findings) {
    for (const evidence of finding.evidences) {
      const filePath = `uploads/evidence/${evidence.filename}`;
      archive.file(filePath, { name: `evidencias/${evidence.originalName}` });
    }
  }
  
  archive.finalize();
  return archive;
}
```

---

### 10. Exportación de Cliente específico no probada
**Módulo:** Backend - Export by Client  
**Descripción:** Existe endpoint para exportar todos los proyectos de un cliente en ZIP, pero no ha sido probado.

**Comportamiento Esperado:**
- Endpoint: `GET /api/export/client/:clientId`
- Generar ZIP con carpetas por proyecto
- Estructura:
  ```
  ACME_Corp_2025-12-22.zip
  ├── Proyecto_Pentest_Q1/
  │   ├── hallazgos.xlsx
  │   └── evidencias/
  └── Proyecto_WebApp_Security/
      ├── hallazgos.xlsx
      └── evidencias/
  ```

**Impacto:** Bajo - Solo afecta a administradores que gestionan múltiples proyectos

**Archivos Involucrados:**
- `backend/src/modules/export/export.controller.ts` (endpoint `/client/:id`)
- `backend/src/modules/export/export.service.ts` (método `exportClientProjects()`)

**Test Requerido:**
1. Tener cliente "ACME" con 2 proyectos
2. Llamar a `GET /api/export/client/{{clientId}}`
3. Descargar ZIP
4. Verificar estructura de carpetas
5. Verificar que incluya todas las evidencias

**Requerimiento Original (Promp.txt - Punto 5B):**
> "Nivel TENANT: ZIP ('archiver'). Carpeta por proyecto conteniendo excels y carpetas de evidencias."

---

### 11. Backup Completo de MongoDB no implementado
**Módulo:** Backend - System Backup  
**Descripción:** No existe funcionalidad para exportar la base de datos completa (dump de MongoDB).

**Comportamiento Esperado:**
- Endpoint: `POST /api/export/system-backup` (Solo OWNER)
- Ejecutar `mongodump` con Node.js child_process
- Comprimir en archivo `.tar.gz`
- Nombre: `shieldtrack_backup_2025-12-22_14-30.tar.gz`
- Guardar en carpeta `backups/` del servidor

**Impacto:** Alto - Sin backups, el sistema es vulnerable a pérdida de datos

**Archivos Involucrados:**
- `backend/src/modules/export/export.service.ts` (agregar método `createSystemBackup()`)
- `backend/src/modules/export/export.controller.ts` (agregar endpoint)

**Requerimiento Original (Promp.txt - Punto 5C):**
> "Nivel SISTEMA: Endpoint para volcar la base de datos completa a un JSON estructurado (Backup)."

**Solución Sugerida:**
```typescript
// export.service.ts
async createSystemBackup(): Promise<string> {
  const { exec } = require('child_process');
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `shieldtrack_backup_${timestamp}.tar.gz`;
  
  const command = `mongodump --uri="${process.env.MONGO_URI}" --archive=backups/${filename} --gzip`;
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(filename);
    });
  });
}
```

---

## 🟡 MEDIO - P2 (Mejoras de UX y funcionalidades opcionales)

### 12. White-labeling no implementado
**Módulo:** Frontend - Theme Service  
**Descripción:** No existe servicio para cambiar logo y colores según el cliente activo.

**Comportamiento Esperado:**
- Al cargar un cliente, leer `client.settings.logoUrl` y `client.settings.primaryColor`
- Aplicar variables CSS dinámicas:
  ```css
  :root {
    --primary-color: #1976d2; /* Color del cliente */
  }
  ```
- Cambiar logo del header: `<img [src]="currentClient.logoUrl">`

**Impacto:** Bajo - No afecta funcionalidad, solo branding

**Archivos Involucrados:**
- `frontend/src/app/core/services/theme.service.ts` (crear)
- `frontend/src/app/core/layout/main-layout.component.ts` (aplicar logo dinámico)
- `backend/src/modules/client/schemas/client.schema.ts` (ya tiene campo `logoUrl`)

**Requerimiento Original (Promp.txt - Punto 1):**
> "Implementar un 'ThemeService' que cambie dinámicamente el logo del Header y el color primario usando variables CSS."

---

### 13. Animaciones con anime.js no implementadas
**Módulo:** Frontend - Global Animations  
**Descripción:** Aunque `anime.js` está en dependencies (`package.json`), no se usa en ningún componente.

**Comportamiento Esperado:**
- Transiciones entre rutas (fade in/out)
- Micro-interacciones: hover en cards, botones con ripple effect
- Animación al cargar charts (entrada progresiva de barras)

**Impacto:** Muy Bajo - Puramente estético

**Archivos Involucrados:**
- `frontend/package.json` (dependencia existe)
- `frontend/src/app/app.config.ts` (configurar router con animaciones)

**Requerimiento Original (Promp.txt):**
> "Animaciones: 'anime.js' (transiciones de ruta y micro-interacciones)"

**Solución Sugerida:**
```typescript
// app.config.ts
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideRouter(routes, withViewTransitions())
  ]
};

// finding-wizard.component.ts
import anime from 'animejs';

ngAfterViewInit() {
  anime({
    targets: '.wizard-container',
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 600,
    easing: 'easeOutQuad'
  });
}
```

---

### 14. Validación de máximo 3 recipients en Retest Policy
**Módulo:** Backend - Project DTO  
**Descripción:** El DTO no valida que el array `notify.recipients` tenga máximo 3 emails.

**Comportamiento Esperado:**
```typescript
@ArrayMaxSize(3, { message: 'Máximo 3 destinatarios de notificaciones' })
recipients: string[];
```

**Impacto:** Bajo - Solo previene spam de correos

**Archivos Involucrados:**
- `backend/src/modules/project/dto/project.dto.ts` (línea ~35)

**Requerimiento Original (docs/qa-plan-p0.md - TC-SCHED-005):**
> "Máximo 3 recipients - DTO a agregar: @ArrayMaxSize(3)"

---

### 15. Deduplicación de offsets en Retest Scheduler
**Módulo:** Backend - Retest Scheduler  
**Descripción:** Si un proyecto tiene `offsetDays: [3, 3, 3]`, el sistema enviará 3 emails idénticos el mismo día.

**Comportamiento Esperado:**
```typescript
const uniqueOffsets = [...new Set(retestPolicy.notify.offsetDays)];
```

**Impacto:** Bajo - Solo genera spam de correos

**Archivos Involucrados:**
- `backend/src/modules/retest-scheduler/retest-scheduler.service.ts` (línea ~78)

**Requerimiento Original (docs/qa-plan-p0.md - TC-SCHED-003):**
> "Múltiples offsets el mismo día - Implementar deduplicación"

---

## 📊 Resumen por Prioridad

| Prioridad | Cantidad | Issues |
|-----------|----------|--------|
| 🔴 P0 (Crítico) | 5 | #1, #2, #3, #5, #7 |
| 🟠 P1 (Alto) | 7 | #4, #6, #8, #9, #10, #11 |
| 🟡 P2 (Medio) | 5 | #12, #13, #14, #15 |
| **TOTAL** | **17** | |

---

## 🔍 Comparación con Requerimientos Originales

### Cumplimiento por Módulo

| Módulo | Requerimiento | Estado | Gap |
|--------|--------------|--------|-----|
| 1. Tenants y White-labeling | Logo dinámico, colores por cliente | ❌ | ThemeService no implementado |
| 2. Proyectos | Estados, ReadOnly, Retest Policy | ✅ | Códigos automáticos pendientes |
| 3. Hallazgos | CRUD, Wizard, Validaciones | ✅ | - |
| 4. Plantillas | Autocomplete, Aplicar template | ⚠️ | No probado |
| 5. Exportación | Excel, CSV, JSON, ZIP | ⚠️ | ZIP y backup completo pendientes |
| 6. SMTP Config | Credenciales encriptadas | ⚠️ | No probado |
| 7. Timeline/Auditoría | Registro inmutable | ❌ | Interceptor global faltante |
| 8. RBAC | Roles, Áreas, Permisos | ❌ | Filtrado por área no funciona |
| 9. Dashboard | Gráficos, KPIs | ✅ | - |
| 10. Evidencias | Almacenamiento local, Seguridad | ⚠️ | Previsualización faltante |
| 11. Arquitectura | Modular, Validaciones, Comentarios | ✅ | - |
| 12. Idioma | Comentarios en español | ✅ | - |
| 13. Animaciones | anime.js, Transiciones | ❌ | No implementado |

**Cumplimiento Total: 62% (8/13 módulos completos)**

---

## 🚀 Plan de Acción Sugerido

### Sprint 1 - Críticos (Semana 1)
1. Issue #2: Implementar filtrado por áreas (Area Guard + Service filters)
2. Issue #5: Crear AuditInterceptor global
3. Issue #1: Fix conteo de proyectos en cliente

### Sprint 2 - Alta Prioridad (Semana 2)
4. Issue #11: Implementar backup completo de MongoDB
5. Issue #9: Agregar exportación ZIP con evidencias
6. Issue #6: Validar configuración SMTP end-to-end

### Sprint 3 - UX y Mejoras (Semana 3)
7. Issue #8: Implementar previsualización de evidencias
8. Issue #7: Códigos automáticos de proyectos
9. Issue #3: Fix contador de administradores en áreas

### Sprint 4 - Nice to Have (Semana 4)
10. Issue #12: ThemeService para white-labeling
11. Issue #13: Agregar animaciones con anime.js
12. Issue #4: Testing completo de plantillas

---

## 📝 Notas Adicionales

**Ambiente de Prueba:**
- Backend: NestJS 10.x
- Frontend: Angular 18 (Standalone Components)
- Base de Datos: MongoDB 6+
- OS: Windows (desarrollo)

**Herramientas Sugeridas para Testing:**
- Postman (ShieldTrack-P0-Tests.postman_collection.json existe)
- MongoDB Compass (revisar estructura de datos)
- Chrome DevTools (Network tab para debugging de APIs)

**Documentos Relacionados:**
- `docs/qa-plan-p0.md` - Matriz QA con casos de prueba
- `docs/TESTING-GUIDE.md` - Guía de ejecución de tests
- `Promp.txt` - Requerimientos originales del sistema
- `IMPLEMENTACION.md` - Estado de implementación actual

---

**Elaborado por:** GitHub Copilot (Asistente AI)  
**Fecha:** 22 de Diciembre de 2025  
**Versión del Documento:** 1.0
