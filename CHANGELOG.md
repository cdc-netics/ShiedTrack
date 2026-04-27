# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]


## [2.1.1] - 2026-04-2
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

### 🐛 Correcciones
- Solucionado error 500 en asignación masiva de áreas.
- Limpieza de datos de prueba y basura en base de datos.
- Corregida visibilidad de áreas para usuarios sin cliente asignado.

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
