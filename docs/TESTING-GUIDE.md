# 🚀 Guía de Ejecución - Suite QA P0

## 📋 Prerequisitos

- Node.js 24.x (o la versión indicada en el proyecto) y npm
- MongoDB corriendo en `localhost:27017`
- Backend ShieldTrack compilado
- Postman instalado (o Newman para CLI)

---

## ⚙️ Setup Inicial

### 1. Instalar dependencias (si no lo has hecho)

```bash
cd backend
npm install
```

### 2. Crear base de datos de test

```bash
# Seed data con usuarios, clientes, proyectos y hallazgos
npm run seed:test
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
npm install -g newman

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
npm install
```

### Error: "ECONNREFUSED mongodb://localhost:27017"

```bash
# Iniciar MongoDB
mongod --dbpath=/data/db
# O con Docker:
docker run -d -p 27017:27017 mongo:8
```

### Tests fallan con 401 Unauthorized

- Verificar que backend está corriendo: `npm run start:dev`
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
npm run seed:test

# 3. Re-ejecutar Postman/Newman
newman run docs/ShieldTrack-P0-Tests.postman_collection.json ...
```

---

## 📞 Referencias

- Especificación funcional maestra: [archive/Promp.txt](archive/Promp.txt)
- Arquitectura y multi-tenant: [architecture.md](architecture.md), [MULTI-TENANCY.md](MULTI-TENANCY.md)

---

**Última actualización:** 2026-05-04
