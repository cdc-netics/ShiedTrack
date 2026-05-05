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
| UI-NAV-001 | Listo | UX / Navegación | Simplificar menú de administración y normalizar terminología `Tenant` -> `Áreas` | Aplicado en navegación visible: menú enlaza a `admin/areas`, títulos y textos clave de UI actualizados a `Área/Áreas`, manteniendo compatibilidad técnica con `tenantId` en backend. |
| UI-NAV-002 | Listo | UX / IA | Revisar arquitectura de menú para reducir ruido visual | Menú consolidado en dos bloques claros (`Operación` implícito + `Administración`) sin duplicidad Tenant/Área, con nomenclatura homogénea (`Áreas`, `Plantillas`, `Marca`) y accesos por rol conservados. |
| UI-ENC-001 | Listo  | Frontend / Layout | Corregir caracteres corruptos (`�`) en menú y vistas (`Administración`, `Auditoría`, `Configuración`, `Código`, `Título`) | Se observa mojibake en textos de navegación y tablas. Revisar codificación UTF-8 real en archivos HTML/TS/MD, headers `Content-Type` y `charset` en `index.html`/nginx. Validar que no se estén guardando archivos en ANSI/Windows-1252. |
| UI-ENC-002 | Listo  | Frontend / Tipografía | Verificar si la fuente actual cubre correctamente tildes y caracteres latinos extendidos | No asumir cambio de fuente como única solución. Primero confirmar encoding. Si la fuente falla en glyphs, proponer fallback robusto (`system-ui`, `Segoe UI`, `Inter`, `Roboto`, `Arial`, `sans-serif`) y pruebas visuales. |
| UI-BRAND-001 | Listo  | Branding / Header | Reparar logo roto en sidebar y topbar | El logo no está cargando en capturas. Revisar ruta de `theme.currentLogo`, fallback por defecto, existencia de asset en build final, y comportamiento cuando tenant no tiene logo cargado. |

Los items marcados como `Listo` deben quedar reflejados en `CHANGELOG.md` como fuente de historial.
---


# Propuestas de solucion  por codigo

Issues  enumerado por su codigo y los pasos a seguir para solucionar, reparar o agregar nuevas caracetristicas al desarrollo

## UI-ENC-001 - Caracteres corruptos en interfaz

**Diagnóstico técnico propuesto**
- Verificar que todos los archivos frontend estén en UTF-8 (sin ANSI/ISO-8859-1).
- Revisar `frontend/src/index.html` (`<meta charset="utf-8">`) y respuesta HTTP real.
- Confirmar en nginx `charset utf-8` y `Content-Type` coherente para HTML/CSS/JS.
- Buscar cadenas ya dañadas en código fuente y reemplazarlas por texto correcto.

**Criterio de cierre**
- No aparece `�` en menú, cabeceras ni tablas.
- Términos con tildes se renderizan correctamente en desktop y responsive.

**Hallazgos en entorno Docker (validado)**
- El contenedor `frontend` sirve chunks hashados actualizados, pero el navegador puede conservar un `index.html` previo y terminar mezclando assets viejos/nuevos.
- Esto genera síntomas intermitentes: textos corruptos reaparecen aunque el build actual esté correcto.
- Mitigación aplicada: política `Cache-Control` estricta para `index.html` en nginx del frontend.

## UI-ENC-002 - Validación de tipografía y fallback

**Diagnóstico técnico propuesto**
- Medir si la fuente activa contiene glyphs para español (acentos, ñ, mayúsculas acentuadas).
- Si hay huecos de glyph, aplicar stack de fallback global.
- Evitar hardcode de fuentes por componente; centralizar en estilos base.

**Criterio de cierre**
- Textos con acentos y caracteres especiales se ven correctos sin depender del navegador.

**Hallazgos en entorno Docker (validado)**
- El HTML servido ya expone stack tipográfico con fallback robusto para español.
- El problema principal observado no es solo fuente; también hay efecto de caché de bundles.

## UI-BRAND-001 - Logo no visible

**Diagnóstico técnico propuesto**
- Validar valor de `currentLogo` y fallback cuando no hay branding de tenant.
- Verificar que el asset exista en `dist` y no falle por ruta relativa.
- Comprobar permisos/URL de logo cargado desde backend.
- Añadir placeholder visual consistente para evitar icono roto.

**Criterio de cierre**
- Siempre se muestra logo válido (tenant o fallback) sin imagen rota.

**Hallazgos en entorno Docker (validado)**
- Se detectó riesgo de ruta relativa (`assets/logo.svg`) que puede romper en rutas anidadas (`/admin/*`).
- Mitigación aplicada: default logo absoluto `'/assets/logo.svg'`, normalización de URL y fallback visual con icono si falla la imagen.
- Nota: el endpoint `/api/system-config/branding` responde `401` sin sesión; para diagnóstico de branding siempre validar con usuario autenticado.

## UI-NAV-001 - Unificación Tenant/Áreas

**Propuesta**
- Estandarizar término de producto a `Áreas` en frontend.
- Mantener compatibilidad técnica interna si backend conserva `tenantId`.
- Actualizar etiquetas de menú, títulos y breadcrumbs para consistencia.

**Criterio de cierre**
- El usuario no ve mezcla de `Tenant` y `Área` para el mismo concepto operativo.

**Implementación aplicada**
- Menú lateral actualizado para usar una única entrada funcional `Áreas` apuntando a `routerLink="/admin/areas"`.
- Se añadieron alias de ruta (`/admin/tenants` -> `/admin/areas`) para compatibilidad con enlaces anteriores.
- Se renombraron textos visibles en vistas clave: `Configuración de Área`, `ID del Área`, `Cliente / Área`, y tooltip/acciones de configuración de área.

## UI-NAV-002 - Simplificación de menú

**Propuesta**
- Diseñar menú único con dos bloques:
  - Operación: `Dashboard`, `Proyectos`, `Hallazgos`, `Clientes`.
  - Administración: `Usuarios`, `Áreas`, `Plantillas`, `Auditoría`, `Branding`, `Backup`, `Configuración`, `Notificaciones`.
- Eliminar entradas redundantes y mantener jerarquía visual clara.
- Añadir validación por rol para ocultar opciones no permitidas.

**Criterio de cierre**
- Menú más corto, consistente y sin duplicidad conceptual.

**Implementación aplicada**
- Se mantiene una única sección administrativa, sin entradas redundantes para el mismo concepto.
- Se homogenizó la taxonomía visual del menú para reducir ruido cognitivo: `Plantillas` y `Marca` en lugar de mezclas inglés/español.
- Se preservó control de visibilidad por permisos (`authService.isAdmin()` y `canAccessNotifications()`), evitando sobreexposición de opciones.

## Verificación Docker (obligatoria para UI-ENC-001 / UI-ENC-002 / UI-BRAND-001)

**Objetivo**
- Evitar falsos negativos por caché del navegador o por servir bundles anteriores en contenedor.

**Protocolo de validación**
1. Reconstruir frontend:
   - `docker compose build --no-cache frontend`
   - `docker compose up -d frontend`
2. Confirmar contenedor activo:
   - `docker compose ps`
3. Confirmar asset de logo:
   - `curl -I http://localhost/assets/logo.svg` debe responder `200`.
4. Forzar recarga cliente:
   - `Ctrl + F5` o abrir en incógnito para invalidar caché de `index.html`.
5. Revalidar textos críticos en UI:
   - `Administración`, `Auditoría`, `Configuración`, `Cerrar sesión`, `Código`, `Título`.

**Riesgos detectados**
- Si el logo viene de endpoint protegido y no de asset público, `<img>` no puede enviar Bearer token por header de forma nativa.
- Rutas relativas (`assets/logo.svg`) pueden romper en rutas anidadas (`/admin/*`); usar siempre ruta absoluta (`/assets/logo.svg`).
- En Docker build, Angular puede fallar por conectividad externa al intentar inlining de fuentes de Google (`EAI_AGAIN`). Mitigación aplicada: `optimization.fonts=false` en configuración de producción para evitar dependencia de red durante `docker build`.