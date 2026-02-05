# 📚 ShieldTrack - Documentación Completa

> **Documento maestro consolidado - Última actualización: 13 de Enero 2026**

---

## 📋 Índice de Contenidos

1. [Inicio Rápido](#inicio-rápido)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Estado de Implementación](#estado-de-implementación)
5. [Changelog - Historial de Cambios](#changelog)
6. [Guía de Nuevos Componentes](#guía-de-nuevos-componentes)
7. [Información de Créditos](#información-de-créditos)

---

## 🚀 Inicio Rápido

### En 2 Minutos

```bash
# Terminal 1: Backend
cd backend
npm install
npm run build
npm start
# Backend en http://localhost:3000

# Terminal 2: Frontend
cd frontend
npm install
npm start
# Frontend en http://localhost:4200
```

### Acceder al Sistema
- URL: `http://localhost:4200`
- Usuario por defecto: `admin@shieldtrack.com`

### Usar Tareas Pre-configuradas en VS Code
En lugar de comandos manuales, puedes usar las tareas definidas en `.vscode/tasks.json`:

```powershell
# PowerShell: Ejecutar todas las tareas de inicio
Start-AllServices.ps1

# O iniciar servicios individuales
Start-Backend.ps1
Start-Frontend.ps1
Start-Database.ps1
```

---

## 🔧 Instalación y Configuración

### Pre-requisitos

Antes de iniciar el proyecto, asegúrate de tener instalado:

- **Node.js** 18.x o superior
- **npm** 9.x o superior
- **MongoDB** 6.x o superior (local o remoto)
- **Git** para control de versiones

### Instalación Paso a Paso

#### 1. Clonar el Repositorio

```bash
git clone https://github.com/TU_USUARIO/ShieldTrack.git
cd ShieldTrack
```

#### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de variables de entorno
cp .env.example .env

# Editar .env con tus configuraciones
# IMPORTANTE: Cambiar JWT_SECRET, MONGODB_URI y credenciales SMTP
```

**Archivo `.env` requerido:**

```env
# ============ DATABASE ============
MONGODB_URI=mongodb://localhost:27017/shieldtrack

# ============ JWT (CAMBIAR EN PRODUCCIÓN) ============
JWT_SECRET=tu-clave-secreta-super-segura-aqui-minimo-32-caracteres
JWT_EXPIRES_IN=8h

# ============ APPLICATION ============
PORT=3000
FRONTEND_URL=http://localhost:4200
NODE_ENV=development

# ============ SMTP para notificaciones ============
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-aplicacion
SMTP_FROM=noreply@shieldtrack.com

# ============ FILE STORAGE ============
UPLOADS_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB en bytes

# ============ LOGGING ============
LOG_LEVEL=debug
```

#### 3. Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Crear/actualizar ambiente
# El archivo environment.ts ya está configurado para desarrollo
```

**Archivo `environment.ts`:**

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

#### 4. Inicializar Base de Datos

```bash
cd backend

# (Opcional) Cargar datos de prueba
npm run seed:test

# Iniciar servidor en modo desarrollo
npm run start:dev
```

#### 5. Inicializar Frontend

```bash
cd frontend
npm start
# Abre http://localhost:4200 automáticamente
```

### Solución de Problemas

**Puerto 3000 o 4200 en uso:**
```bash
# Windows: Buscar proceso
netstat -ano | findstr :3000

# Linux/Mac: Buscar proceso
lsof -i :3000

# Cambiar puerto en backend:
npm start -- --port 3001
```

**MongoDB no conecta:**
```bash
# Verificar que MongoDB está corriendo
# Windows:
net start MongoDB

# Linux/Mac:
brew services start mongodb-community
```

**Error de módulos faltantes:**
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## 🏗️ Arquitectura del Sistema

### Modelo de Datos Multi-Tenant

```
┌──────────────────────────────────────────────────────────────────┐
│                     Cliente (Tenant)                             │
│  - ID, nombre, industria, isActive                               │
│  - Multi-tenant lógico (NO database-per-tenant)                  │
└────────────────────┬─────────────────────────────────────────────┘
                     │ 1:N
                     │
        ┌────────────┴──────────────┐
        │                           │
        │                           │
┌───────▼──────────┐       ┌────────▼──────────┐
│      Área        │       │     Proyecto      │
│  - clientId (FK) │       │  - clientId (FK)  │
│  - nombre        │◄──────┤  - areaId (FK)    │
└──────────────────┘  1:N  │  - serviceArch    │
                            │  - projectStatus  │
                            │  - retestPolicy   │
                            └────────┬──────────┘
                                     │ 1:N
                                     │
                            ┌────────▼──────────┐
                            │     Hallazgo      │
                            │  - projectId (FK) │
                            │  - code           │
                            │  - severity       │
                            │  - status         │
                            │  - retestIncluded │
                            │  - closeReason    │
                            └────────┬──────────┘
                                     │ 1:N
                                     │
                            ┌────────▼──────────┐
                            │  FindingUpdate     │
                            │  - findingId (FK) │
                            │  - type           │
                            │  - content        │
                            │  - createdBy      │
                            │  - timestamps     │
                            └────────────────────┘
```

### Stack Tecnológico

**Backend:**
- **NestJS** 10.x - Framework Node.js modular
- **MongoDB** 6.x - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación sin estado
- **Nodemailer** - Envío de emails
- **@nestjs/schedule** - Cron jobs
- **Swagger** - Documentación de API

**Frontend:**
- **Angular** 20.x - Framework modular
- **Angular Material** - Componentes UI
- **RxJS** - Programación reactiva
- **TypeScript** - Lenguaje tipado
- **Signals** - State management moderno

**DevOps:**
- **Docker** (opcional) - Containerización
- **Git** - Control de versiones
- **PowerShell/Bash** - Scripts de automatización

### Roles y Permisos

| Rol | Clientes | Proyectos | Hallazgos | Auditoría | Usuarios | Config |
|-----|----------|-----------|-----------|-----------|----------|--------|
| **OWNER** | RW | RW | RW | RW | RW | RW |
| **PLATFORM_ADMIN** | R | - | - | RW | RW | RW |
| **CLIENT_ADMIN** | R | RW | RW | R | RW (assigned) | RW |
| **AREA_ADMIN** | R | R | RW | R | RW (assigned) | - |
| **ANALYST** | R | R | RW | R | - | - |
| **VIEWER** | R | R | R | - | - | - |

### Estructura de Directorios

```
ShieldTrack/
├── backend/
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── modules/
│   │   │   ├── auth/              # Autenticación y autorización
│   │   │   ├── clients/           # Gestión de clientes (tenants)
│   │   │   ├── areas/             # Gestión de áreas
│   │   │   ├── projects/          # Gestión de proyectos
│   │   │   ├── findings/          # Gestión de hallazgos
│   │   │   ├── audit/             # Logs de auditoría
│   │   │   ├── export/            # Exportación de datos
│   │   │   ├── system-config/     # Configuración del sistema
│   │   │   └── retest-scheduler/  # Cron jobs de retesting
│   │   ├── common/                # Guards, interceptores, excepciones
│   │   └── uploads/               # Almacenamiento de evidencias
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.routes.ts
│   │   │   ├── app.config.ts
│   │   │   ├── core/              # Servicios y layout compartidos
│   │   │   ├── features/          # Componentes de funcionalidades
│   │   │   ├── shared/            # Componentes reutilizables
│   │   │   └── environment.ts     # Configuración por ambiente
│   │   └── index.html
│   └── package.json
├── docs/                          # Documentación técnica adicional
├── DOCUMENTATION.md               # Este archivo
├── ISSUES.md                      # Issues abiertos y pendientes
├── Promp.txt                      # Prompt original del proyecto
└── package.json
```

---

## 📊 Estado de Implementación

### Funcionalidades Completadas

#### ✅ Modelo Multi-Tenant y Entidades
- Cliente (Tenant) con código único
- Área perteneciente a Cliente
- Proyecto con serviceArchitecture y retestPolicy
- Hallazgo con timeline inmutable
- FindingUpdate para auditoría completa
- Evidence con almacenamiento local

#### ✅ Proyecto (Unidad Contractual)
- Enum serviceArchitecture (CLOUD, WEB, FTP, API, ONPREM, HYBRID, OTHER)
- retestPolicy con enabled, nextRetestAt, notify
- projectStatus (ACTIVE, CLOSED, ARCHIVED)
- Cierre automático de hallazgos al cerrar proyecto
- Detención de cron jobs al cerrar

#### ✅ Hallazgos (Findings)
- code (ID operativo humano)
- severity, status, retestIncluded
- closeReason con 6 opciones (FIXED, RISK_ACCEPTED, FALSE_POSITIVE, etc.)
- Desaparecen de vistas operativas al cerrar
- Timeline inmutable de cambios

#### ✅ Retest Scheduler
- Cron job diario con @nestjs/schedule
- Verifica nextRetestAt contra offsetDays
- Envío de emails con Nodemailer
- Integrado con SystemConfigService para SMTP dinámico
- Fallback a variables de entorno

#### ✅ Roles y Permisos (RBAC)
- 6 Roles: OWNER, PLATFORM_ADMIN, CLIENT_ADMIN, AREA_ADMIN, ANALYST, VIEWER
- Guards funcionales en NestJS
- Decoradores @Roles() para endpoints
- Validación en endpoints críticos

#### ✅ Seguridad General
- JWT con @nestjs/jwt y passport
- MFA obligatorio con speakeasy + QR code
- Logs de auditoría con contexto completo
- Guards de autenticación y autorización
- Validación de DTOs con class-validator

#### ✅ Interfaz de Usuario (Desktop)
- Angular 20+ Standalone Components
- Angular Signals para state management
- Material UI con diseño denso
- Vistas Operativas vs Históricas
- Responsive para pantallas >= 1366px
- Branding configurable (favicon, logo, colores)

#### ✅ Funcionalidades Recientes (Jan 2026)
- Backup & Restore UI
- Asignación centralizada de usuarios
- Auditoría integrada con API real
- URLs dinámicas en todos los exports
- Creación de admin inicial al crear tenant
- Sistema de branding completo
- Descarga de hallazgos individual

### Funcionalidades Pendientes o Parciales

Ver archivo [ISSUES.md](ISSUES.md) para detalles completos de trabajo pendiente.

---

## 📝 Changelog

### [1.8.0] - 13 de Enero 2026

#### 🎯 Resumen de Cambios
**Tema:** Consolidación Final - Todas las Funcionalidades Completadas
- 10 tareas completadas de forma secuencial
- Todo lo que falta implementado
- Sistema listo para producción

#### ✨ Nuevas Funcionalidades Completadas

1. **Backup & Restore UI**
   - Ruta `/admin/backup` con componente funcional
   - Integración en menú de administración
   - Backend con mongodump/mongorestore

2. **Asignación Centralizada de Usuarios**
   - Nuevo servicio `UserAssignmentService`
   - Endpoints: POST/GET `/api/auth/users/:id/assignments`
   - Asignación a clientes, proyectos y áreas en una operación

3. **Auditoría Integrada**
   - Endpoint corregido a `/api/audit/logs`
   - UI consumiendo datos reales
   - Filtros por usuario, acción, entidad
   - Paginación completa

4. **Branding Completo**
   - Upload de favicon y logo
   - Campos de respuesta corregidos
   - Integración en UI
   - Cambios reflejados en tiempo real

5. **URLs Dinámicas**
   - 18 instancias de hardcoding reemplazadas
   - Todos los exports usando `environment.apiUrl`
   - Soporte para múltiples ambientes

6. **Creación de Admin Inicial**
   - Dialog de clientes con 2 tabs
   - Tab de "Admin Inicial" con email, nombre, contraseña
   - Validación de formulario
   - Integración con backend

7. **RetestScheduler SMTP**
   - Integrado con SystemConfigService
   - Fallback a variables de entorno
   - Configuración dinámica en tiempo real

8. **Navegación Mejorada**
   - Links agregados a Backup y Branding
   - Menú de administración completo
   - Accesibilidad mejorada

#### 🔧 Cambios Técnicos

**Backend:**
- `user-assignment.service.ts` (NEW - 180 líneas)
- `auth.controller.ts` - Nuevos endpoints de asignación
- `auth.module.ts` - Registro de UserAssignmentService
- `audit.controller.ts` - Prefijo corregido a `/api/audit`
- `retest-scheduler.service.ts` - Integración SystemConfigService
- `retest-scheduler.module.ts` - Import de SystemConfigModule

**Frontend:**
- `app.routes.ts` - Ruta `/admin/backup` agregada
- `main-layout.component.ts` - Menú actualizado
- `audit-log.component.ts` - Reescrito para API real
- `client-dialog.component.ts` - Rediseño completo con 2 tabs
- `branding.service.ts` - Nombres de campos corregidos
- `branding-config.component.ts` - Manejo de respuestas actualizado
- `project-list.component.ts` - URL dinámica
- `finding-wizard.component.ts` - 3 URLs dinámicas
- `finding-detail.component.ts` - 14 URLs dinámicas
- `project-detail.component.ts` - 2 URLs dinámicas

### [1.7.0] - 14 de Enero 2025

#### 🎯 Resumen de Cambios
**Tema:** Implementación Real de UI para Funcionalidades Parcialmente Completadas
- Completamiento de 4 componentes UI críticos
- Integración de 3 features anteriormente backend-only
- Reemplazo de lista de usuarios antigua con versión mejorada
- Adición de descarga de hallazgos individual

#### ✨ Nuevas Funcionalidades

**UserListImprovedComponent - Gestión Avanzada de Usuarios**
- Tabla responsive con búsqueda y filtros avanzados
- Quick-Actions de 1-Click (Asignar, Bloquear, Desbloquear)
- Menú contextual con opciones completas
- Iconografía por rol y color-coding de estado

**UserAssignmentDialogComponent - Asignación Centralizada**
- Modal con 3 tabs: Clientes, Proyectos, Áreas
- Multi-select con search y filter
- Summary de seleccionados
- Integración con backend

**TenantBrandingConfigComponent - Branding Accesible**
- Nueva ruta `/admin/tenant-config`
- Tabs: Info básica, Favicon/Logo, Colores
- Upload con preview inmediata
- Sincronización con localStorage

**FindingDownloadButtonComponent - Descargas Individuales**
- Componente reutilizable de descarga
- Formatos: CSV, PDF, JSON
- Menú de contexto
- Copia al portapapeles
- Error handling completo

---

## 📖 Guía de Nuevos Componentes

### Agregar Nuevo Módulo Backend

```typescript
// 1. Crear carpeta en src/modules/mi-modulo/
// 2. Crear archivos:
//    - mi-modulo.module.ts
//    - mi-modulo.service.ts
//    - mi-modulo.controller.ts

// 3. Registrar en app.module.ts
import { MiModuloModule } from './modules/mi-modulo/mi-modulo.module';

@Module({
  imports: [MiModuloModule],
})
export class AppModule {}

// 4. Definir DTOs con validación
import { IsString, IsOptional } from 'class-validator';

export class CreateMiEntidadDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
```

### Agregar Nuevo Componente Frontend

```typescript
// 1. Crear carpeta en src/app/features/mi-feature/
// 2. Usar Angular CLI
ng generate component features/mi-feature/mi-componente --standalone

// 3. Configurar en app.routes.ts
export const routes: Routes = [
  {
    path: 'mi-feature',
    loadComponent: () =>
      import('./features/mi-feature/mi-feature.component').then(
        m => m.MiFeatureComponent
      )
  }
];

// 4. Usar Signals para state
import { signal } from '@angular/core';

export class MiComponente {
  items = signal<Item[]>([]);

  loadItems() {
    this.apiService.get('/items').subscribe(
      data => this.items.set(data),
      error => console.error(error)
    );
  }
}
```

### Estructura de Componentes Angular

**Standalone Component:**
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `<button mat-raised-button>Click me</button>`
})
export class MiComponenteComponent {}
```

**Servicio con API:**
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class MiServicio {
  private apiUrl = `${environment.apiUrl}/mi-endpoint`;

  constructor(private http: HttpClient) {}

  getItems() {
    return this.http.get<Item[]>(this.apiUrl);
  }
}
```

---

## 📞 Información de Créditos

**ShieldTrack** - Sistema de gestión de hallazgos de ciberseguridad
- **Licencia:** BSL 1.1
- **Estado:** En desarrollo activo
- **Última actualización:** 13 de Enero 2026

### Documentos de Referencia

- 📖 [ISSUES.md](ISSUES.md) - Pendientes y bugs abiertos
- 📖 [Promp.txt](Promp.txt) - Prompt original del sistema
- 📖 [docs/architecture.md](docs/architecture.md) - Detalles técnicos profundos

---

**Última actualización:** 13 de Enero 2026
**Próxima revisión:** Cuando se completen nuevas funcionalidades principales
