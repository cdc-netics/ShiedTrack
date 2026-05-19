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

## 🚀 Instalación con Docker (Paso a Paso)

ShieldTrack utiliza Docker Compose como método principal de despliegue y desarrollo.
Esta guía permite levantar el sistema completo (Frontend + Backend + MongoDB) en pocos minutos.

✅ Requisitos Previos

Antes de comenzar, asegúrese de tener instalado:

Docker Desktop

Docker Compose

Git


## 📥 1. Clonar el Repositorio

git clone https://github.com/TU-USUARIO/shieldtrack.git

cd shieldtrack

## ⚙️ 2. Configurar Variables de Entorno

Copie el archivo .env.example y renómbrelo a .env:

**En un PowerShell:**

copy .env.example .env

## 🔑 3. Configurar Variables Importantes

Abra el archivo .env y revise especialmente estas variables:

JWT_SECRET=CAMBIAR_POR_UNA_CLAVE_SEGURA

MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password123

MONGODB_URI=mongodb://admin:password123@mongodb:27017/shieldtrack?authSource=admin

BACKEND_PORT=3000
FRONTEND_PORT=80
MONGO_PORT=27017

## 🐳 4. Levantar los Contenedores

En la raíz del proyecto, ejecute: npm start

**Esto iniciará automáticamente:**

Frontend Angular

Backend NestJS

MongoDB

## 📦 5. Scripts Disponibles
**Iniciar en segundo plano**

npm run start:detached

## 🌐 6. Acceder al Sistema
Una vez iniciado correctamente:

Frontend: http://localhost

API Swagger: http://localhost:3000/api/docs

Ingresar al sitio web

## ✅ 7. Verificar Contenedores

Puede validar que todo está funcionando ejecutando:

docker ps

Deberían aparecer contenedores similares a:

shieldtrack-db

shieldtrack-frontend

shieldtrack-backend

Para iniciar con el botón ▶️

---

## 🏗️ Arquitectura de Referencia

- **Backend**: NestJS + MongoDB (Mongoose) + JWT Auth + MFA.
- **Frontend**: Angular 20 (Standalone Components) + Signals (State Management).
- **Arranque**: Compose como flujo principal; scripts opcionales `.ps1` / `.sh` solo para desarrollo local sin contenedores.
- **Contratos frontend/API**: los servicios principales normalizan respuestas de dominio antes de exponerlas a las pantallas. La capa `frontend/src/app/shared/utils/domain-normalizers.ts` mantiene compatibilidad entre campos legacy y canonicos como `mimeType/mimetype`, `filename/originalName`, `tenantId/clientId` y `areaId/areaIds`.

---

## 📄 Licencia

**Business Source License 1.1**
---

**ShieldTrack Team** | 2026
