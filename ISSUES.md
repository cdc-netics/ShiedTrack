🐛 Issues y Funcionalidades Pendientes - ShieldTrack

**Fecha de Reporte:** 04 de Enero de 2026  
**Versión:** 1.2  
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

**Elaborado por:** GitHub Copilot (Asistente AI)  
**Fecha:** 04 de Enero de 2026  
**Versión del Documento:** 1.2
