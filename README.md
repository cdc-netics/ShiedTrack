# 🔒 ShieldTrack

Sistema de gestión de hallazgos de ciberseguridad para reemplazar Excel. Plataforma SOC/MSSP con arquitectura multi-tenant.

[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-blue.svg)](LICENSE)
[![Status: Development](https://img.shields.io/badge/Status-Development-orange.svg)](ISSUES.md)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)
[![Angular](https://img.shields.io/badge/Angular-18.x-red.svg)](https://angular.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)

## ⚠️ Estado del Proyecto

**🚧 EN DESARROLLO - NO LISTO PARA PRODUCCIÓN**

Este proyecto se encuentra en fase de desarrollo activo. Aunque las funcionalidades principales están implementadas, existen pendientes críticos de configuración, UX y seguridad operativa.

👉 Ver **[ISSUES.md](ISSUES.md)** para el detalle de pendientes y bugs conocidos.
👉 Ver **[IMPLEMENTACION.md](IMPLEMENTACION.md)** para el estado actual de cada módulo.

## 🚀 Inicio Rápido

Para instalar y ejecutar el proyecto, sigue la guía detallada:

👉 **[GUÍA DE INSTALACIÓN (SETUP.md)](SETUP.md)**

### Resumen de Comandos

```bash
# Backend (Terminal 1)
cd backend
npm install
npm run seed:test    # (Opcional) Cargar datos de prueba iniciales
npm run start:dev

# Frontend (Terminal 2)
cd frontend
npm install
npm start
```

## 📚 Documentación

- 📖 **[SETUP.md](SETUP.md)**: Guía de instalación, configuración y solución de problemas.
- 📊 **[IMPLEMENTACION.md](IMPLEMENTACION.md)**: Estado detallado de la implementación técnica.
- 🐛 **[ISSUES.md](ISSUES.md)**: Reporte de bugs, deuda técnica y funcionalidades faltantes.
- 🏗️ **[docs/architecture.md](docs/architecture.md)**: Arquitectura, modelo de datos y reglas de negocio.
- 🧪 **[docs/TESTING-GUIDE.md](docs/TESTING-GUIDE.md)**: Guía de pruebas.
- 📂 **[docs/archive/](docs/archive/)**: Reportes de auditoría y documentos históricos.

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

### Frontend (Angular 17+ Standalone)
Aplicación SPA con Angular 17, Standalone Components y Signals para gestión de estado.
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
