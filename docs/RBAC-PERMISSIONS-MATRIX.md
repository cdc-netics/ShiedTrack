# RBAC en una Página

Documento único y resumido para entender el modelo de permisos, sin duplicar guías ni entregables.

## Roles

| Rol | Qué puede hacer |
| --- | --- |
| OWNER | Control total. Crea cualquier cosa, ve todo, administra usuarios, clientes, proyectos y hallazgos. |
| ADMIN_AREA | Administra su área. Puede gestionar usuarios de su área, proyectos y clientes asignados. |
| PENTESTER / QA | Trabaja transversalmente. Puede crear proyectos y hallazgos. No crea usuarios. |
| AUDITOR | Solo lectura. Ve proyectos/clientes según el alcance que defina el Admin Area. |

## Permisos CRUD resumidos

| Entidad | OWNER | ADMIN_AREA | PENTESTER / QA | AUDITOR |
| --- | --- | --- | --- | --- |
| Áreas | CRUD total | CRUD completo en su alcance, incluida desactivación y eliminación | Crear/leer/editar, desactivar/reactivar y eliminar | Sin escritura |
| Usuarios | CRUD total y reasignación | Crear/ver/editar; desactivar AUDITOR/VIEWER | No | No |
| Clientes | CRUD total | Ver/editar los de su área | Crear/leer/editar y desactivar | Solo lectura por alcance |
| Proyectos | CRUD total | Crear/leer/editar en su alcance; sin hard delete | Crear/leer/editar y eliminar dentro del acceso permitido | Leer y descargar por alcance |
| Hallazgos | CRUD total | Leer/actualizar estado | Crear/leer/editar propios | Solo lectura |
| Evidencia | CRUD total | Leer en su área | Crear/leer/editar propios | Solo lectura |

## Reglas clave

- Password mínima general: 6 caracteres.
- Excepción de OWNER: el formulario no bloquea contraseñas cortas; backend mantiene defensa en profundidad.
- ADMIN_AREA solo puede crear AUDITOR.
- PENTESTER / QA no pueden crear usuarios.
- AUDITOR necesita un scope: por proyecto, por cliente o todo el área.

## Formulario dinámico

- En edición de usuarios por administradores autorizados, el selector de cliente permite reasignar PENTESTER/QA. El cambio actualiza el tenant activo y limpia restricciones anteriores. El formulario de creación dinámica puede conservar un flujo transversal distinto.
- Si el rol es AUDITOR: se muestra bloque de visibilidad dinámica con selectores múltiples de Proyectos (`visibleProjectIds`) o Clientes (`visibleClientIds`) en tiempo real según el alcance (`PER_PROJECT` o `PER_CLIENT`).
- Si el rol es OWNER: el formulario no debe forzar restricciones artificiales.

## Mapa de migración

| Antes | Ahora |
| --- | --- |
| PLATFORM_ADMIN | OWNER |
| CLIENT_ADMIN + AREA_ADMIN | ADMIN_AREA |
| ANALYST | PENTESTER / QA |
| VIEWER | AUDITOR |

## Referencia técnica

- [backend/src/common/rbac/rbac-policy.ts](../backend/src/common/rbac/rbac-policy.ts): grupos de roles, matriz de permisos, `normalizeRole()` y `roleSatisfies()` (fuente de verdad).
- [backend/src/common/rbac/qa-client-scope.ts](../backend/src/common/rbac/qa-client-scope.ts): restricción de QA a su cliente asignado.
- [backend/src/common/enums/index.ts](../backend/src/common/enums/index.ts): enum `UserRole`.
- [backend/src/modules/auth/guards/](../backend/src/modules/auth/guards/): `JwtAuthGuard`, `RolesGuard`.
- [frontend/src/app/features/admin/users/user-dialog.component.ts](../frontend/src/app/features/admin/users/user-dialog.component.ts): formulario de usuarios.

## Criterio de cierre

Esta guía queda suficiente si alguien puede responder rápido estas 4 preguntas:

1. Qué puede hacer cada rol.
2. Qué campos muestra el formulario según el rol.
3. Qué pasa con la contraseña del OWNER.
4. Cómo se asigna la visibilidad del AUDITOR.

Si hace falta más detalle, se consulta el código, no otro documento largo.

- AUDITOR puede descargar PDF de proyectos y hallazgos, Excel del proyecto y ZIP con evidencias dentro de su cliente, proyectos y áreas asignados. Las descargas son operaciones de lectura y no habilitan edición ni backups del sistema.

- PENTESTER/QA/ANALYST pueden eliminar proyectos y desactivar clientes. La eliminación física de clientes sigue reservada al OWNER.
- ADMIN_AREA elimina auditores mediante la ruta de eliminación lógica; la eliminación física de usuarios sigue reservada al OWNER.

## Seguimiento de los cambios QA

Los permisos del grupo PENTESTER/QA también aplican al alias ANALYST. La desactivación de clientes no equivale a borrado físico. El botón de eliminación del ADMIN_AREA usa la ruta soft para auditores; la lista puede conservarlos como desactivados. Registro verificable y pendientes en [QA-CORRECTIONS-2026-10.md](QA-CORRECTIONS-2026-10.md).

## Gestión de áreas por pentester (QA-202610-11)

El grupo operacional PENTESTER/QA/ANALYST accede al menú Áreas y sus acciones CRUD. El cliente fijo limita las operaciones a su tenant; sin cliente fijo se permite consulta transversal y se elige cliente al crear. El borrado permanente afecta al área, sin eliminación automática de proyectos o asignaciones. No amplía permisos de Usuarios ni backups.

## Ajustes puntuales QA-202610-12 y QA-202610-13

- ADMIN_AREA y sus alias CLIENT_ADMIN/AREA_ADMIN tienen gestión completa de Áreas; con cliente fijo se conserva el scope y sin cliente fijo se mantiene el acceso administrativo existente. El borrado sigue sin cascada de proyectos o asignaciones.
- Solo QA con cliente asignado queda restringido a ese cliente al registrar proyectos y hallazgos, incluidos CSV/XLSX. El backend valida esta regla independientemente de los selectores. No se aplica esta nueva restricción a PENTESTER, ANALYST ni QA sin cliente fijo.
