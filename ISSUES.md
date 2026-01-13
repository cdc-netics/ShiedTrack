🐛 Issues y Funcionalidades Pendientes - ShieldTrack

**Fecha de Reporte:** 13 de Enero de 2026  
**Versión:** 1.5  
**Tipo:** Reporte de Soporte Técnico

---

## 📋 Resumen Ejecutivo

Este documento lista todos los problemas detectados en el sistema ShieldTrack, tanto por pruebas de usuario como por revisión del código vs. los requerimientos originales del `Promp.txt`.

**Estado General:**
- ✅ Funcionalidades Core implementadas (Hallazgos, Proyectos, Usuarios, Timeline)
- ⚠️ Funcionalidades parcialmente implementadas (Áreas, Retest Scheduler)
- ❌ Funcionalidades no implementadas (White-labeling, Animaciones, Backup completo)

---

## ✅ RESUMEN DE LO LOGRADO (Enero 2026)

Se han resuelto problemas críticos de estabilidad y consistencia de datos:
1.  **Estabilidad API:** Solucionado error 500 en asignación masiva de áreas (conflicto de rutas).
2.  **Limpieza de Datos:** Eliminados datos de prueba (`TEST-*`) y basura (`APPS`, `INFRA`) que causaban duplicados en la UI.
3.  **Visibilidad de Áreas:** Corregido bug donde usuarios "huérfanos" (sin cliente válido) no veían áreas.
4.  **Filtros UI:** Ajustado el listado de áreas para que el Owner vea todo por defecto.

---

## ❌ PENDIENTES Y MEJORAS REQUERIDAS (DETALLADO)

### 🔴 ALTA PRIORIDAD (UX y Funcionalidad Crítica)

#### 1. Owner "Modo Dios" (Permisos Globales)
**Problema:** El usuario con rol `OWNER` actualmente necesita asignarse explícitamente a áreas para ver proyectos o gestionar recursos.
**Requerimiento:** El Owner debe tener acceso implícito a **TODO** (todos los clientes, todas las áreas, todos los proyectos) sin necesidad de asignaciones manuales en tablas pivote.
**Impacto:** Alto. El "Dios del sistema" no debería tener restricciones.

#### 2. Gestión de Usuarios Confusa (Campo Cliente)
**Problema:** Al crear usuarios, el campo "Cliente" es obligatorio o confuso. No hay una forma visual clara de saber a qué áreas pertenece un usuario desde la lista principal.
**Requerimiento:**
- Mejorar UX en creación de usuarios (si es Owner, no pedir cliente o hacerlo opcional/claro).
- Mostrar visualmente en la tabla de usuarios las áreas asignadas (ej: badges o columna "Áreas").

#### 3. Configuración SMTP y Notificaciones Incompleta
**Problema:** El módulo de configuración (`SystemConfig`) existe en backend pero la UI es deficiente o inexistente para ingresar credenciales (especialmente password). El usuario reporta que "está malo".
**Requerimiento:**
- Interfaz clara para ingresar Host, Port, User, Password (campo seguro).
- Botón de "Probar Conexión" (Test Email).
- Validar que las notificaciones de Retest Scheduler realmente usen esta configuración.

#### 4. Nomenclatura de Códigos Dinámica (Global vs Área)
**Problema:** Los códigos de hallazgos (ej: `FND-001`) se generan con una lógica fija.
**Requerimiento:**
- Permitir configurar el formato de códigos.
- **Nivel Global:** Formato por defecto para todo el sistema.
- **Nivel Área:** Si un área específica (ej: "Ciber") quiere su propio prefijo (ej: `CIBER-001`), debe poder configurarlo.
- Falta la entidad o campos de configuración para esto.

---

### 🟠 AUDITORÍA Y REPORTES

#### 5. Datos Faltantes en Logs de Auditoría
**Problema:** Los registros de auditoría existen pero campos críticos como `Tenant` (Cliente) y `Area` aparecen vacíos o no se registran.
**Requerimiento:**
- Asegurar que cada evento de auditoría capture el contexto completo (`clientId`, `areaId`).
- Si la acción es global (Owner), registrarlo explícitamente como "Sistema".

---

### 🟡 DEUDA TÉCNICA Y BUGS CONOCIDOS (Anteriores)

#### 6. Clientes muestran 0 proyectos (Visual)
**Estado:** Reportado como solucionado, verificar en producción.

#### 7. Plantillas (FindingTemplate) No Probadas
**Estado:** Funcionalidad existe en código pero no ha sido validada end-to-end.

#### 8. Exportación Limitada
**Falta:** Exportación en ZIP (con evidencias) y Backup completo de base de datos (dump).

#### 9. Previsualización de Evidencias
**Falta:** Poder ver imágenes/txt en un modal sin descargar el archivo.

#### 10. White-labeling (Temas)
**Falta:** Poder cambiar logo y colores por cliente.

---

## 🚀 ANÁLISIS DE BRECHAS (GAP ANALYSIS)

Tras revisar el código actual (`finding.service.ts`, `system-config.schema.ts`), se detectan los siguientes vacíos técnicos para cumplir con lo solicitado:

1.  **SystemConfig:** El esquema tiene `smtp_pass_encrypted`, pero falta la lógica en el Frontend para enviar este dato de forma segura y el endpoint en Backend para recibirlo y encriptarlo correctamente antes de guardar.
2.  **FindingService:** La generación de códigos (`create`) busca un consecutivo global o por proyecto, pero no consulta una configuración de "Prefijo por Área". Se requiere modificar el esquema de `Area` para incluir `findingCodePrefix` y `nextFindingNumber`.
3.  **AuditLog:** El esquema `AuditLog` tiene `entityId` y `metadata`, pero no tiene campos directos para `clientId` o `areaId`, lo que dificulta el filtrado por tenant en la vista de auditoría.

---

**Próximos Pasos Sugeridos:**
1.  Implementar lógica "Modo Dios" para Owner en todos los Guards y Services.
2.  Desarrollar pantalla de configuración SMTP funcional.
3.  Modificar esquema de Área para soportar configuración de códigos.
4.  Ampliar esquema de AuditLog para incluir contexto completo.
5.  Poder Cerrar los hallazgos masivamente (uso de check y cerrar  varios).
6.  poder hacer un drop completo de la BD desde la interfaz de administración (con confirmación).
7.  en los hallazgos, agregar un campo de "fecha de cierre" que se llene automáticamente al cerrar un hallazgo.
8.  en los proyectos, agregar un filtro por estado (ACTIVE, CLOSED, ARCHIVED) en la UI.
9.  en hallazgos faltaria  campos de recomendaciones ante esos riesgos que se puedan poner viñetas.
10. en hallazgos fataria un campo de riesgo con nivel de riesgo (bajo, medio, alto, critico)  y justificacion de riesgo , un campo de texto. 
11.  en hallazgos  en el campo de afectado, permitir agregar  multiples opciones (tags) y que separe con coma ya que los afectados  pueden multiples  IP,  URL.
12. poder descargar un reporte  en PDF  de un hallazgo  individual  con toda su informacion  y evidencias incluidas.
13. poder descargar un reporte  en PDF  de un proyecto  con todos los hallazgos  y evidencias incluidas.
14. poder asignar  multiples areas  a un proyecto  ya que un proyecto puede involucrar  multiples areas de una empresa.
15. poder descargar  todas las evidencias  de un proyecto  en un archivo ZIP  desde la interfaz de usuario.
16. poder descargar  Todos los hallazgos de un cliente en CSV desde la interfaz de usuario. 
17. poder descargar  todo los hallazgos de un proyecto especifico  en CSV desde la interfaz de usuario.
18. agregar animaciones  suaves  en las transiciones  de pantallas  usando anime.js  para mejorar la experiencia de usuario.
19. implementar un sistema de backup  completo  de la base de datos MongoDB  desde la interfaz de usuario  con opciones de programacion  diaria, semanal, mensual.
20. implementar un sistema de restauracion  de backups  de la base de datos MongoDB  desde la interfaz de usuario  para recuperar datos en caso de perdida o corrupcion.
21. mejorar el sistema de auditoria  para que registre  todas las acciones criticas  de los usuarios  incluyendo cambios en configuraciones, creacion y eliminacion de usuarios, cambios en roles y permisos.
22. agregar un sistema de notificaciones  por email  para informar a los usuarios  sobre cambios importantes  en sus proyectos o hallazgos asignados.
23. implementar un sistema de filtrado avanzado  en la interfaz de usuario  para que los usuarios puedan buscar  y filtrar proyectos y hallazgos  por multiples criterios (estado, severidad, fecha, area, etc).
24. mejorar la asignacion de proyectos hacia usuarios que no son area admin  para que puedan ver  solo los proyectos  que les han sido asignados  sin necesidad de ser administradores de area.
25. mejorar la asignacin de clientes a usuarios  para que los usuarios puedan tener acceso  a multiples clientes  sin necesidad de ser administradores de cliente.
26. Customizar mediante IU  que adminstradores de area  puedan asignar proyectos a  los usuarios  que no son area admin  pero que necesitan ver esos proyectos.
27. que todo  el panel de configuracion de areas y proyectos   este centralizado en una sola pantalla  para facilitar la gestion  y visualizacion de estos elementos.

**Fecha:** 13 de Enero de 2026  
**Versión del Documento:** 1.5
