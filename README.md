# 🔒 ShieldTrack

Sistema de gestión de hallazgos de ciberseguridad para reemplazar Excel. Plataforma SOC/MSSP con arquitectura multi-tenant.

[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-blue.svg)](LICENSE)
[![Status: Development](https://img.shields.io/badge/Status-Development-orange.svg)](ISSUES.md)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)
[![Angular](https://img.shields.io/badge/Angular-20.x-red.svg)](https://angular.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)

## ⚠️ Estado del Proyecto

**⚠️ EN DESARROLLO / NO LISTO PARA PRODUCCIÓN**

Este proyecto está en desarrollo activo y aún presenta issues abiertos (ver `ISSUES.md`).  
No se recomienda su uso en producción hasta resolver los pendientes críticos y completar la validación QA.

## 🎯 Sentido de la aplicación

ShieldTrack existe para reemplazar planillas y flujos informales en la gestión de hallazgos. Centraliza el ciclo completo: registro, asignación, evidencia, seguimiento, cierre y auditoría, con control de acceso por roles y aislamiento por tenant.  
El objetivo es que equipos distintos trabajen con un flujo trazable, seguro y consistente, reduciendo errores operativos y mejorando la visibilidad para decisiones técnicas y de negocio.

Aunque nació para ciberseguridad, es transversal: puede usarse para hallazgos de QA, pentesting, auditorías internas, revisiones de cumplimiento, post‑mortems, verificaciones operativas y cualquier proceso donde se deba documentar, priorizar y cerrar findings con evidencia.

En resumen: es un sistema de gestión de hallazgos reusable por múltiples áreas, no limitado a un dominio específico.

### 🧩 Cómo lo usaría un equipo de QA
- Registrar bugs y hallazgos de pruebas con severidad, estado y evidencia (capturas, logs).
- Asignar responsables, hacer seguimiento y cerrar con motivo/observaciones.
- Usar el historial (timeline) para auditoría y trazabilidad de cambios.
- Separar dominios por **Área** (por ejemplo: Frontend, Backend, Mobile) y limitar visibilidad por rol.

### 🧪 Cómo lo usaría un pentester / equipo de ciber
- Registrar hallazgos con severidad y evidencias técnicas, y controlar su ciclo de vida.
- Aplicar retest para validar correcciones y medir cumplimiento.
- Exportar por proyecto/cliente y mantener auditoría de cambios.

### 🏢 Separación por tenant y áreas
- **Tenant**: separa clientes u organizaciones (multi-tenant real).
- **Áreas**: separa dominios internos (QA vs Ciber, o por sistemas/áreas de negocio).
- Los usuarios solo ven lo que corresponde a su tenant y área, evitando cruces de información.

## 📚 Documentación

**¿No sabes dónde empezar?** → Ver **[INDEX.md](INDEX.md)** para guía de documentos

👉 **[DOCUMENTATION.md](DOCUMENTATION.md)** - Documentación completa (instalación, arquitectura, estado de funcionalidades)
👉 **[SETUP.md](SETUP.md)** - Guía de instalación rápida (5 minutos)
👉 **[ISSUES.md](ISSUES.md)** - Reportes de bugs y mejoras futuras

## 🚀 Inicio Rápido

```bash
# Terminal 1: Backend
cd backend && npm install && npm run build && npm start

# Terminal 2: Frontend
cd frontend && npm install && npm start

# Acceder: http://localhost:4200
```

Para más detalles, ver [SETUP.md](SETUP.md) o [DOCUMENTATION.md](DOCUMENTATION.md#-inicio-rápido)

## 🔐 Datos de prueba (modo desarrollo)

Carga los datos de prueba:

```bash
cd backend
npm run seed:test
```

**Credenciales de login de prueba:**
- `admin@shieldtrack.com` / `Admin123!` (Owner Dev)
- `owner@shieldtrack.com` / `Password123!`
- `platformadmin@shieldtrack.com` / `Password123!`
- `clientadmin@acmecorp.com` / `Password123!`
- `areaadmin@acmecorp.com` / `Password123!`
- `analyst@shieldtrack.com` / `Password123!`
- `viewer@shieldtrack.com` / `Password123!`

## 🔧 Solución de Problemas Comunes

### Error: "Cannot find module './modules/evidence/evidence.module'"

Si obtienes este error al compilar o ejecutar el backend:

```bash
# 1. Asegúrate de tener la última versión del repositorio
git pull origin main

# 2. Reinstala dependencias
cd backend
rm -rf node_modules package-lock.json
npm install

# 3. Compila nuevamente
npm run build
```

**Causa:** El archivo `.gitignore` anteriormente bloqueaba el módulo `evidence`. Esto se corrigió en el commit más reciente.

### Vulnerabilidades de npm

**Estado actual:** 12 vulnerabilidades (5 low, 3 moderate, 4 high)

✅ **Ya corregidas:** 24 de 36 vulnerabilidades (67% reducción)
- diff, fast-xml-parser, AWS SDK, qs: actualizados
- nodemailer 6.9.7 → 8.0.0: vulnerabilidades moderate corregidas

⚠️ **Pendientes:**
- 4 HIGH: glob, tar, webpack (solo dev dependencies, no afectan producción)
- 3 MODERATE: js-yaml, lodash (requieren actualizar NestJS v10 → v11)

Si `npm install` muestra vulnerabilidades:

```bash
# Ver detalles
npm audit

# Las versiones corregidas ya están en package.json
npm install

# Compilar y verificar
npm run build
```

**⚠️ ADVERTENCIA:** NO uses `npm audit fix --force` sin revisar cambios. Las vulnerabilidades restantes requieren breaking changes de NestJS v10 → v11.

## 📋 Características Principales

- ✅ **Multi-Tenant**: Gestión por cliente con aislamiento lógico.
- ✅ **RBAC Completo**: 6 niveles de roles (OWNER, PLATFORM_ADMIN, CLIENT_ADMIN, AREA_ADMIN, ANALYST, VIEWER).
- ✅ **Retest Scheduler**: Cron job automático con notificaciones por email.
- ✅ **Timeline Inmutable**: Auditoría completa de cambios en hallazgos.
- ✅ **MFA Disponible**: MFA con TOTP.
- ✅ **Almacenamiento Seguro**: Evidencias en disco local con descarga protegida por JWT.
- ✅ **Desktop-First**: Optimizado para analistas SOC (pantallas ≥1366px).

## 🏗️ Arquitectura

### Backend (NestJS + MongoDB)
Arquitectura modular con NestJS, Mongoose para MongoDB, y autenticación JWT/MFA.
- **Módulos**: Auth, Client, Area, Project, Finding, Evidence, Retest Scheduler.
- **Seguridad**: Guards, Interceptors, ValidationPipe, Helmet, Rate Limiting.

### Frontend (Angular 20+ Standalone)
Aplicación SPA con Angular 20, Standalone Components y Signals para gestión de estado.
- **UI**: Angular Material con diseño denso.
- **Core**: Servicios y Guards funcionales.

## 📄 Licencia

**Business Source License 1.1**

Este software no es Open Source en el sentido tradicional.
- ✅ Permitido para uso personal, académico y evaluación.
- ❌ **PROHIBIDO** para uso comercial en producción, SaaS o reventa sin licencia comercial.

Ver archivo **[LICENSE](LICENSE)** para términos completos.

## 👥 Contribución

Este es un proyecto empresarial privado. Contactar al equipo para colaboraciones.
