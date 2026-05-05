# 🔒 ShieldTrack

Sistema de gestión de hallazgos de ciberseguridad para reemplazar Excel. Plataforma SOC/MSSP con arquitectura multi-tenant real.

[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-blue.svg)](LICENSE)
[![Status: Development](https://img.shields.io/badge/Status-Development-orange.svg)](ISSUES.md)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-green.svg)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-20.x-red.svg)](https://angular.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-green.svg)](https://www.mongodb.com/)

---

## 🎯 Propósito del Sistema

ShieldTrack centraliza el ciclo completo de gestión de hallazgos: registro, asignación, evidencia, seguimiento, retest y auditoría. Diseñado para analistas de SOC, pentesters y equipos de QA que requieren un flujo trazable, seguro y profesional.

### 🧩 Características Principales
- **Aislamiento Multi-Tenant**: Separación lógica de datos por cliente/organización.
- **RBAC Granular**: 6 niveles de roles (Owner, Analyst, Viewer, etc.).
- **Timeline Inmutable**: Historial completo de cambios para auditoría (SOC2/ISO27001).
- **Retest Automatizado**: Programación de notificaciones y seguimiento de correcciones.
- **Evidencias Seguras**: Almacenamiento protegido y descarga controlada por JWT.

---

## 📚 Mapa de Documentación

| Documento | Contenido |
| :--- | :--- |
| 🚀 **[SETUP.md](SETUP.md)** | Instalación: `.env` en la raíz vs `backend/.env`, puertos, Mongo, seeds y troubleshooting. |
| 🚢 **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** | Compose, autenticación Mongo (`MONGO_INITDB_*`, `MONGODB_URI`), CORS, seeds con `docker compose exec`, checklist de producción. |
| 🔐 **[docs/DEVELOPMENT-CREDENTIALS.md](docs/DEVELOPMENT-CREDENTIALS.md)** | Usuarios y contraseñas de prueba (seed / login dev); no usar en producción. |
| 🌐 **[docs/API.md](docs/API.md)** | Prefijo `/api`, Swagger, JWT, validación y cabeceras. |
| 🏢 **[docs/MULTI-TENANCY.md](docs/MULTI-TENANCY.md)** | Tenant, áreas y compatibilidad legacy (fuente canónica). |
| 🏗️ **[docs/architecture.md](docs/architecture.md)** | Modelo de datos, flujos y decisiones técnicas. |
| 🧪 **[docs/TESTING-GUIDE.md](docs/TESTING-GUIDE.md)** | Suite P0, Postman/Newman y validación manual. |
| 📜 **[docs/archive/Promp.txt](docs/archive/Promp.txt)** | Especificación funcional maestra (único archivo en `docs/archive/`). |
| 🐛 **[ISSUES.md](ISSUES.md)** | Bugs, mejoras y backlog. |
| 📝 **[CHANGELOG.md](CHANGELOG.md)** | Historial de versiones. |

---

## Inicio rápido (Docker — recomendado)

**Requisitos:** Docker y Docker Compose (`docker compose`).

1. En la **raíz del repo**, copie **`.env.example`** → **`.env`**.
2. Defina al menos un **`JWT_SECRET`** fuerte. Revise **MongoDB**: `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD` y **`MONGODB_URI`** deben coincidir (host del servicio en Compose: **`mongodb`**). Ajuste **`BACKEND_PORT`**, **`FRONTEND_PORT`** y **`MONGO_PORT`** si hay conflictos de puertos.
3. Arranque:

```bash
npm start
```

Otros scripts: `npm run start:detached`, `npm run stop`.

**URLs** (los puertos salen de su `.env`; por defecto `BACKEND_PORT=3000`, `FRONTEND_PORT=80`):

| Qué | Dónde |
|-----|--------|
| App web | `http://localhost` o `http://localhost:<FRONTEND_PORT>` |
| API / Swagger | `http://localhost:<BACKEND_PORT>/api/docs` |

Usuarios de prueba (tras seeds): [docs/DEVELOPMENT-CREDENTIALS.md](docs/DEVELOPMENT-CREDENTIALS.md). Guía paso a paso y problemas frecuentes: [SETUP.md](SETUP.md). Variables, Compose y producción: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Antes de un despliegue real, revise el checklist de **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** (`JWT_SECRET`, CORS, `NODE_ENV`, Mongo).

### Desarrollo en el host (sin Docker)

Si necesita Node y Mongo instalados localmente:

```bash
# Windows (PowerShell)
npm run start:local:win

# Linux / macOS
npm run start:local:unix
```

Detalle y variables: [SETUP.md](SETUP.md).



---

## 🏗️ Arquitectura de Referencia

- **Backend**: NestJS + MongoDB (Mongoose) + JWT Auth + MFA.
- **Frontend**: Angular 20 (Standalone Components) + Signals (State Management).
- **Arranque**: Compose como flujo principal; scripts opcionales `.ps1` / `.sh` solo para desarrollo local sin contenedores.

---

## 📄 Licencia

**Business Source License 1.1**
---

**ShieldTrack Team** | 2026
