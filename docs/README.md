# Documentacion ShieldTrack

Este archivo es el indice maestro de documentacion. Si hay duplicados o contradicciones, esta tabla define la fuente canonica.

## Fuentes canonicas

| Tema | Documento canonico | Estado |
| --- | --- | --- |
| Inicio del proyecto y mapa general | ../README.md | Activo |
| Instalacion y entorno local/docker | SETUP.md | Activo |
| Despliegue y variables de entorno | DEPLOYMENT.md | Activo |
| Credenciales de desarrollo | DEVELOPMENT-CREDENTIALS.md | Activo |
| API y contratos HTTP | API.md | Activo |
| Arquitectura y modelo de datos | architecture.md | Activo |
| Multi-tenancy y alcance | MULTI-TENANCY.md | Activo |
| Matriz RBAC resumida | RBAC-PERMISSIONS-MATRIX.md | Activo |
| Pruebas QA P0 | TESTING-GUIDE.md | Activo |
| Backlog de producto y bugs | ../ISSUES.md | Activo |
| Historial de cambios | ../CHANGELOG.md | Activo |
| Material historico / referencia | archive/Promp.txt | Archivo |

## Reglas de mantenimiento

1. No duplicar contenido entre documentos. Se enlaza al canonico.
2. `ISSUES.md` canonico es el de la raiz del repositorio.
3. Los documentos en `docs/archive/` son historicos y no deben usarse como fuente de implementacion nueva.
4. Cualquier cambio funcional relevante debe reflejarse tambien en `../CHANGELOG.md`.

## Estructura recomendada de lectura

1. `../README.md` para contexto general.
2. `SETUP.md` para arrancar el entorno.
3. `DEPLOYMENT.md` para variables, compose y produccion.
4. `API.md` + Swagger para contratos de backend.
5. `RBAC-PERMISSIONS-MATRIX.md` y `MULTI-TENANCY.md` para reglas de acceso y alcance.
6. `../ISSUES.md` para estado de trabajo y pendientes.

## Nota de orden

La documentacion operativa (`SETUP` y `TROUBLESHOOTING`) se mantiene dentro de `docs/` para evitar dispersion en la raiz del repositorio.
