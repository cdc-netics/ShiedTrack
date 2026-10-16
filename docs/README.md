# Documentación de ShieldTrack

Índice de la documentación. Cada tema tiene un único documento de referencia; los demás enlazan a él en lugar de repetirlo.

## Instalar y operar

| Documento | Para quién | Contenido |
| --- | --- | --- |
| [SETUP.md](SETUP.md) | Desarrolladores | Instalación con Docker y desarrollo local con recarga en caliente |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Infraestructura / DevOps | Topología, variables de entorno, despliegue manual y con Jenkins, checklist de producción |
| [OPERATIONS.md](OPERATIONS.md) | Operación / administradores | Configuración inicial, actualizaciones, respaldos y restauración, usuarios, rotación de secretos, tareas programadas |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Todos | Problemas frecuentes y su solución |
| [DEVELOPMENT-CREDENTIALS.md](DEVELOPMENT-CREDENTIALS.md) | Desarrollo / QA | Seeds y usuarios de prueba |

## Referencia técnica

| Documento | Contenido |
| --- | --- |
| [architecture.md](architecture.md) | Componentes, módulos, modelo de datos, flujos, seguridad y limitaciones conocidas |
| [MULTI-TENANCY.md](MULTI-TENANCY.md) | Aislamiento por tenant y compatibilidad legacy |
| [RBAC-PERMISSIONS-MATRIX.md](RBAC-PERMISSIONS-MATRIX.md) | Roles y permisos |
| [API.md](API.md) | Convenciones HTTP; el detalle por endpoint está en Swagger (`/api/docs`) |

## Calidad

| Documento | Contenido |
| --- | --- |
| [TESTING-GUIDE.md](TESTING-GUIDE.md) | Suite P0 (Postman/Newman) y regresiones QA |
| [ShieldTrack-P0-Tests.postman_collection.json](ShieldTrack-P0-Tests.postman_collection.json) | Colección Postman |
| [QA-CORRECTIONS-2026-10.md](QA-CORRECTIONS-2026-10.md) | Correcciones de los ciclos QA de octubre 2026 y su aceptación pendiente |

## Seguimiento (raíz del repositorio)

- [ISSUES.md](../ISSUES.md): backlog de bugs y mejoras.
- [CHANGELOG.md](../CHANGELOG.md): historial de cambios.
- [CONTRIBUTING.md](../CONTRIBUTING.md): flujo de trabajo y convenciones.

## Reglas de mantenimiento

1. Todo cambio en variables de entorno, puertos o volúmenes se refleja en `.env.example`, [DEPLOYMENT.md](DEPLOYMENT.md) y, si afecta la operación, en [OPERATIONS.md](OPERATIONS.md).
2. Todo cambio funcional relevante se registra en `CHANGELOG.md`.
3. Los comandos documentados deben funcionar en Linux (bash). Si un paso difiere en Windows, se indica la variante en la misma línea.
4. No se versionan logs, salidas de pruebas, scripts personales ni configuración de asistentes IA (`CLAUDE.md`, `.claude/`, `Skills/`).
