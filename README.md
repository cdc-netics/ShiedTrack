# 🔒 ShieldTrack

Sistema de gestión de hallazgos de ciberseguridad para reemplazar Excel. Plataforma SOC/MSSP con arquitectura multi-tenant real.

[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-blue.svg)](LICENSE)
[![Status: Development](https://img.shields.io/badge/Status-Development-orange.svg)](ISSUES.md)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-green.svg)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-20.x-red.svg)](https://angular.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green.svg)](https://www.mongodb.com/)

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

Para una navegación eficiente, consulta los documentos especializados:

| Documento | Contenido |
| :--- | :--- |
| 🚀 **[SETUP.md](SETUP.md)** | Guía de instalación rápida y solución de problemas. |
| 🏗️ **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | Detalles técnicos, modelos y guías de desarrollo. |
| 🐛 **[ISSUES.md](ISSUES.md)** | Estado de bugs, mejoras pendientes y backlog técnico. |
| 📝 **[CHANGELOG.md](CHANGELOG.md)** | Historial detallado de cambios y versiones. |

---

## 🚀 Inicio Rápido

```bash
# Iniciar todo el sistema (Windows)
npm start

# Iniciar todo el sistema (Linux/Mac)
npm run start:linux
```

---

## 🏗️ Arquitectura de Referencia

- **Backend**: NestJS + MongoDB (Mongoose) + JWT Auth + MFA.
- **Frontend**: Angular 20 (Standalone Components) + Signals (State Management).
- **Scripts**: Automatización disponible vía PowerShell (`.ps1`) y Bash (`.sh`).

---

## 📄 Licencia

**Business Source License 1.1**
---

**ShieldTrack Team** | 2026
