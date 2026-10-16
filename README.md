# ShieldTrack

Plataforma para gestionar hallazgos de ciberseguridad (pentesting, SOC/MSSP) que reemplaza las planillas Excel. Cubre el ciclo completo de un hallazgo: registro, evidencia, seguimiento, retest, cierre y auditoría, con aislamiento multi-tenant por cliente.

[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-blue.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)
![Angular](https://img.shields.io/badge/Angular-20-red.svg)
![NestJS](https://img.shields.io/badge/NestJS-11-e0234e.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-8-green.svg)

## Funcionalidades

- **Multi-tenant:** cada cliente es un tenant aislado; los datos se dividen en áreas y proyectos.
- **Roles:** OWNER, ADMIN_AREA, PENTESTER, QA y AUDITOR, con alcance por cliente, área y proyecto.
- **Hallazgos:**
  - Códigos correlativos por área (`VULN-2026-000001`).
  - Timeline inmutable de cambios.
  - Cierre individual o masivo.
  - Importación desde CSV/XLSX.
- **Evidencias:** archivos de hasta 100 MB o enlaces externos, con descarga protegida por JWT.
- **Retest:** política por proyecto con avisos automáticos por correo.
- **Exportación:** Excel, CSV, JSON, PDF y ZIP con evidencias.
- **Administración:**
  - Usuarios con recuperación de contraseña por correo (MFA TOTP disponible en la API).
  - Branding y SMTP configurables.
  - Log de auditoría.
  - Respaldos automáticos diarios.

## Arquitectura

```
Navegador ──► frontend (Nginx + Angular 20) ──/api──► backend (NestJS 11) ──► MongoDB 8
               :FRONTEND_PORT                          :BACKEND_PORT          :MONGO_PORT
```

Son tres contenedores en un único `docker-compose.yml`. Nginx sirve la SPA y hace de proxy de `/api` hacia el backend. Evidencias, respaldos y datos de Mongo viven en volúmenes Docker. Detalle completo: [docs/architecture.md](docs/architecture.md).

## Inicio rápido

Requisitos: Docker con Docker Compose v2.

```bash
git clone https://github.com/cdc-netics/ShiedTrack.git
cd ShiedTrack
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
                              # editar JWT_SECRET y contraseñas
docker compose up -d --build
```

| | URL |
| --- | --- |
| Aplicación | http://localhost |
| API (Swagger) | http://localhost:3000/api/docs |

Usuario inicial: `OWNER_SEED_EMAIL` / `OWNER_SEED_PASSWORD` del `.env` (por defecto `admin@shieldtrack.com` / `Admin123!`). Cámbiala en el primer ingreso.

## Documentación

| Necesito… | Documento |
| --- | --- |
| Instalar en mi equipo (Docker o desarrollo local) | [docs/SETUP.md](docs/SETUP.md) |
| Desplegar en un servidor (QA / producción, Jenkins) | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Operar el sistema: configuración inicial, actualizaciones, respaldos, usuarios | [docs/OPERATIONS.md](docs/OPERATIONS.md) |
| Resolver un problema | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |
| Entender cómo está construido | [docs/architecture.md](docs/architecture.md) |
| Ver todo el índice | [docs/README.md](docs/README.md) |

## Estructura del repositorio

```
backend/            API NestJS (src/modules/*, scripts/seeds, scripts/maintenance)
frontend/           SPA Angular + nginx.conf
deploy/             compose-env.sh: genera .env para despliegues automatizados
docs/               Documentación
scripts/            enforce-pnpm.js: bloquea npm/yarn
docker-compose.yml  Stack completo
Jenkinsfile         Pipeline de despliegue a QA
```

El proyecto usa **pnpm** exclusivamente (`npm` y `yarn` están bloqueados).

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md). El backlog está en [ISSUES.md](ISSUES.md) y el historial de cambios en [CHANGELOG.md](CHANGELOG.md).

## Licencia

[Business Source License 1.1](LICENSE)
