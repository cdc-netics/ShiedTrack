# 🚀 Guía de Ejecución - Suite QA P0

## 📋 Prerequisitos

- Node.js 24.x (o la versión indicada en el proyecto) y pnpm
- MongoDB corriendo en `localhost:27017`
- Backend ShieldTrack compilado
- Postman instalado (o Newman para CLI)

---

## ⚙️ Setup Inicial

### 1. Instalar dependencias (si no lo has hecho)

```bash
cd backend
pnpm install
```

### 2. Crear base de datos de test

```bash
# Seed data con usuarios, clientes, proyectos y hallazgos
pnpm run seed:test
```

**Output esperado:**
```
🌱 Iniciando seed de datos de prueba P0...
✅ Conectado a MongoDB
✅ 6 usuarios creados (password: Password123!)
✅ Proyecto ACME: 674a1b2c3d4e5f6789012345
✅ Seed completado exitosamente!
```

Copia los IDs generados para configurar Postman.

---

## 🧪 Ejecución de Tests

### Opción A: Postman UI (Manual)

1. **Importar Collection:**
   - Abrir Postman
   - `File` → `Import` → Seleccionar `docs/ShieldTrack-P0-Tests.postman_collection.json`

2. **Configurar Variables:**
   - Click derecho en la collection → `Edit`
   - Tab `Variables`
   - Configurar:
     ```
     base_url: http://localhost:3000
     test_project_id: <copiar del seed output>
     other_client_finding_id: <copiar del seed output>
     ```

3. **Ejecutar:**
   - Click en la collection → `Run`
   - Seleccionar todos los requests
   - Click `Run ShieldTrack - Suite P0`

4. **Validar Resultados:**
   - ✅ Verde: Test pasó
   - ❌ Rojo: Test falló (BLOCKER para deploy)

---

### Opción B: Newman CLI (Automatizado)

```bash
# Instalar Newman globalmente
pnpm add -g newman

# Ejecutar suite completa
newman run docs/ShieldTrack-P0-Tests.postman_collection.json \
  --env-var "base_url=http://localhost:3000" \
  --env-var "test_project_id=674a1b2c3d4e5f6789012345" \
  --env-var "other_client_finding_id=674b2c3d4e5f6789012346" \
  --reporters cli,json \
  --reporter-json-export results/newman-report.json
```

**Output esperado:**
```
┌─────────────────────────┬────────────┬────────────┐
│                         │   executed │     failed │
├─────────────────────────┼────────────┼────────────┤
│              iterations │          1 │          0 │
├─────────────────────────┼────────────┼────────────┤
│                requests │         12 │          0 │
├─────────────────────────┼────────────┼────────────┤
│            test-scripts │         24 │          0 │
├─────────────────────────┼────────────┼────────────┤
│      assertions         │         32 │          0 │
└─────────────────────────┴────────────┴────────────┘
```

**Criterio de aprobación:** `failed = 0`

---

## 🔍 Checklist de Validación Manual

Después de ejecutar la suite automatizada, validar **manualmente**:

### 1. RBAC + IDOR (5 min)

- [ ] Login como VIEWER → Intentar crear finding → 403 Forbidden ✅
- [ ] Login como ANALYST → Crear finding → 201 Created ✅
- [ ] Login como CLIENT_ADMIN de ACME → Acceder a finding de Evil Corp → 404 ✅
- [ ] Login como ANALYST → Intentar hard delete → 403 Forbidden ✅
- [ ] Login como OWNER → Hard delete → 200 OK ✅

### 2. Operativo vs Histórico (3 min)

- [ ] Vista Operativo: Solo hallazgos con status != CLOSED ✅
- [ ] Cerrar hallazgo → Desaparece de Operativo ✅
- [ ] Vista Histórico: Hallazgo cerrado aparece ✅
- [ ] Cerrar proyecto → Todos sus hallazgos pasan a CLOSED ✅

### 3. Retest Scheduler (5 min - requiere manipular fecha)

- [ ] Proyecto con retest habilitado + offsetDays [3,1] ✅
- [ ] Cron job detecta próximo retest ✅
- [ ] Email enviado 3 días antes con lista de findings ✅
- [ ] Solo findings con retestIncluded=true en el email ✅
- [ ] Cerrar proyecto → retestPolicy.enabled = false ✅
- [ ] Cron job omite proyecto cerrado ✅

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@nestjs/mongoose'"

```bash
cd backend
pnpm install
```

### Error: "ECONNREFUSED mongodb://localhost:27017"

```bash
# Iniciar MongoDB
mongod --dbpath=/data/db
# O con Docker:
docker run -d -p 27017:27017 mongo:8
```

### Tests fallan con 401 Unauthorized

- Verificar que backend está corriendo: `pnpm run start:dev`
- Verificar que tokens se generan en paso "Login Users"
- Revisar logs: `backend/logs/app.log`

### Finding de otro tenant/cliente es accesible (CRITICAL)

**🔴 BLOCKER — no desplegar**

Revisar filtros por contexto de tenant/área en `finding.service.ts`, guards y asignación de usuario. Corregir en código y añadir prueba de regresión; no depender de números de línea fijos.

### Scheduler envía correos a proyectos cerrados

**🔴 BLOCKER — no desplegar**

Revisar el cierre de proyecto en `project.service.ts` (p. ej. `retestPolicy.enabled = false` al pasar a cerrado) y el job en `retest-scheduler.service.ts`.

---

## 📊 Reporte de Resultados

Después de ejecutar la suite:

### ✅ Estado: PASS (100% tests OK)

**Deploy autorizado** si:
- 0 tests fallan
- 0 errores CRÍTICOS en logs
- Validación manual completa

### ❌ Estado: FAIL

**NO DEPLOY** si:
- Algún test P0 falla
- IDOR multi-tenant falla
- Scheduler no se detiene al cerrar proyecto
- MFA no es obligatorio para admins

---

## 📝 Logs a Revisar

```bash
# Backend logs
tail -f backend/logs/app.log

# MongoDB queries
mongo shieldtrack-test --eval "db.setLogLevel(2)"

# Newman report (si usaste CLI)
cat results/newman-report.json | jq '.run.stats'
```

---

## 🔄 Re-ejecutar Tests

Para limpiar y volver a ejecutar:

```bash
# 1. Limpiar DB test
mongo shieldtrack-test --eval "db.dropDatabase()"

# 2. Re-seed
pnpm run seed:test

# 3. Re-ejecutar Postman/Newman
newman run docs/ShieldTrack-P0-Tests.postman_collection.json ...
```

---

## 📞 Referencias

- Especificación funcional maestra: [archive/Promp.txt](archive/Promp.txt)
- Arquitectura y multi-tenant: [architecture.md](architecture.md), [MULTI-TENANCY.md](MULTI-TENANCY.md)

---

**Última actualización:** 2026-05-04

## Regresión de ciclos QA de octubre de 2026

La [matriz QA-202610-01 a QA-202610-10](QA-CORRECTIONS-2026-10.md#aceptación-pendiente-en-qa) contiene los casos manuales por rol. El último resultado local fue de 35 pruebas aprobadas; el despliegue y la aceptación remota siguen pendientes.

Desde backend, con dependencias ya instaladas:

~~~powershell
pnpm exec tsc --noEmit
pnpm exec jest --runInBand --runTestsByPath src/modules/export/qa-regressions.spec.ts src/modules/export/export.service.spec.ts src/common/rbac/rbac-policy.spec.ts
~~~

Desde frontend: pnpm exec ng build --configuration development. Estos comandos permiten repetir las comprobaciones; la ejecución final registrada de Jest utilizó JavaScript compilado completo debido a demoras de ts-jest. Ver la evidencia y límites en el registro enlazado. Las pruebas con modelos simulados no requieren MongoDB; los casos manuales sí requieren el stack desplegado. No publicar cachés de Jest ni salidas temporales de compilación como código fuente.

## Recuperación de contraseña (M16)

**Estado:** función corregida, registrada el 2026-10-15. No se ejecutó una nueva prueba de correo en esta actualización.

1. Solicitar recuperación desde el login con un usuario activo y comprobar entrega del código con SMTP válido.
2. Rechazar un código incorrecto o expirado y una contraseña débil.
3. Restablecer con código válido y contraseña fuerte; comprobar acceso con la nueva contraseña.
4. Comprobar que el código utilizado no se reutiliza y que la contraseña anterior deja de funcionar.

Las 35 pruebas del ciclo QA no cubren M16. Ver [issue oficial](../ISSUES.md).

## QA-202610-11 — Áreas para pentester

1. Verificar acceso a Áreas desde el menú con PENTESTER, sin habilitar Usuarios.
2. Crear un área, editar nombre/prefijo/configuración, desactivar y reactivar. Sin tenant fijo, seleccionar explícitamente el cliente de creación.
3. Eliminar un área de prueba con confirmación; verificar que no se promete ni ejecuta eliminación de sus proyectos o asignaciones.
4. Con tenant fijo, intentar editar/borrar un área de otro cliente y verificar rechazo o recurso no encontrado.
5. Como AUDITOR, intentar POST/PUT/DELETE directamente y verificar 403.

Suite automática: backend/src/modules/area/area-permissions.spec.ts. Validación remota después del despliegue pendiente.

Resultado local (2026-10-15): 45 pruebas aprobadas en cuatro suites (10 nuevas de Áreas), compilación TypeScript y build frontend development aprobados. Jest se ejecutó sobre JavaScript compilado con TypeScript; se retiraron la configuración y salida temporales.
