# Correcciones de los ciclos QA de octubre de 2026

Registro actualizado el 2026-10-15. Incluye las correcciones de exportación y auditor de los ciclos anteriores y el último ciclo reportado por roles. Los identificadores QA-202610 son referencias documentales locales; no representan tickets publicados en un servicio externo.

## Estado y alcance

Implementación realizada y validación local registrada. El despliegue mediante Jenkins y la aceptación funcional con datos reales en QA siguen pendientes. No se declara resuelto un caso en el ambiente remoto únicamente por pasar pruebas unitarias. No se modificaron datos de QA para validar estas correcciones.

## Cambios y archivos

### QA-202610-01: PENTESTER: exportación de clientes ZIP/CSV

Consulta del cliente con bypass de tenant para roles globales/operacionales; proyectos filtrados por tenantId del cliente.

Archivos: [backend/src/modules/export/export.service.ts](../backend/src/modules/export/export.service.ts).

### QA-202610-02: PDF de hallazgos importados por CSV

Hallazgo lean para evitar mutaciones de pdfmake sobre arrays Mongoose; populate y evidencias con contexto adecuado y autorización operacional.

Archivos: [backend/src/modules/export/export.service.ts](../backend/src/modules/export/export.service.ts).

### QA-202610-03: AUDITOR: descargas PDF, Excel y ZIP

Permiso en cuatro rutas y validación del cliente, proyectos visibles y áreas asignadas; sin permisos de edición ni backups.

Archivos: [backend/src/modules/export/export.controller.ts](../backend/src/modules/export/export.controller.ts), [backend/src/modules/export/export.service.ts](../backend/src/modules/export/export.service.ts), [backend/src/common/services/pdf.service.ts](../backend/src/common/services/pdf.service.ts).

### QA-202610-04: ADMIN: error 400 al guardar color de marca

El frontend envía solo appName, faviconUrl, logoUrl, primaryColor y secondaryColor; omite metadatos devueltos por GET. Se conserva validación hexadecimal.

Archivos: [frontend/src/app/core/services/branding.service.ts](../frontend/src/app/core/services/branding.service.ts).

### QA-202610-05: ADMIN: reasignación de usuarios a otro cliente

Sincronización de clientId, activeTenantId y tenantIds; limpieza de restricciones previas al cambiar cliente. Asignaciones centralizadas persisten clientes aunque no tengan áreas y consultan áreas por tenantId o clientId legacy.

Archivos: [backend/src/modules/auth/auth.service.ts](../backend/src/modules/auth/auth.service.ts), [backend/src/modules/auth/user-assignment.service.ts](../backend/src/modules/auth/user-assignment.service.ts), [frontend/src/app/features/admin/users/user-dialog.component.ts](../frontend/src/app/features/admin/users/user-dialog.component.ts).

### QA-202610-06: ADMIN_AREA: carga y creación de áreas con error 500

Listado sin tenant fijo con opción explícita de consulta; cliente seleccionado al crear cuando no hay contexto fijo; búsqueda del código dentro del tenant destino y rechazo de cliente distinto para administrador con tenant.

Archivos: [backend/src/modules/area/area.controller.ts](../backend/src/modules/area/area.controller.ts), [backend/src/modules/area/area.service.ts](../backend/src/modules/area/area.service.ts), [frontend/src/app/features/admin/areas/area-dialog.component.ts](../frontend/src/app/features/admin/areas/area-dialog.component.ts).

### QA-202610-07: Todos los roles habilitados: PDF del proyecto con cero hallazgos

Consulta por project._id (ObjectId), exclusión de CLOSED y skipTenantFilter explícito; mantiene arrays lean. Regresión con 17 hallazgos para OWNER, ADMIN_AREA, PENTESTER y AUDITOR.

Archivos: [backend/src/modules/export/export.service.ts](../backend/src/modules/export/export.service.ts).

### QA-202610-08: ADMIN_AREA: eliminación de auditores

El botón usa DELETE /auth/users/:id/soft para administradores de área; OWNER/PLATFORM_ADMIN conserva la ruta de eliminación física. No se amplían permisos de hard delete.

Archivos: [frontend/src/app/features/admin/users/user-list-improved.component.ts](../frontend/src/app/features/admin/users/user-list-improved.component.ts).

### QA-202610-09: PENTESTER: borrar proyectos y clientes

Botón y ruta hard delete de proyectos habilitados al grupo operacional; consultas de borrado tras validar acceso al proyecto. Clientes usan desactivación, sin habilitar eliminación física. Matriz RBAC actualizada.

Archivos: [backend/src/common/rbac/rbac-policy.ts](../backend/src/common/rbac/rbac-policy.ts), [backend/src/modules/project/project.controller.ts](../backend/src/modules/project/project.controller.ts), [backend/src/modules/project/project.service.ts](../backend/src/modules/project/project.service.ts), [backend/src/modules/client/client.controller.ts](../backend/src/modules/client/client.controller.ts), [backend/src/modules/client/client.service.ts](../backend/src/modules/client/client.service.ts), [frontend/src/app/features/projects/project-list/project-list.component.ts](../frontend/src/app/features/projects/project-list/project-list.component.ts), [frontend/src/app/features/clients/client-list/client-list.component.ts](../frontend/src/app/features/clients/client-list/client-list.component.ts).

### QA-202610-10: PENTESTER: navegación después de cerrar hallazgo

Después del cierre exitoso se navega a /findings; ante error se conserva el detalle y se muestra el mensaje.

Archivos: [frontend/src/app/features/findings/finding-detail/finding-detail.component.ts](../frontend/src/app/features/findings/finding-detail/finding-detail.component.ts).

### M16: recuperación de contraseña corregida

- **Estado:** ✅ Completado — función corregida, registrada según lo informado por el usuario el 2026-10-15. Sustituye el estado histórico de pre-configuración.
- **Lo resuelto:** solicitud desde el login, código de seis dígitos por correo, validación de código y expiración, guardado seguro de una nueva contraseña con validación de fortaleza y acceso con ella.
- **Archivos de referencia:** backend/src/modules/auth/auth.service.ts, backend/src/modules/auth/auth.controller.ts, backend/src/modules/auth/dto/auth.dto.ts y frontend/src/app/features/auth/login/login.component.ts.
- **Validación:** esta actualización es documental; no ejecutó una nueva prueba SMTP, de recuperación ni de login. Las 35 pruebas del ciclo QA no cubren M16.

## Validación local registrada

- Ciclos anteriores: 5 pruebas iniciales de exportación y posteriormente 19 pruebas de exportación y permisos del auditor aprobadas. Son ejecuciones sucesivas, no totales acumulables.
- Último ciclo: 35 pruebas aprobadas en tres suites: [export.service.spec.ts](../backend/src/modules/export/export.service.spec.ts), [qa-regressions.spec.ts](../backend/src/modules/export/qa-regressions.spec.ts) y [rbac-policy.spec.ts](../backend/src/common/rbac/rbac-policy.spec.ts).
- Backend: TypeScript sin errores, incluida compilación de las pruebas. Frontend: build Angular con configuración development aprobado; esto no acredita un build de producción ni un despliegue Jenkins.
- Las 35 pruebas se ejecutaron sobre JavaScript compilado con TypeScript, mediante Jest sin transformaciones. La ejecución directa con ts-jest presentó demoras; una prueba de compilación aislada no preservó los metadatos requeridos por Nest/Mongoose y se descartó. La validación final utilizó compilación completa.
- Se eliminaron la salida de compilación y la configuración temporales de esa ejecución. Los archivos fuente de pruebas sí se conservan.
- Alcance de la evidencia: servicios y permisos con modelos simulados, generación real de PDF de hallazgo y streams Excel/ZIP; la regresión de 17 hallazgos comprueba los datos entregados al generador de PDF. No sustituye una prueba integrada contra MongoDB ni la inspección del PDF real de QA.

## Aceptación pendiente en QA

| Caso | Comprobación después de desplegar backend y frontend | Resultado esperado |
| --- | --- | --- |
| QA-202610-01 | PENTESTER exporta cliente vacío y cliente con proyectos a ZIP y CSV. | Descargas válidas sin 500, datos del cliente elegido. |
| QA-202610-02 | Descargar PDF de un hallazgo importado y otro manual con referencias/controles. | PDF abre y contiene el detalle. |
| QA-202610-03 | AUDITOR descarga PDF de proyecto/hallazgo, Excel y ZIP; intenta IDs de otro cliente/proyecto. | Descargas autorizadas funcionan; acceso fuera del alcance rechazado. |
| QA-202610-04 | ADMIN guarda ambos colores y recarga la página. | Sin 400; colores persistidos. |
| QA-202610-05 | ADMIN cambia un PENTESTER de un cliente de prueba a otro, por edición y por asignaciones; reabre el formulario y vuelve a iniciar sesión. | Nuevo cliente persistido y acceso efectivo coherente; sin áreas/proyectos residuales del anterior. Probar también cliente sin áreas. |
| QA-202610-06 | ADMIN_AREA lista y crea áreas, con cliente fijo y sin tenant fijo seleccionando cliente. | Sin 500; área y código pertenecen al cliente elegido. Intento de otro cliente con tenant fijo rechazado. |
| QA-202610-07 | En cada rol habilitado, abrir PDF de proyecto con 17 hallazgos vigentes importados y con hallazgos manuales. | Cantidad, tabla y detalle coinciden con los hallazgos vigentes; CLOSED excluidos igual que Excel. |
| QA-202610-08 | ADMIN_AREA elimina un AUDITOR permitido. | Usuario desactivado y sin acceso; no se elimina físicamente. No obtiene permiso para eliminar OWNER ni otros roles administrativos. |
| QA-202610-09 | Con datos desechables, PENTESTER borra proyecto tras confirmar y elimina cliente; AUDITOR intenta las mismas acciones. | Proyecto eliminado con sus hallazgos; cliente desactivado; auditor rechazado. No usar datos de negocio para este ensayo. |
| QA-202610-10 | Cerrar hallazgo exitosamente y provocar un error de cierre controlado. | Éxito vuelve a /findings; error permanece en detalle con mensaje. |

## Referencias

- [Backlog oficial](../ISSUES.md)
- [Changelog](../CHANGELOG.md)
- [Permisos](RBAC-PERMISSIONS-MATRIX.md)
- [API](API.md)
- [Guía de pruebas](TESTING-GUIDE.md)
