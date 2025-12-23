# 🔒 ShieldTrack

Sistema de gestión de hallazgos de ciberseguridad para reemplazar Excel. Plataforma SOC/MSSP con arquitectura multi-tenant.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)
[![Angular](https://img.shields.io/badge/Angular-18.x-red.svg)](https://angular.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)

## 🚀 Inicio Rápido

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/ShieldTrack.git
cd ShieldTrack

# Configurar backend
cd backend
npm install
cp .env.example .env
# Editar .env con tus configuraciones

# Configurar frontend
cd ../frontend
npm install

# Ejecutar (2 terminales)
# Terminal 1: cd backend && npm run start:dev
# Terminal 2: cd frontend && npm start
```

👉 **Guía completa de instalación:** [SETUP.md](SETUP.md)

## 📚 Documentación

- 📖 **[SETUP.md](SETUP.md)**: Guía de instalación y configuración inicial
- 🤝 **[CONTRIBUTING.md](CONTRIBUTING.md)**: Guía para contribuir al proyecto
- 🐛 **[ISSUES.md](ISSUES.md)**: Problemas conocidos y funcionalidades pendientes
- 🏗️ **[docs/architecture.md](docs/architecture.md)**: Modelo de datos y reglas de negocio detalladas
- 🧪 **[docs/TESTING-GUIDE.md](docs/TESTING-GUIDE.md)**: Guía de pruebas manuales y automatizadas
- 📊 **[docs/qa-*.md](docs/)**: Reportes de QA y riesgos

## 📋 Características Principales

- ✅ **Multi-Tenant**: Gestión por cliente con aislamiento lógico.
- ✅ **RBAC Completo**: 6 niveles de roles (OWNER, PLATFORM_ADMIN, CLIENT_ADMIN, AREA_ADMIN, ANALYST, VIEWER).
- ✅ **Retest Scheduler**: Cron job automático con notificaciones por email.
- ✅ **Timeline Inmutable**: Auditoría completa de cambios en hallazgos.
- ✅ **MFA Disponible**: MFA con TOTP; revisar estado en QA.
- ✅ **Almacenamiento Seguro**: Evidencias en disco local con descarga protegida por JWT.
- ✅ **Desktop-First**: Optimizado para analistas SOC (pantallas ≥1366px).

## 🧭 Índice Rápido

- Arquitectura y mapa de módulos
- Modelo de datos (resumen)
- Flujos críticos
- Seguridad y RBAC
- Endpoints principales
- Instalación y ejecución
- Operación y mantenimiento
- Testing
- Duplicación detectada y plan de unificación

## 🏗️ Arquitectura y Mapa de Módulos

### Backend (NestJS + MongoDB)
- `backend/src/modules/auth`: Autenticación JWT + MFA.
- `backend/src/modules/client`: Clientes (tenants).
- `backend/src/modules/area`: Áreas por cliente.
- `backend/src/modules/project`: Proyectos y `retestPolicy`.
- `backend/src/modules/finding`: Hallazgos + timeline.
- `backend/src/modules/evidence`: Evidencias (upload/descarga).
- `backend/src/modules/retest-scheduler`: Cron de retests.
- `backend/src/common`: Enums compartidos y filtros globales.

### Frontend (Angular 17+ Standalone)
- `frontend/src/app/core`: Servicios, guards e interceptors.
- `frontend/src/app/features`: Pantallas por dominio (auth, dashboard, clients, projects, findings, admin).
- `frontend/src/app/shared`: Modelos y enums compartidos.

Para el detalle completo de entidades y reglas, ver `docs/architecture.md`.

## 🧬 Modelo de Datos (Resumen)

- **Client (Tenant)** → agrupa áreas, proyectos y usuarios.
- **Area** → subdivisión organizacional del cliente.
- **Project** → unidad contractual con `retestPolicy`.
- **Finding** → vulnerabilidad detectada, ciclo de vida y severidad.
- **FindingUpdate** → timeline inmutable de cambios.
- **Evidence** → archivos asociados a hallazgos.
- **User** → RBAC y MFA.

## 🔁 Flujos Críticos

### Cierre de Proyecto
- Al cambiar `projectStatus` a `CLOSED`:
  - Se cierran hallazgos abiertos con `closeReason = CONTRACT_ENDED`.
  - Se desactiva `retestPolicy.enabled`.
  - Se generan updates en el timeline.

### Retest Scheduler
- Cron diario:
  - Busca proyectos con `retestPolicy.enabled = true`.
  - Calcula días restantes vs `nextRetestAt`.
  - Si coincide con `offsetDays`, envía email.
  - Solo incluye hallazgos con `retestIncluded = true`.

### Timeline Inmutable
- Cambios de estado automáticos.
- Seguimientos técnicos.
- Comentarios y evidencias.

## 🔐 Seguridad y RBAC

### Roles
- **OWNER**: único con hard delete.
- **PLATFORM_ADMIN**: admin global sin hard delete.
- **CLIENT_ADMIN**: admin de tenant.
- **AREA_ADMIN**: admin de área.
- **ANALYST**: CRUD de hallazgos y evidencias.
- **VIEWER**: lectura.

### MFA
MFA está disponible; revisar `docs/RESUMEN-QA-PRODUCCION.md` para gaps detectados.

## 🧩 Endpoints Principales (Resumen)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

### Clientes/Áreas/Proyectos
- `GET /api/clients`
- `GET /api/areas`
- `GET /api/projects`

### Hallazgos y Evidencias
- `GET /api/findings`
- `POST /api/findings`
- `POST /api/findings/:id/close`
- `GET /api/findings/:id/timeline`
- `POST /api/evidence/upload`
- `GET /api/evidence/finding/:findingId`

Para el detalle completo, ver Swagger en `http://localhost:3000/api/docs`.

## 🚀 Instalación y Ejecución

### Pre-requisitos
- Node.js v18+
- MongoDB v6+
- npm o yarn

### Backend

1. **Navegar al directorio backend**:
```bash
cd backend
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
MONGODB_URI=mongodb://localhost:27017/shieldtrack
JWT_SECRET=tu-secret-key-seguro
SMTP_HOST=smtp.gmail.com
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password
```

4. **Iniciar MongoDB**:
```bash
mongod
```

5. **Ejecutar backend en modo desarrollo**:
```bash
npm run start:dev
```

El backend estará disponible en: http://localhost:3000
Documentación Swagger: http://localhost:3000/api/docs

### Frontend

1. **Navegar al directorio frontend**:
```bash
cd frontend
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Ejecutar frontend en modo desarrollo**:
```bash
npm start
```

El frontend estará disponible en: http://localhost:4200

## 📧 Configuración SMTP

Para notificaciones de retest, configurar en `.env`:

**Gmail** (requiere App Password):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

**Otros proveedores**: Ajustar según documentación del proveedor.

## 🛠️ Tecnologías Clave

### Backend
- **NestJS 10**: Framework modular.
- **Mongoose**: ODM para MongoDB con TypeScript.
- **@nestjs/schedule**: Cron jobs.
- **@nestjs/swagger**: Documentación automática.
- **class-validator**: Validación de DTOs.
- **Multer**: Upload de archivos.
- **Nodemailer**: Envío de emails.
- **Speakeasy**: MFA TOTP.
- **bcrypt**: Hash de contraseñas.

### Frontend
- **Angular 17+**: Standalone Components.
- **Angular Signals**: State management reactivo.
- **Angular Material**: UI Components.
- **RxJS**: Programación reactiva.
- **TypeScript Strict**: Type safety.

## 🎨 Diseño UI

### Principios Desktop-First
- Mínimo 1366px de ancho.
- Tablas densas con muchas columnas.
- Filtros avanzados inline.
- Sin optimización móvil/tablet.

### Vistas Operativas vs Históricas
- **Operativas**: Solo hallazgos abiertos (status != CLOSED).
- **Históricas**: Todos los hallazgos incluyendo cerrados.

## 🧰 Operación y Mantenimiento

- **Scheduler Retest**: revisar logs del backend para envíos y exclusiones por `retestPolicy.enabled`.
- **Evidencias**: almacenamiento local con descargas protegidas por JWT.
- **Swagger**: disponible en `http://localhost:3000/api/docs` para validar contratos.

## 🧪 Testing

### Backend
```bash
cd backend
npm test                # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage
```

### Frontend
```bash
cd frontend
npm test               # Unit tests con Karma
```

## 📦 Build para Producción

### Backend
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
# Archivos en dist/ listos para servir con nginx/apache
```

## 🔍 Duplicación Detectada y Plan de Unificación

1. **Base URL hardcodeada en frontend**  
   - Se repite `http://localhost:3000` en múltiples componentes.  
   - Recomendación: usar `environment.apiUrl` en un servicio central (`ApiService`) y exponer endpoints por dominio.

2. **Lógica de carga y filtros duplicada en listas**  
   - `client-list`, `project-list`, `finding-list` repiten `applyFilters()` y `formatDate()`.  
   - Recomendación: utilitarios compartidos o un `ListFilterService`.

3. **Plantillas duplicadas entre wizard y admin**  
   - `finding-wizard` trae plantillas locales y `template-list` define defaults.  
   - Recomendación: una única fuente de plantillas desde backend y caché en frontend.

4. **Uso directo de HttpClient en componentes**  
   - Varios componentes realizan llamadas sin servicio dedicado.  
   - Recomendación: crear servicios por dominio (`ClientService`, `AreaService`, `TemplateService`, `EvidenceService`) y centralizar errores/notificaciones.

5. **Confirmaciones y alertas replicadas**  
   - Se usan `confirm`, `alert` y `snackBar` con patrones repetidos.  
   - Recomendación: un `DialogService` y un `NotificationService` para estandarizar UX.

## 🔄 Próximos Pasos

1. ✅ **Implementar componentes completos de UI** para Clients, Projects, Findings.
2. ✅ **Agregar paginación** en listas largas.
3. ✅ **Dashboard con métricas** (estadísticas de hallazgos, gráficos).
4. ✅ **Exportación a PDF** de reportes de hallazgos.
5. ✅ **Búsqueda full-text** en hallazgos.
6. ✅ **Notificaciones en tiempo real** (WebSockets).
7. ✅ **Tests E2E completos** con Cypress.
8. ✅ **Docker Compose** para deployment fácil.

## 📄 Licencia

Propietario - ShieldTrack Team

## 👥 Contribución

Este es un proyecto empresarial privado. Contactar al equipo para colaboraciones.

## 📞 Soporte

NO hay soporte, hay completos palta y mayo 
