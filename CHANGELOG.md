# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

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
