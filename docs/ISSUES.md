<!-- markdownlint-disable MD013 MD007 MD030 MD031 MD034 MD036 MD050 MD032 -->
# Plan de Trabajo: Bitácora SOC

## Tablas de Control

**Alcance de seguimiento:** Las filas `AI-SUMMARY-001` … `AI-SUMMARY-001G` se mantienen como **referencia** (especificación/archivo), pero **no forman parte** del backlog operativo que el equipo prioriza para iteraciones UI/QA ni de las **métricas por oleada** históricas (`UI-MIG-060` cerrado como proceso). Para trabajo vivo: obligaciones **Recurrente**, métricas §9 en `docs/UI-GOVERNANCE.md`, y nuevos `UI-*` si se abren.

### Leyenda de estados (tablas de control)

| Estado | Uso |
| --- | --- |
| **En progreso** | Issues `UI-*` con trabajo abierto. Si la tabla solo muestra el marcador de posición, no hay `UI-*` activos; usar **Listas** para cerrados y **Recurrente** para QA. |
| **Recurrente** | Política viva (cada PR); no se marca **Listo** como ticket único. |
| **Archivo** | Epic IA documentado; sin seguimiento operativo UI (ver nota de alcance). |

**Mejora continua (no son filas En progreso):** bajar `!important` global (`styles.scss`), ejecutar WCAG con herramienta por PR que toque UI (ver `docs/wcag-audit-handoff.md`), y reconteos `rg` §9 cuando cambien tokens o temas.

### En progreso

| ID | Estado | Seccion | Tarea | Notas |
| --- | --- | --- | --- | --- |


### Guardrails para IA (evitar fallas por malas practicas)

Estas reglas aplican a cualquier agente IA que tome items de este backlog:

1. No inventar arquitectura ni stack: antes de codificar, leer documentación vigente del módulo impactado (`docs/COMPLEMENTS.md`, `docs/UI-GOVERNANCE.md`, `docs/API.md`, etc.).
2. No usar Docker cuando el issue no lo requiere: para complementos simples, priorizar `zip-static` con HTML/CSS/JS y publicación por Admin > Complementos.
3. No introducir complejidad innecesaria: si el requerimiento es de consulta visual, evitar backend nuevo, base de datos o servicios externos.
4. No romper contratos existentes: respetar rutas, nombres de campos, scopes y estructuras ya definidas por la plataforma.
5. No hardcodear secretos ni credenciales: prohibido tokens, passwords o endpoints sensibles en frontend/documentación.
6. No usar datos ficticios ambiguos sin etiquetarlos: los ejemplos deben ser claramente de referencia y no simular producción real.
7. No omitir validación funcional: todo cambio debe incluir criterio verificable (qué probar, dónde, y cuándo pasa a `Listo`).
8. No cerrar issues sin evidencia mínima: registrar archivos tocados, resultado esperado y estado (`Pendiente`, `En progreso`, `Listo`).
9. No degradar UX/Accesibilidad: mantener contraste legible, responsive básico y navegación clara; evitar UI recargada o inconsistente con el sistema.
10. No editar de forma destructiva: no revertir cambios ajenos ni sobrescribir secciones históricas de este documento sin justificación explícita.
11. No dejar decisiones implícitas: documentar supuestos clave en la nota del issue (alcance, límites y exclusiones).
12. No saltarse seguridad básica de frontend: escapar contenido dinámico renderizado y evitar inserciones HTML inseguras.

Checklist mínimo recomendado para agentes IA antes de marcar un item como `Listo`:

- Implementación alineada a documentación del repo.
- Sin sobreingeniería para el alcance solicitado.
- Evidencia en `Notas` del issue (qué se hizo y cómo validarlo).
- Riesgos y pendientes explícitos si aplica.

### Recurrente (QA — cada cambio UI)

| ID | Estado | Seccion | Tarea | Notas |
| --- | --- | --- | --- | --- |


### Archivo (referencia — sin seguimiento operativo)

| ID | Estado | Seccion | Tarea | Notas |
| --- | --- | --- | --- | --- |


### ✅ Listas

| ID | Estado | Seccion | Tarea | Notas |
| --- | --- | --- | --- | --- |



Los items marcados como `Listo` deben quedar reflejados en `CHANGELOG.md` como fuente de historial.
---


# Propuestas de solucion  por codigo

Issues  enumerado por su codigo y los pasos a seguir para solucionar, reparar o agregar nuevas caracetristicas al desarrollo