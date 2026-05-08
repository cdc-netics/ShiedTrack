# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

- **FIX (Docker - backend seeds / login):** la imagen runtime del backend ahora copia `package*.json` y `scripts/`, permitiendo que `docker-entrypoint.sh` ejecute `npm run seed:owner` y `npm run seed:test` al iniciar. Antes el entrypoint intentaba correr seeds que no existian dentro del contenedor.
- **FIX (Seeds - credenciales de desarrollo):** `create-owner.js` y `seed-test-data.js` usan `bcryptjs`, alineado con la dependencia real del backend. Esto corrige fallos en Docker donde `bcrypt` no estaba instalado.
- **FIX (Seeds - idempotencia):** `create-owner.js` ahora normaliza el usuario `admin@shieldtrack.com` si ya existe, reactivandolo y dejando la contrasena de desarrollo en `Admin123!`. Esto evita credenciales antiguas en volumenes persistentes de Mongo.
- **OPS (Docker entrypoint):** los errores de seeds ya no se ocultan con `|| echo`; si una carga inicial falla, el contenedor backend falla de forma visible para facilitar diagnostico.
- **VALIDACION:** verificado login por API con `admin@shieldtrack.com / Admin123!` y usuarios seed `owner@shieldtrack.com`, `clientadmin@acmecorp.com`, `viewer@shieldtrack.com` con `Password123!`.

## [2.2.1] - 2026-05-05

- **FIX (Docker — backend / 502):** `nest build` con la config previa podía dejar **solo `.d.ts`** en `dist` (sin `.js`), de modo que el entrypoint fallaba y nginx devolvía **502**. Se añade `nest-cli.json` (`builder: "tsc"`, `tsconfig.build.json`), `tsconfig.build.json` con `include`/`rootDir`/`incremental: false`, y `docker-entrypoint.sh` admite `dist/main.js` o `dist/src/main.js`.
- **DOCKER (Mongo healthcheck):** El servicio `mongodb` podía quedar `unhealthy` con un volumen antiguo sin usuario root: el check solo autenticaba y Mongo devolvía `UserNotFound`. Ahora el healthcheck hace ping sin credenciales y, si hace falta, prueba con `MONGO_INITDB_ROOT_*`; más `start_period` y reintentos para arranques lentos.
- **DOCS:** Reescritura y ampliación de [SETUP.md](SETUP.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) y [README.md](README.md): dos `.env` (raíz vs `backend/`), puertos `MONGO_PORT` / `BACKEND_PORT` / `FRONTEND_PORT`, Mongo con credenciales, seeds con `docker compose exec`, URLs dinámicas; corrección de caracteres corruptos en DEPLOYMENT.
- **CONFIG / Docker + Mongo + DX:** `MONGO_INITDB_ROOT_USERNAME` y `MONGO_INITDB_ROOT_PASSWORD` en `.env` / `.env.example` (valores de ejemplo) y `MONGODB_URI` con `authSource=admin`. `docker-compose.yml` aplica credenciales al servicio `mongodb`, healthcheck con `mongosh` autenticado, `MONGODB_URI` por defecto alineada en el backend. Puertos en `.env`; `NODE_ENV` por defecto `development`. Documentacion: [SETUP.md](SETUP.md), [docs/DEVELOPMENT-CREDENTIALS.md](docs/DEVELOPMENT-CREDENTIALS.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), `.env.example`; seeds manuales con `docker compose exec backend npm run seed:owner` / `seed:test`.
- **FIX (Backend — CORS):** En `main.ts`, las peticiones **sin** cabecera `Origin` (mismo host detrás de nginx o algunos navegadores) ya no quedan bloqueadas cuando `NODE_ENV=production`. Antes el login desde el front en Docker podía fallar de forma silenciosa en el cliente.
- **FIX (Frontend — Login):** Mensajes de error más explícitos si no hay respuesta del servidor o hay código HTTP.
- **CONFIG:** `CORS_ORIGINS` por defecto en Compose y `.env.example` incluye `http://localhost:4200` y `127.0.0.1:4200` para `ng serve`. Documentación en [docs/DEVELOPMENT-CREDENTIALS.md](docs/DEVELOPMENT-CREDENTIALS.md).
- **SECURITY/OPS (Audit + Docker + Mongo):** Auditoría HTTP global (éxito y error) con saneamiento de campos sensibles (`password`, `token`, etc.), metadatos de `statusCode`/latencia y **TTL de 1 año** en la colección de auditoría. Compose actualizado a `mongo:8.0`, volumen persistente adicional para backups del backend (`backups_data:/app/backups`) y optimización del Dockerfile backend a build multi-stage para reducir tamaño y mejorar tiempos de despliegue.
- **UI/UX (Admin):** Mejora visual del módulo de auditoría en frontend (columnas de severidad y usuario real, filtros alineados a método HTTP/entidad de auditoría) y corrección de caracteres corruptos en títulos de administración.
- **AUDIT (Frontend — descripción legible + IDs con nombre):** `admin/audit` ahora enriquece los registros con catálogos (`clients`, `projects`, `findings`, `users`) para mostrar descripciones humanas en lugar de solo IDs crudos. En el detalle se prioriza el nombre de entidad (si existe) y se mantiene el ID para trazabilidad.
- **AUDIT (Frontend — contexto técnico más claro):** línea de contexto normalizada a formato `METHOD · HTTP · /api/...` para reducir ruido en tabla y mantener foco en “qué hizo”.
- **AUDIT (Frontend — refresco progresivo):** cuando llegan catálogos de entidades, los logs ya cargados se re-normalizan automáticamente para sustituir IDs por nombres sin recargar manualmente.
- **TEMPLATES (Backend — plantillas personales de usuario):** se añade soporte formal de `scope: USER` en DTO y schema de plantillas (`FindingTemplate`). Para nuevos registros, el alcance por defecto pasa a `USER`.
- **TEMPLATES (Backend — permisos y acceso):** creación habilitada para roles operativos además de admins (`AREA_ADMIN`, `ANALYST`); validación de acceso para plantillas personales (solo autor y super-admins).
- **TEMPLATES (Backend — prioridad de UX):** en búsqueda y listado se priorizan “mis plantillas” (`scope=USER` creadas por el usuario actual) por encima de plantillas generales/tenant para acelerar uso diario.
- **TEMPLATES (Frontend — contrato API corregido):** componentes de lista/diálogo alineados al backend (`title`, `cwe_id`, `cvss_score`, `scope`) y actualización vía `PATCH` para evitar incompatibilidades previas con campos legacy (`name`, `cweId`, `cvssScore`).
- **TEMPLATES (Frontend — experiencia visual):** etiquetas de alcance en lista (`Mi plantilla`, `De mi área`, `General`) y bloqueo visual de edición/eliminación cuando el usuario no tiene permisos sobre la plantilla.
- **NAV/ROUTES (Frontend):** nueva ruta pública autenticada `/templates` (además de `/admin/templates`) para que usuarios no admin puedan consultar/crear sus plantillas sin pasar por el centro de administración.
- **NAV (Sidebar):** se agrega acceso principal `Plantillas` en el menú operativo para visibilidad directa del flujo de plantillas.
- **FINDING WIZARD (Frontend):** búsqueda de plantillas en el wizard ahora considera `scope` y ordena con prioridad las plantillas personales del usuario sobre las generales.
- **PERFIL DE USUARIO (Frontend):** configuración de cuenta reforzada en `/profile`: edición de nombre/apellido/email, actualización de avatar por URL **o** carga de imagen local (preview inmediata, validación de tipo y tamaño), y flujo de cambio de contraseña con confirmación de nueva contraseña.

## [2.2.0] - 2026-05-04

### Resumen

Versión que agrupa endurecimiento de API y datos (DTOs, CORS, correlativos atómicos de hallazgos), experiencia de escritura en el wizard, refactor UX/UI en layout y pantallas principales, operativa Docker/Compose con variables desde `.env`, y documentación ampliada (despliegue, API, multi-tenant, credenciales de desarrollo).

### Docker, Compose y variables de entorno

- **[`.env.example`](.env.example)** en la raíz del repositorio para Compose: `JWT_SECRET`, `MONGODB_URI`, `CORS_ORIGINS`, `FRONTEND_URL`, `NODE_ENV`, puertos opcionales (`MONGO_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`), opciones documentadas para Mongo con usuario (`MONGO_INITDB_*`). El archivo **`.env`** real no se versiona (`.gitignore`); cada entorno lo crea a partir del ejemplo.
- **[`docker-compose.yml`](docker-compose.yml):** sustitución de variables desde `.env`; puertos parametrizados; backend con `SKIP_LOCAL_MONGO_DIAGNOSTICS=true`; sin secretos fijos en texto plano en el YAML.
- **Scripts npm (raíz):** `npm start` → `docker compose up --build`; `npm run start:detached` / `npm run stop`; desarrollo sin Docker: `start:local:win` / `start:local:unix`.
- **Imagen** `mongo:7.0`, `restart: unless-stopped`. **Frontend** en Docker: `npm ci` en el Dockerfile para builds reproducibles.
- **`MongoDBConnectionService`:** en contenedor (`.dockerenv` / Podman o variable explícita) no ejecuta diagnóstico ni intento de iniciar Mongo en el sistema operativo host.
- **`backend/docker-entrypoint.sh`:** error claro si falta `dist/main.js`.
- **MongoDB en desarrollo local:** por defecto sin usuario/contraseña en la red interna de Compose; orientación para producción y Atlas en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) y `.env.example`.

### Credenciales de desarrollo (documentación)

- **Nuevo:** [docs/DEVELOPMENT-CREDENTIALS.md](docs/DEVELOPMENT-CREDENTIALS.md) — usuarios de prueba (emails, roles, contraseñas), relación con el seed [backend/scripts/seeds/seed-test-data.js](backend/scripts/seeds/seed-test-data.js) y con el selector de desarrollo del login.

### UX / UI (frontend)

- **Sistema global** [frontend/src/styles/components/_layout.scss](frontend/src/styles/components/_layout.scss) (`ui-stack`, `ui-cluster`, `ui-data-panel`, `ui-kpi-grid`, `ui-stat-strip`, `list-page`, estados vacíos/carga, etc.) integrado en [frontend/src/styles/index.scss](frontend/src/styles/index.scss).
- **Main layout:** `main-layout.component.html` / `.scss`; HTML semántico (`nav`, `main`, `section`); skip link y mejoras de accesibilidad en [frontend/src/index.html](frontend/src/index.html) y [frontend/src/styles.css](frontend/src/styles.css) (`.sr-only`, foco visible, `prefers-reduced-motion`).
- **Dashboard:** plantilla y estilos separados; menos dependencia de `mat-card` para contexto y KPIs.
- **Login:** landmark `<main>`, jerarquía de encabezados y mejoras de formulario/alertas.
- **Listas** (clientes, proyectos, hallazgos): secciones con utilidades `ui-*`, una sola área de datos en lugar de doble tarjeta encabezado/tabla; resumen por severidad en franja en hallazgos.
- **Pendiente** aplicar la misma línea en: admin, wizard completo, detalle, diálogos.

### FIX (frontend — wizard y animación)

- Escritura “al revés” en rich text del wizard (caret); sincronización DOM donde aplica.
- **`AnimationService`:** no aplicar animaciones `rotateY` sobre contenedores con campos editables; respaldo 2D.
- **`styles.css`:** `direction` / `unicode-bidi` en editables.

### Hardening (API, datos y tooling)

- **`main.ts`:** `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`.
- **CORS:** orígenes explícitos (`CORS_ORIGINS` / `FRONTEND_URL`).
- **DTOs y controladores:** validación en auth, system-config, merge de proyectos, bulk-close de hallazgos; `UpdateFindingDto` sin `projectId: any`.
- **Frontend:** tokens SCSS, `OnPush` en vistas pesadas listadas en el historial de trabajo.
- **Backend:** contratos e2e con Jest + Supertest ([backend/test/contracts.e2e-spec.ts](backend/test/contracts.e2e-spec.ts)).
- **`backend/.env.example`:** CORS y Docker.
- **ESLint** backend operativo ([backend/.eslintrc.js](backend/.eslintrc.js)).

### Correlativos de hallazgos (`code`)

- Patrón **Counters** en MongoDB e incremento atómico en hook `pre('save')` ([finding.schema.ts](backend/src/modules/finding/schemas/finding.schema.ts), [counter.schema.ts](backend/src/modules/finding/schemas/counter.schema.ts)).
- API sin `code` en creación desde cliente; wizard sin envío de correlativo generado en cliente.
- Colección Postman P0 actualizada para creación sin `code`.

### Documentación

- **Nuevos / actualizados:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), [docs/API.md](docs/API.md), [docs/MULTI-TENANCY.md](docs/MULTI-TENANCY.md), [docs/architecture.md](docs/architecture.md), [README.md](README.md), [SETUP.md](SETUP.md), [docs/TESTING-GUIDE.md](docs/TESTING-GUIDE.md), [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
- **Docker Compose / CORS** por defecto para front en `http://localhost` (puerto 80) documentado.
- **Limpieza** de `docs/archive/` salvo [docs/archive/Promp.txt](docs/archive/Promp.txt); eliminados planes multi-tenant duplicados obsoletos.

## [2.1.4] - 2026-04-29
### 🎯 Resumen de Cambios

- **FIX (Backend):** Corregido error en la funcionalidad de Backup. El problema era la ausencia del paquete `mongodb-tools` en el contenedor Docker. Actualizado `backend/Dockerfile` para incluir las herramientas necesarias (`mongodump`, `mongorestore`).
- **FIX (Backend):** Mejorado el manejo de errores en `BackupService`. Ahora se detecta explícitamente cuando las herramientas de MongoDB no están instaladas (error "not found") para ofrecer un mensaje descriptivo al usuario.
- **FIX (Frontend):** Corregido campo "Cliente" vacío en el listado de Áreas (Tenants). Se actualizó el componente `AreaListComponent` para mostrar el nombre del `tenantId` en caso de que el `clientId` (legacy) no esté presente, manteniendo la consistencia visual en la nueva arquitectura multi-tenant.
- **FIX (Backend):** Ajustado `AreaService.findByClient` para asegurar que el filtrado de áreas considere correctamente tanto el modelo nuevo (`tenantId`) como el legacy (`clientId`).

## [2.1.3] - 2026-04-29
### 🎯 Resumen de Cambios

- **FEAT (Backend):** Implementada asignación correlativa de `tenantId` (Round-Robin) en la creación de Áreas. Ahora, cuando un usuario `OWNER` o `PLATFORM_ADMIN` crea un área sin especificar un `tenantId`, el sistema la asigna automáticamente al siguiente tenant activo basado en la carga actual de áreas.
- **FIX (Backend):** Corregido error `400 Bad Request` que ocurría al intentar crear áreas desde herramientas externas (o carga masiva) sin enviar el header `X-Tenant-Id`.
- **TEST (Backend):** Añadida suite de pruebas unitarias (`area.service.spec.ts`) para validar la lógica de asignación correlativa, la protección de roles y la prioridad del `tenantId` manual.

## [2.1.2] - 2026-04-28
### 🎯 Resumen de Cambios

- **FIX (Backend):** Corregido error de clave duplicada (`E11000`) en la creación de hallazgos. Se implementó una nueva lógica de generación de códigos que incluye el año actual (ej. `VULN-2026-000001`) y asegura el correlativo más alto mediante ordenamiento descendente.
- **FIX (Frontend):** Corregido fallo en el Wizard de Hallazgos donde la lista de proyectos no se cargaba tras seleccionar un cliente debido a una discrepancia en los tipos de datos (objeto vs string) del `clientId`.
- **FIX (Frontend):** Corregido el bug en el detalle del proyecto donde el contador de "Duración del proyecto" no se actualizaba al cambiar las fechas de inicio y fin. Se implementaron signals reactivos para el seguimiento de cambios en el formulario.
- **MEJORA (Backend):** Actualizado el endpoint de listado de proyectos para soportar filtrado explícito por `clientId`, mejorando la integración con los buscadores reactivos del frontend.

## [2.1.1] - 2026-04-22
### 🎯 Resumen de Cambios

- FIX en api de authenticacion
- Actualizacion de ISSUES/BUG


## [2.1.0] - 2026-04-24
### 🎯 Resumen de Cambios

- Finalizacion de ISSUES
- Generacion de Docker Files
- Generacion de Compose
- Actualizacion de CHANGELOG y Readme



## [2.0.0] - 2026-02-05

### 🎯 Resumen de Cambios
**Tema:** Actualización Mayor a Angular 20 y Modernización del Stack Frontend
- Actualización completa del frontend de Angular 17 a Angular 20.3.16
- Actualización de Angular Material a 20.2.14 y CDK a 20.2.14
- Actualización de TypeScript a 5.9.3 para compatibilidad con Angular 20
- Actualización de Zone.js a 0.15.1
- Mantenimiento de compatibilidad con RxJS 7.8.0
- Validación completa de librerías externas (animejs)
- Build limpio sin errores ni warnings

### ✨ Actualizaciones de Dependencias

#### Frontend
- **Angular Core:** 17.x → 20.3.16
- **Angular CLI:** 17.x → 20.3.15
- **Angular Material:** 17.x → 20.2.14
- **Angular CDK:** 17.x → 20.2.14
- **TypeScript:** 5.x → 5.9.3
- **Zone.js:** 0.14.x → 0.15.1
- **RxJS:** 7.8.0 (sin cambios, compatible)

### 📚 Documentación
- Actualizado README.md con badge de Angular 20
- Actualizado DOCUMENTATION.md con versión correcta del stack
- Actualizado ISSUES.md marcando completada la actualización a Angular 20
- Actualizado docs/architecture.md con referencias a Angular 20+
- Actualizado INDEX.md para reflejar la nueva versión

### 🔧 Cambios Técnicos
- Validación de breaking changes de Angular 20
- Pruebas de compatibilidad con Standalone Components
- Verificación de Signals y state management
- Validación de Material Design components
- Pruebas de build en producción

### ⚠️ Breaking Changes
- Requiere Node.js 18.x o superior
- Librerías de terceros deben ser compatibles con Angular 20+

## [1.7.0] - 2025-01-14

### 🎯 Resumen de Cambios
**Tema:** Implementación Real de UI para Funcionalidades Parcialmente Completadas
- Completamiento de 4 componentes UI críticos
- Integración de 3 features anteriormente backend-only
- Reemplazo de lista de usuarios antigua con versión mejorada
- Adición de descarga de hallazgos individual

### ✨ Nuevas Funcionalidades

#### 👥 UserListImprovedComponent - Gestión Avanzada de Usuarios
- **Reemplaza:** antigua UserListComponent en `/admin/users`
- **Características principales:**
  - Tabla responsive con búsqueda y filtros avanzados
    - Búsqueda: nombre, apellido, email
    - Filtro por rol: Owner, Platform Admin, Client Admin, Area Admin, Analyst, Viewer
    - Filtro por estado: Activos vs Bloqueados
  - **Quick-Actions de 1-Click:**
    - Botón "Asignar": Abre dialog para asignar a clientes/proyectos/áreas
    - Botón "Bloquear": Soft-delete sin diálogos confirmación
    - Botón "Desbloquear": Reactivar usuarios bloqueados
  - **Menú Contextual** con opciones:
    - Editar perfil
    - Cambiar rol
    - Reset de contraseña (envía por email)
    - Ver asignaciones actuales
  - **Iconografía:** Un ícono distinto por rol
  - **Color-coding:** Verde para activos, rojo para bloqueados
  - **MFA Indicator:** Verificación visual de estado MFA

#### 📦 UserAssignmentDialogComponent - Asignación Centralizada
- **Modal Dialog** con 3 tabs:
  1. **Tab Clientes:**
     - Lista de clientes disponibles
     - Search/filter funcional
     - Multi-select checkboxes
     - Summary de seleccionados
  2. **Tab Proyectos:**
     - Proyectos filtrados por cliente seleccionado
     - Search disponible
     - Multi-select checkboxes
  3. **Tab Áreas:**
     - Áreas filtradas por proyecto seleccionado
     - Search disponible
     - Multi-select checkboxes
  - **UI:**
    - Contador de items seleccionados
    - Botones: Guardar, Cancelar
    - Indicador de carga durante POST
  - **Integración:** Abierto desde botón "Asignar" en UserListImprovedComponent

#### 🎨 TenantBrandingConfigComponent - Configuración de Tenant Accesible
- **Nueva Ruta:** `/admin/tenant-config`
- **Tabs:**
  1. **Información Básica:**
     - Nombre del cliente/tenant
     - Display Name (nombre mostrado en UI)
     - Preview del display name en tiempo real
  2. **Favicon y Logo:**
     - Upload de favicon (máx 64x64)
     - Upload de logo (máx 150x auto)
     - Preview inmediata
     - Botones de subida contextuales
  3. **Colores:**
     - Color picker para color primario
     - Preview en vivo del color seleccionado
- **Backend Integration:**
  - POST `/api/clients/me/branding` para guardar
  - Sincroniza con localStorage
  - Snackbar feedback
- **Nota:** Complementa BrandingConfigComponent anterior (/admin/branding)

#### 📥 FindingDownloadButtonComponent - Descargas Individuales
- **Componente Reutilizable** de botón de descarga
- **Formatos Soportados:**
  - CSV: Exporta con UTF-8 BOM
  - PDF: Requiere endpoint GET /api/findings/{id}/export/pdf
  - JSON: Descarga JSON formateado
- **Extra Features:**
  - Menú de contexto con opciones
  - Copia al portapapeles (JSON)
  - Indicador de carga durante descarga
  - Snackbar con confirmación
  - Error handling con mensajes al usuario
- **Integración:** Agregable a finding-list y finding-detail components

### 🔧 Mejoras Técnicas

#### URL Configuration
- **Area Deletion:** Actualizada URL en `area-list.component.ts`
  - De: hardcoded `http://localhost:3000/api/areas/{id}/hard`
  - A: `environment.apiUrl` configurable
  - Implementa doble confirmación: prompt + nombre verification

#### Routing Updates
- `/admin/users` ahora carga `UserListImprovedComponent` en lugar del anterior
- Agregada nueva ruta `/admin/tenant-config` → TenantBrandingConfigComponent
- Ambas en `app.routes.ts` con lazy loading

#### Material Design
- Nuevos componentes usan Material Design consistente
- MatDialog, MatSnackBar, MatMenu integrados
- Colores por rol: Owner (rojo), Admin (naranja), Analyst (púrpura), Viewer (gris)

### 📊 Cobertura de Issues

Este release completa/mejora:
- **#3:** Branding del sistema → Ahora accesible en `/admin/tenant-config`
- **#5:** Soft delete usuarios → UI completa en UserListImprovedComponent
- **#8:** Reporte de hallazgos → Descarga individual agregada
- **#10:** Gestión de áreas → Eliminación ya tenía UI, ahora usa env variable
- **#11:** Asignación centralizada → UserAssignmentDialogComponent + UserListImprovedComponent
- **#17:** Configuración de favicon → Integrada en TenantBrandingConfigComponent
- **#20:** Nombre mostrado del tenant → Campo en TenantBrandingConfigComponent
- **#21:** Crear admin con tenant → Backend listo, UI aún requiere implementación

### 📝 Documentation

Creado nuevo archivo de referencia:
- **ISSUES-REAL-STATUS.md:** Estado honesto de todas las 30 funcionalidades
  - Metodología: ✅ = UI accesible, ⚠️ = Backend listo pero UI incompleta, ❌ = No hecho
  - Estadísticas: 47% con UI completa, 36% gap entre backend y UI visible

### 🐛 Fixes
- Area deletion URL usa `environment.apiUrl` en lugar de localhost hardcoded

### 🚀 Próximos Pasos (v1.7.1+)
1. Agregar campo `initialAdmin` en diálogo de creación de clientes (backend listo)
2. Implementar Sistema de Auditoría completo (ruta existe, componente vacío)
3. WebSocket/Real-time (actualmente polling)
4. MFA UI refinement
5. API Keys generation interface
6. Paginación en tablas faltantes

---

## [1.6.2] - 2026-01-14

### ✨ Nuevas Funcionalidades UX/UI

#### 🎨 AnimationService Global
- **Nuevo Servicio:** `AnimationService` con 15+ animaciones reutilizables
- Animaciones disponibles:
  - `fadeInUp()` - Entrada con fade y translateY
  - `slideInLeft/Right()` - Entrada lateral
  - `staggerFadeIn()` - Lista con retraso escalonado
  - `pulse()`, `shake()`, `bounce()` - Feedback visual
  - `zoomIn()`, `flipX()` - Transformaciones
  - `glow()` - Efecto de brillo
  - `countUp()` - Animación de números
  - `progressBar()` - Barra de progreso animada
  - `cardEntrance()` - Entrada de tarjetas con flip
  - `morph()` - Transiciones suaves entre estados

#### 🃏 UserCardsComponent - Vista Moderna de Usuarios
- **Nueva Vista:** Gestión de usuarios con diseño de tarjetas (cards)
- **Estadísticas Header:**
  - 4 tarjetas con gradientes: Total, Activos, Con MFA, Administradores
  - Animación count-up en números
  - Colores distintivos por métrica
- **Grid de Usuarios:**
  - Avatar circular con iniciales y color generado por email
  - Chip de rol con ícono y color por tipo
  - Badge de MFA verificado
  - Estado activo/desactivado visual
  - Hover con elevación y sombra
- **Filtros Avanzados:**
  - Búsqueda por nombre, email o rol
  - Filtro por rol específico
  - Filtro por estado MFA
- **Acciones Rápidas:**
  - Editar usuario
  - Asignar áreas
  - Desactivar/Reactivar con confirmación
- **Animaciones:**
  - Entrada escalonada de tarjetas de estadísticas
  - Fade-in con stagger en grid de usuarios
  - Transiciones suaves en hover

#### 🔍 Mejoras en FindingsListComponent
- Imports adicionales: MatExpansionModule, MatDatepickerModule, MatBadgeModule
- Preparado para panel de filtros avanzados expandible
- Documentación actualizada para filtros por fecha y CVSS

### 🔧 Mejoras Técnicas
- Animaciones centralizadas y reutilizables en toda la aplicación
- Diseño responsive para móviles (grid adaptativo)
- Consistencia visual con Material Design
- Carga dinámica con animaciones para mejor feedback

### 📝 Documentación
- ISSUES.md actualizado: 6 items EN PROGRESO → COMPLETADOS (v1.7)
- CHANGELOG.md con sección v1.6.2 detallada
- Documentación completa de AnimationService
- Comentarios JSDoc en UserCardsComponent

---

## [1.6.1] - 2026-01-14

### ✨ Nuevas Funcionalidades

#### 🏢 Gestión Mejorada de Tenants (Multi-tenancy)
- **Backend:**
  - Campo `displayName` en schema Client para nombre corto de tenant (ej: "ACME")
  - Campo opcional `initialAdmin` en `CreateClientDto` para crear admin al crear tenant
  - Nuevo DTO `CreateTenantAdminDto` con email, password, firstName, lastName
  - Al crear tenant con `initialAdmin`, se crea automáticamente usuario CLIENT_ADMIN
  - Validación con `class-transformer` y `@nestjs/class-validator`
  - Logging detallado de creación de admin por tenant
  
- **Frontend:**
  - **Indicador de Tenant Actual** en navbar con Material Chip
  - Muestra `displayName` o `name` del cliente actual
  - Tooltip con información completa del tenant
  - Estilo con fondo semi-transparente blanco y ícono de negocio
  - Carga automática de tenant desde JWT payload (`clientId`)
  - Servicio `HttpClient` integrado en `MainLayoutComponent`

#### 🗑️ Eliminación de Áreas
- Endpoint `DELETE /api/areas/:id/hard` ya existe con rol OWNER
- Eliminación permanente (hard delete) de área
- Requiere validación de permisos a nivel OWNER

### 🔧 Mejoras Técnicas
- Importación de `AuthService` en `ClientModule` para crear usuarios desde tenant
- Manejo robusto de errores en creación de admin (no-blocking)
- Compilación exitosa del frontend (Angular 20+)
- Downgrade de `animejs` v4 → v3.2.2 para compatibilidad
- Integración de `MatChipsModule` y `MatTooltipModule`

### 🐛 Correcciones
- Fix de compilación TypeScript en `client.service.ts` (`registerUser` → `register`)
- Fix de import de anime.js en `login.component.ts` (default import)
- Fix de `loadBranding()` en `app.component.ts` (void return)
- Actualización de ISSUES.md: Items #19, #20, #21 marcados como COMPLETADOS

### 📝 Documentación
- ISSUES.md actualizado a versión 1.6
- CHANGELOG.md con sección v1.6.1 detallada
- Documentación de todos los nuevos endpoints y DTOs

---

## [1.6.0] - 2026-01-14

### ✨ Nuevas Funcionalidades

#### 🎨 Sistema de Branding Dinámico
- **Backend:**
  - `GET /api/system-config/branding` - Obtiene configuración de branding
  - `PUT /api/system-config/branding` - Actualiza configuración (OWNER)
  - `POST /api/system-config/branding/favicon` - Sube favicon (.ico, .png, .svg hasta 1MB)
  - `POST /api/system-config/branding/logo` - Sube logo (.png, .jpg, .svg hasta 2MB)
  - Nuevo schema `SystemBranding` con appName, faviconUrl, logoUrl, primaryColor, secondaryColor
  - Directorio `uploads/branding/` para archivos estáticos
- **Frontend:**
  - `BrandingService` - Carga y aplica branding dinámicamente
  - `BrandingConfigComponent` - UI completa para OWNER (favicon, logo, colores, preview)
  - Ruta `/admin/branding` configurada
  - `AppComponent` inicializa branding al arrancar aplicación
  - Actualización dinámica de favicon, document.title y CSS variables

#### 🎬 Animaciones Profesionales con anime.js
- **Login Screen:**
  - 30 partículas animadas con movimiento aleatorio y escala dinámica
  - Logo de escudo con animación de rotación 360° y efecto pulse
  - Dibujo animado del check dentro del escudo (stroke-dashoffset)
  - Fade-in suave del card de login con translateY
  - Gradiente de fondo dinámico (purple → blue)

#### 🔀 Fusión de Proyectos
- **Backend:**
  - `POST /api/projects/merge` - Fusiona dos proyectos (OWNER/PLATFORM_ADMIN)
  - Mueve TODOS los hallazgos del proyecto origen al destino
  - Preserva metadata con campo `mergedFrom` en hallazgos
  - Agrega historia de fusión en campo `mergeHistory[]` del proyecto destino
  - Actualiza contadores automáticamente
  - Elimina proyecto origen permanentemente tras fusión
  - Validaciones: proyectos distintos, ambos existen
- **Frontend:**
  - `SystemConfigComponent` conectado con endpoint real
  - Carga lista de proyectos desde API (no más mocks)
  - Confirmación con detalles de origen/destino
  - Feedback de éxito con contadores de hallazgos movidos

### 🐛 Conocidos (Ver ISSUES.md para detalles)
- Clientes muestran 0 proyectos cuando sí existen (#1)
- Sistema de áreas no filtra correctamente (#2)
- Áreas dicen "Sin Administradores" incorrectamente (#3)
- Registro de auditoría incompleto (#5)
- Códigos de proyecto no son automáticos (#7)

### 📋 Pendientes
- Implementar filtrado por área en todas las queries
- Completar sistema de auditoría con interceptor global
- Agregar previsualización de evidencias (imágenes/texto)
- Activar disparadores de email para eventos clave
- Centralizar gestión de usuarios (roles, permisos, asignaciones)

## [1.5.0] - 2026-01-13

### ✨ Nuevas Funcionalidades

#### 🗄️ Sistema de Backup/Restore Automatizado
- **Endpoints:**
  - `POST /api/backup/create` - Crea backup manual (rate limit: 2/hora)
  - `POST /api/backup/restore/:filename` - Restaura backup (rate limit: 1/hora)
  - `GET /api/backup/list` - Lista backups disponibles
  - `GET /api/backup/stats` - Estadísticas de backups
  - `GET /api/backup/download/:filename` - Descarga backup
  - `DELETE /api/backup/:filename` - Elimina backup antiguo
- **Características:**
  - Backup automático diario a las 2 AM (cron job)
  - Retención de 30 días (auto-limpieza)
  - Usa mongodump/mongorestore nativos
  - Rate limiting con @nestjs/throttler
  - Solo accesible por rol OWNER

#### 👥 Roles Personalizados (CustomRole)
- **Nuevo módulo `CustomRoleModule`:**
  - `POST /api/custom-roles` - Crear rol personalizado
  - `GET /api/custom-roles` - Listar roles (filtrado por tenant)
  - `GET /api/custom-roles/:id` - Obtener rol por ID
  - `PUT /api/custom-roles/:id` - Actualizar rol
  - `DELETE /api/custom-roles/:id` - Eliminar rol
- **Schema CustomRole:**
  - Campos: name, displayName, description, clientId (tenant)
  - Permissions array con structure {resource: string, actions: string[]}
  - isActive y isSystem flags
  - Índice compuesto en (name, clientId)
- **Características:**
  - CLIENT_ADMIN solo puede crear roles para su tenant
  - OWNER puede crear roles globales (clientId: null)
  - Previene modificación de roles del sistema (isSystem: true)
  - Stub hasPermission() para futura ACL

#### 🏢 Cambio de Tenant para OWNER
- `POST /api/auth/switch-tenant/:clientId` - Cambia contexto de tenant
- Genera nuevo JWT con clientId actualizado
- Solo OWNER y PLATFORM_ADMIN pueden cambiar tenant
- Valida que el cliente existe antes de generar token
- Respuesta incluye nuevo accessToken y datos del cliente

#### 🧹 Soft Delete de Usuarios
- `DELETE /api/auth/users/:id/soft` - Desactiva usuario (no elimina)
- `POST /api/auth/users/:id/reactivate` - Reactiva usuario
- Campos agregados: isDeleted, deletedAt, deletedBy
- Usuarios desactivados no pueden hacer login
- Preserva histórico completo

#### 📊 Arquitecturas de Servicio Expandidas
- Expandido de 7 a 15 tipos en enum `ServiceArchitecture`:
  - Nuevos: MOBILE, DESKTOP, IOT, BLOCKCHAIN, MICROSERVICES, SERVERLESS, CONTAINER, MAINFRAME, DATABASE, NETWORK
  - Previos: WEB, CLOUD, API, FTP, ONPREM, HYBRID, OTHER

#### 📁 Correcciones de Exportaciones CSV
- **Problemas resueltos:**
  - CSV exportaban vacíos a pesar de tener datos
  - Codificación incorrecta (Excel mostraba caracteres extraños)
  - Consultas Mongoose con tipos incorrectos (clientId string vs ObjectId)
- **Soluciones implementadas:**
  - BOM UTF-8 (`\uFEFF`) al inicio del archivo
  - Uso consistente de `client._id` (ObjectId) en queries
  - Windows line endings (`\r\n`)
  - Escape de comillas dobles: `replace(/"/g, '""')`
  - Logging detallado de hallazgos encontrados
- **Endpoints verificados:**
  - `GET /api/export/client/:id/csv` - CSV de todos los hallazgos del cliente
  - `GET /api/export/project/:id/csv` - CSV de hallazgos del proyecto

### 🐛 Conocidos (Ver ISSUES.md para detalles)
- Clientes muestran 0 proyectos cuando sí existen (#1)
- Sistema de áreas no filtra correctamente (#2)
- Áreas dicen "Sin Administradores" incorrectamente (#3)
- Registro de auditoría incompleto (#5)
- Códigos de proyecto no son automáticos (#7)

### 📋 Pendientes
- Implementar filtrado por área en todas las queries
- Completar sistema de auditoría con interceptor global
- Agregar previsualización de evidencias (imágenes/texto)
- Implementar exportación ZIP con evidencias
- Agregar backup completo de MongoDB
- Implementar white-labeling (ThemeService)
- Agregar animaciones con anime.js

## [1.4.0] - 2026-01-05

### 🔒 Seguridad
- **CRITICAL**: Corregidas vulnerabilidades IDOR en `ClientService`, `ProjectService` y `FindingService`.
- **HIGH**: Implementado sistema de auditoría (`AuditLog`) para acciones críticas.
- **HIGH**: Corregido fallo en `RetestScheduler` que no se detenía al cerrar proyectos.
- **HIGH**: Validación estricta de `JWT_SECRET` en producción.
- **MEDIUM**: Implementado Rate Limiting (`@nestjs/throttler`) para descargas.

### 📄 Documentación
- Actualizada licencia a **Business Source License 1.1**.
- Actualizado estado del proyecto a **🚧 EN DESARROLLO**.
- Reorganización de documentación: reportes antiguos movidos a `docs/archive/`.
- Actualizado `README.md` con instrucciones de instalación consolidadas.

## [1.0.0] - 2025-12-22

### ✨ Añadido

#### Backend
- Módulo de autenticación con JWT y MFA (TOTP)
- RBAC con 6 niveles de roles (OWNER, PLATFORM_ADMIN, CLIENT_ADMIN, AREA_ADMIN, ANALYST, VIEWER)
- Gestión de clientes (tenants) con aislamiento lógico
- Gestión de áreas por cliente
- Gestión de proyectos con estados (ACTIVE, CLOSED, ARCHIVED)
- CRUD completo de hallazgos (findings) con 5 niveles de severidad
- Timeline inmutable de cambios en hallazgos (FindingUpdate)
- Gestión de evidencias con almacenamiento local seguro
- Retest Scheduler con cron job diario y notificaciones por email
- Exportación a Excel (con streaming para datasets grandes)
- Exportación a CSV
- Sistema de plantillas de hallazgos (FindingTemplate)
- API REST documentada con Swagger
- Validaciones estrictas con class-validator
- Índices optimizados en MongoDB
- Scripts de utilidad: create-owner.js, seed-test-data.js

#### Frontend
- Arquitectura con Standalone Components (Angular 18)
- Gestión de estado con Signals
- Dashboard con métricas y gráficos (ngx-charts)
- CRUD de clientes, proyectos, hallazgos
- Wizard de creación de hallazgos (3 pasos con MatStepper)
- Vista detallada de hallazgos con tabs:
  - Información general
  - Información técnica (CVE, CVSS, CWE, controles, referencias)
  - Evidencias con upload/download
  - Timeline de cambios
- Upload de evidencias con drag & drop
- Gestión de usuarios y roles
- Asignación de áreas a usuarios
- Vista de registros de auditoría
- Configuración del sistema (SMTP, retenciones)
- Exportación de proyectos a Excel
- UI con Angular Material (design system consistente)
- Interceptor HTTP para autenticación automática
- Guards de ruta para protección de vistas

#### Documentación
- README.md con arquitectura y guía de uso
- SETUP.md con instrucciones de instalación
- CONTRIBUTING.md con guías de contribución
- ISSUES.md con problemas conocidos y roadmap
- docs/architecture.md con modelo de datos detallado
- docs/TESTING-GUIDE.md con casos de prueba
- docs/qa-*.md con matrices de QA
- Colección de Postman para testing de API
- .env.example con configuración de referencia

#### Infraestructura
- .gitignore completo para NestJS + Angular + MongoDB
- Configuración de TypeScript para backend y frontend
- ESLint y Prettier (opcional)
- Scripts de inicio automatizados
- Docker-ready (configuración preparada)

### 🔧 Configuración
- MongoDB 6+ como base de datos
- Node.js 18+ y npm 9+
- Passport-JWT para autenticación
- Nodemailer para emails
- ExcelJS para exportaciones con streaming
- Mongoose para ODM
- bcrypt para hashing de passwords
- class-validator y class-transformer para DTOs
- @nestjs/schedule para cron jobs

### 🎨 UX/UI
- Desktop-first (optimizado para pantallas ≥1366px)
- Tema Material Design con paleta personalizable
- Chips de severidad con códigos de color
- Filtros y búsquedas en tablas
- Modales para creación/edición
- Snackbars para feedback de acciones
- Stepper para flujos complejos
- Tabs para organización de información

### 🔐 Seguridad
- Autenticación JWT con refresh tokens
- MFA con TOTP (autenticador apps)
- Hashing de passwords con bcrypt (10 rounds)
- Validación de entrada con class-validator
- Protección de archivos con JWT
- CORS configurado
- Rate limiting (preparado)
- Sanitización de HTML en descripciones

### 📊 Performance
- Streaming para exportaciones grandes (ExcelJS)
- Índices optimizados en MongoDB
- Lazy loading de módulos (frontend)
- Paginación en listas
- Signals para reactividad eficiente
- Gzip compression (preparado)

### ✅ Testing
- Suite de casos de prueba P0 documentada
- Validaciones manuales completas
- Postman collection con 30+ endpoints
- Scripts de seeding para datos de prueba

### 🚀 Deployment
- Build de producción para backend (NestJS)
- Build de producción para frontend (Angular AOT)
- Variables de entorno para configuración
- Logs estructurados con Winston (preparado)
- Health check endpoint

## [0.1.0] - 2025-11-XX (Prototipo Inicial)

### Añadido
- Estructura base del proyecto
- Autenticación básica
- CRUD simple de hallazgos
- Primera versión del dashboard

---

## Tipos de cambios

- `Añadido` para nuevas funcionalidades
- `Cambiado` para cambios en funcionalidades existentes
- `Obsoleto` para funcionalidades que serán eliminadas
- `Eliminado` para funcionalidades eliminadas
- `Corregido` para corrección de bugs
- `Seguridad` para vulnerabilidades

---

## Links

- [Issues conocidos](ISSUES.md)
- [Guía de contribución](CONTRIBUTING.md)
- [Documentación](README.md)
