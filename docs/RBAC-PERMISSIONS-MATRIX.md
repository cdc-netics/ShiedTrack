# RBAC en una Página

Documento único y resumido para entender el modelo de permisos, sin duplicar guías ni entregables.

## Roles

| Rol | Qué puede hacer |
| --- | --- |
| OWNER | Control total. Crea cualquier cosa, ve todo, administra usuarios, clientes, proyectos y hallazgos. |
| ADMIN_AREA | Administra su área. Puede gestionar usuarios de su área, proyectos y clientes asignados. |
| PENTESTER / QA | Trabaja transversalmente. Puede crear proyectos y hallazgos. No crea usuarios. |
| NORMAL_USER | Usuario operativo. Puede crear hallazgos. No necesita cliente/proyecto al crearse. |
| AUDITOR | Solo lectura. Ve proyectos/clientes según el alcance que defina el Admin Area. |

## Permisos CRUD resumidos

| Entidad | OWNER | ADMIN_AREA | PENTESTER / QA | NORMAL_USER | AUDITOR |
| --- | --- | --- | --- | --- | --- |
| Usuarios | CRUD total | Crear/ver usuarios de su área | No | No | No |
| Clientes | CRUD total | Ver/editar los de su área | Solo lectura contextual | Solo lectura contextual | Solo lectura por alcance |
| Proyectos | CRUD total | CRUD en su área | Crear/leer/editar propios | Leer asignados | Leer por alcance |
| Hallazgos | CRUD total | Leer/actualizar estado | Crear/leer/editar propios | Crear/leer/editar propios | Solo lectura |
| Evidencia | CRUD total | Leer en su área | Crear/leer/editar propios | Crear/leer/editar propios | Solo lectura |

## Reglas clave

- Password mínima general: 6 caracteres.
- Excepción de OWNER: el formulario no bloquea contraseñas cortas; backend mantiene defensa en profundidad.
- ADMIN_AREA solo puede crear NORMAL_USER y AUDITOR.
- PENTESTER / QA no pueden crear usuarios.
- NORMAL_USER puede entrar sin cliente/proyecto obligatorio.
- AUDITOR necesita un scope: por proyecto, por cliente o todo el área.

## Formulario dinámico

- Si el rol es NORMAL_USER: cliente y proyecto son opcionales.
- Si el rol es PENTESTER o QA: se ocultan campos de vínculo a cliente.
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

- [backend/src/modules/auth/dto/auth-new.dto.ts](../backend/src/modules/auth/dto/auth-new.dto.ts)
- [backend/src/modules/auth/validation/auth.validation.zod.ts](../backend/src/modules/auth/validation/auth.validation.zod.ts)
- [backend/src/modules/auth/auth-improved.service.ts](../backend/src/modules/auth/auth-improved.service.ts)
- [frontend/src/app/features/admin/users/user-create-dynamic.component.ts](../frontend/src/app/features/admin/users/user-create-dynamic.component.ts)
- [frontend/src/app/features/admin/users/user-dialog.component.ts](../frontend/src/app/features/admin/users/user-dialog.component.ts)

## Criterio de cierre

Esta guía queda suficiente si alguien puede responder rápido estas 4 preguntas:

1. Qué puede hacer cada rol.
2. Qué campos muestra el formulario según el rol.
3. Qué pasa con la contraseña del OWNER.
4. Cómo se asigna la visibilidad del AUDITOR.

Si hace falta más detalle, se consulta el código, no otro documento largo.
