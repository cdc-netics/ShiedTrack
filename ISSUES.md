🐛 Issues y Funcionalidades Pendientes - ShieldTrack

**Fecha de Reporte:** 13 de Enero de 2026 (verificado contra código)  
**Versión:** HONESTO-1.9  
**Tipo:** Reporte de Soporte Técnico

---

## 📋 Resumen Ejecutivo

Revisión completa de backend (NestJS) y frontend (Angular) al 13/01/2026. Se mantienen las funcionalidades core (hallazgos, proyectos, clientes, áreas, timeline), pero varias tareas marcadas como “hechas” no están disponibles para el usuario final o tienen gaps de integración.

**Estado General:**
- ✅ Implementado y utilizable: exports CSV/Excel por proyecto/cliente, soft-delete de usuarios, cambio de tenant para OWNER, hard-delete de áreas, fusión de proyectos.
- ⚠️ Implementado a medias: backup/restore (API sí, UI sin ruta), auditoría (backend sí, UI mock), branding/favicon (endpoints ok pero UI apunta a rutas/keys erróneas), disparadores de correo (presentes pero mezclan SystemConfig y variables de entorno).
- ❌ No implementado: asignación centralizada de usuarios a cliente/proyecto, creación de tenant con admin inicial desde UI, constructor de filtros avanzados.

---

## 🧭 Tabla de Issues QA (ordenados por prioridad)

| ID | Área | Problema | Impacto | Prioridad |
|---|---|---|---|---|
| ST-001 | Evidencias | Frontend espera `originalName` y `mimetype` pero backend retorna `filename` y `mimeType` | Listado de evidencias queda “en blanco”, previews de imágenes no cargan → parece que “no sube” | Alta |
| ST-002 | Evidencias | Wizard de creación no sube archivos seleccionados (solo quedan en memoria) | Se pierde evidencia inicial al crear un hallazgo | Alta |
| ST-003 | Seguimiento | Botón “Ver timeline” en listado apunta a ruta inexistente | Botón roto / navegación 404 | Alta |
| ST-004 | UX Seguimiento | “Agregar Seguimiento” desaparece en modo edición | Confusión: parece que no se pueden agregar seguimientos | Media |
| ST-005 | Asignaciones | UI llama `/api/auth/users/:id/assignments` pero backend no lo expone | Bloquea asignación centralizada | Alta |
| ST-006 | Auditoría | UI usa datos mock y el endpoint real no está bajo `/api` | Auditoría no usable en UI | Alta |
| ST-007 | Branding/Favicon | UI apunta a endpoints/keys incorrectos | Configuración no funciona | Alta |
| ST-008 | Export/Descargas | URLs hardcodeadas a localhost en `finding-detail` | Falla en otros entornos | Alta |
| ST-009 | Backup/Restore | Componente existe pero no estaba en rutas/menú (ya agregado) | Función inaccesible si menú no se actualiza | Media |
| ST-010 | Tenant onboarding | UI no expone `displayName` ni `initialAdmin` | Alta fricción para crear tenants | Media |
| ST-011 | ServiceArchitecture | UI lista menos opciones que el enum backend | Inconsistencias | Baja |
| ST-012 | Roles/Visibilidad | Reglas de visibilidad por área no están claras en UI | Confusión de permisos | Baja |
| ST-013 | Colección Postman | Credenciales no coinciden con el seed | Tests P0 fallan | Media |
| ST-014 | Retest + SMTP | Scheduler usa `SMTP_*` y no SystemConfig en algunos casos | Configuración inconsistente | Media |
| ST-015 | Angular | Versión no está en la última estable | Deuda técnica | Media |

---

## 🛠️ Reparaciones sugeridas (por código de issue)

**ST-001 - Evidencias: mismatch de campos**  
Actualizar frontend para usar `filename` y `mimeType`, o mapear en backend a `originalName` y `mimetype`.

Ejemplo (frontend):
```ts
// frontend/src/app/features/findings/finding-detail/finding-detail.component.ts
interface Evidence {
  _id: string;
  filename: string;     // nombre original
  mimeType: string;     // tipo MIME real
  // ...
}
```

Ejemplo (backend DTO):
```ts
// backend: mapear salida
return {
  _id: evidence._id,
  originalName: evidence.filename,
  mimetype: evidence.mimeType,
  // ...
};
```

**ST-002 - Evidencias: wizard no sube archivos**  
Después de crear el hallazgo, iterar `selectedFiles()` y subir a `/api/evidence/upload?findingId=...`.

Ejemplo:
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

**ST-003 - Botón timeline roto**  
O bien agregar ruta `findings/:id/timeline`, o cambiar el botón para abrir `findings/:id` y enfocar tab “Seguimiento”.

Ejemplo:
```ts
[routerLink]="['/findings', finding._id]"
```

**ST-004 - UX Seguimiento**  
Mostrar “Agregar Seguimiento” también en modo edición (deshabilitado si corresponde), o dejarlo visible con tooltip.

---

**ST-005 - Asignaciones**  
Crear endpoints reales o ajustar la UI a los existentes. Definir DTO común.

**ST-006 - Auditoría**  
Exponer endpoint con prefijo `/api/audit/logs` y conectar UI real.

**ST-007 - Branding/Favicon**  
Unificar nombres de campos y endpoints entre backend y frontend.

**ST-008 - Export/Descargas**  
Reemplazar URLs hardcodeadas por `environment.apiUrl`.

**ST-010 - Tenant onboarding**  
Agregar campos `displayName` e `initialAdmin` en UI de creación/edición.

**ST-011 - ServiceArchitecture**  
Alinear opciones UI con enum backend.

**ST-013 - Postman**  
Actualizar contraseñas para que coincidan con seed (o viceversa).

**ST-015 - Angular**  
Actualizar Angular/CLI/Material a la última versión estable y corregir breaking changes.

---

## ✅ / ⚠️ / ❌ Estado verificado por ítem (numeración original)

1/19/20. **Backup & Restore completo**  
✅ Backend listo (BackupService con mongodump/mongorestore, cron 02:00, endpoints `/api/backup/*` y `/api/export/system/backup-full`).  
⚠️ UI: existe `frontend/src/app/features/admin/backup/backup-manager.component.ts` pero no está en rutas ni menú, por lo que el usuario no puede lanzar/descargar desde la web.

2/22. **Notificaciones Email**  
✅ Disparadores en `AuthService.notifyUserCreated`, `UserAreaService.assignArea`, `FindingService.create/close`.  
⚠️ RetestScheduler usa `SMTP_*` de entorno y no la configuración cifrada de SystemConfig; la UI SMTP guarda en `/api/system-config/smtp` pero no refresca el `EmailService` ni valida cambios de contraseña enmascarada.

3/10/11. **Acceso granular centralizado**  
❌ Backend solo soporta asignación de Áreas (`/api/auth/users/:id/areas`); no existe endpoint para asignar proyectos/clientes.  
❌ El diálogo `UserAssignmentDialogComponent` llama a `/api/auth/users/:id/assignments` (no existe), por lo que la UI falla.

4. **Desactivar usuarios (Soft Delete)**  
✅ Implementado: `/api/auth/users/:id/soft` y `/reactivate`, usados en `/admin/users` (user-list-improved) con quick block/unblock.

5/15/16/22. **Exportaciones CSV/Excel/ZIP y descarga de hallazgos**  
✅ ExportService usa streams y BOM UTF-8; botón "Exportar" en lista de hallazgos permite Excel/CSV por proyecto y ZIP de portfolio por cliente.  
⚠️ El componente reutilizable `finding-download-button` no está en uso; `finding-detail` usa URLs fijas `http://localhost:3000/...` y no `environment.apiUrl`, por lo que falla fuera de localhost. No hay validación de grandes volúmenes en UI.

6/14/18/23. **UX: animaciones y filtros avanzados**  
⚠️ Animaciones ligeras presentes (login, layout). Filtros básicos existen, pero no hay constructor de queries complejas (status AND risk AND área).

7/24. **Auditoría completa**  
⚠️ Backend: schema `auditlogs` + interceptor global (registra mutaciones y exports) y endpoint `GET /audit/logs` (sin prefijo `/api`).  
❌ Frontend: `/admin/audit` muestra datos mock, no consume API ni permite filtrar.

8. **Arquitecturas adicionales**  
⚠️ Enum `ServiceArchitecture` tiene 16 valores, pero la UI de proyectos solo lista 8 opciones (WEB, MOBILE, API, NETWORK, CLOUD, DESKTOP, IOT, OTHER).

9. **Roles personalizados**  
⚠️ Backend `CustomRoleModule` disponible; no existe UI en rutas para gestionarlo.

12. **Cambio de tenant sin relogin (OWNER)**  
✅ Endpoint `/api/auth/switch-tenant/:clientId` y chip de tenant en navbar funcionan.

13/15/16. **Descarga de hallazgos / CSV corrupto**  
⚠️ Export funcional si se filtra por proyecto/cliente; sin selección no hay descarga. URLs hardcodeadas afectan ambientes no-localhost; botón de descarga individual no está integrado.

17. **Favicon/branding**  
⚠️ Backend `/api/system-config/branding` espera campo `file` para favicon/logo. UI `branding-config` y `tenant-config` usan claves `favicon`/`logo` y endpoint `/api/clients/me/branding` (inexistente), además no hay enlace en el menú.

18. **Fusión de proyectos**  
⚠️ Endpoint `POST /api/projects/merge` funcional y expuesto en Configuración, faltareia  una configuracion de  lo mismo pero para cada tenant.

19. **Eliminar áreas**  
✅ Endpoint `DELETE /api/areas/:id/hard` y botón en `/admin/areas`.

20. **DisplayName de tenant visible en UI**  
⚠️ Backend soporta `displayName`; navbar lo muestra si existe. UI de creación/edición de cliente no expone `displayName`, solo aparece en componentes de branding no enrutados.

21. **Crear primer admin al crear tenant**  
⚠️ Backend `CreateClientDto.initialAdmin` crea CLIENT_ADMIN. UI no expone campos para `initialAdmin`, por lo que nunca se dispara desde la web.
22. ❌ en Gestión de Hallazgos no puedo descargar todos los hallazgos con un click - NO IMPLEMENTADO (Falta botón en finding-detail.component)
23. ❌ Registro de Auditoría aun no funciona   no hay log de ningun tipo
24. ❌ cambiar en adminitracion Areas por tenant  y lo que esta  en configuracion  tambien aparesca ahi con todos los tenant  y que se pueda  configurar todo lo referente a cada tenant que tengamos   agregado

---

## 🔴 Problemas reales detectados (bloquean al usuario)

- **Asignaciones**: no hay manera real de asignar usuarios a proyectos/clientes; el diálogo actual usa un endpoint inexistente.  
- **Auditoría**: el registro se guarda, pero la UI es mock y la ruta API sin prefijo `/api` no está proxied desde el frontend.  
- **Branding/Favicon**: llamadas de UI a endpoints equivocados; incluso en OWNER el upload falla por nombre de campo y falta de ruta en menú.  
- **Backup/Restore**: solo accesible por API; no hay navegación a la pantalla `BackupManagerComponent`.  
- **Export/Descargas**: rutas hardcodeadas a `http://localhost:3000` en `finding-detail` rompen en otros entornos; botón de descarga individual no se usa.  
- **Tenant onboarding**: la UI no permite definir `displayName` ni crear el admin inicial del tenant, aunque el backend ya lo soporta.

---

**Fecha de actualización:** 13 de Enero de 2026  
**Versión del Documento:** HONESTO-1.9
