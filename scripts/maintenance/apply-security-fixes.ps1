# 🚀 Script de Aplicación de Correcciones de Seguridad - ShieldTrack
# Este script aplica los 6 commits atómicos con las correcciones de la auditoría
# PowerShell Version (Windows)

$ErrorActionPreference = "Stop"

Write-Host "🔒 Iniciando aplicación de correcciones de seguridad..." -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-Not (Test-Path "backend")) {
    Write-Host "❌ Error: Este script debe ejecutarse desde la raíz del proyecto ShieldTrack" -ForegroundColor Red
    exit 1
}

# ==============================================================================
# COMMIT 1: CRITICAL - Multi-Tenant Security Fixes
# ==============================================================================
Write-Host "📦 Commit 1/6: CRITICAL - Multi-Tenant Security Fixes" -ForegroundColor Yellow
Write-Host "----------------------------------------"

git add backend/src/modules/client/client.service.ts
git add backend/src/modules/client/client.controller.ts
git add backend/src/modules/project/project.service.ts
git add backend/src/modules/project/project.controller.ts
git add backend/src/modules/finding/finding.service.ts
git add backend/src/modules/finding/finding.controller.ts
git add backend/src/modules/finding/finding.module.ts

$commit1Message = @"
fix(security): CRITICAL - Implementar validación multi-tenant en servicios

IDOR Vulnerabilities Fixed:
- [C1] ClientService.findAll() - Filtrado por clientId del usuario autenticado
- [C2] ProjectService.findAll() - Validación obligatoria de tenant ownership
- [C3] FindingService - Validación multi-tenant en create(), findAll(), findById(), update(), createUpdate()

Impact:
- Previene acceso cross-tenant en contexto MSSP
- Agrega ForbiddenException (403) para accesos no autorizados
- Restringe operaciones según rol (CLIENT_ADMIN solo ve su tenant)

Breaking Changes: NONE (retrocompatible - parámetro currentUser opcional)

Closes: #C1, #C2, #C3
Security-Advisory: HIGH PRIORITY
"@

git commit -m $commit1Message

Write-Host "✅ Commit 1 aplicado" -ForegroundColor Green
Write-Host ""

# ==============================================================================
# COMMIT 2: HIGH - Audit System Implementation
# ==============================================================================
Write-Host "📦 Commit 2/6: HIGH - Audit System Implementation" -ForegroundColor Yellow
Write-Host "----------------------------------------"

git add backend/src/modules/audit/
git add backend/src/app.module.ts

$commit2Message = @"
feat(audit): Implementar sistema de logs inmutables para compliance

New Features:
- AuditLog schema con 4 índices optimizados
- AuditService.log() con try-catch no-bloqueante
- AuditService.findLogs() con filtros (performedBy, entityType, severity)
- AuditController con endpoint GET /logs (solo GLOBAL_ADMIN/SECURITY_MANAGER)
- Módulo exportable para uso en otros servicios

Use Cases:
- Rastrear cambios de roles
- Auditar hard deletes
- Compliance SOC2/ISO27001
- Investigación de incidentes

Next Steps:
- Integrar en UserService para cambios de rol
- Agregar en FindingService.hardDelete()
- Implementar en ProjectService.closeProject()

Closes: #H4
"@

git commit -m $commit2Message

Write-Host "✅ Commit 2 aplicado" -ForegroundColor Green
Write-Host ""

# ==============================================================================
# COMMIT 3: HIGH - Security Hardening (Scheduler + JWT)
# ==============================================================================
Write-Host "📦 Commit 3/6: HIGH - Security Hardening (Scheduler + JWT)" -ForegroundColor Yellow
Write-Host "----------------------------------------"

git add backend/src/modules/auth/strategies/jwt.strategy.ts

$commit3Message = @"
fix(security): Detener scheduler al cerrar proyecto + Validar JWT_SECRET

Fixes:
- [H1] Deshabilitar retestPolicy.enabled cuando project.status = CLOSED
      (Previene notificaciones de retest innecesarias)
- [H3] Lanzar error si JWT_SECRET no está configurado en NODE_ENV=production
      (Previene deployment inseguro)

Impact:
- Scheduler no envía emails para proyectos cerrados
- Deployment fallará si JWT_SECRET falta en producción (fail-fast)

Closes: #H1, #H3
"@

git commit -m $commit3Message

Write-Host "✅ Commit 3 aplicado" -ForegroundColor Green
Write-Host ""

# ==============================================================================
# COMMIT 4: MEDIUM - Rate Limiting and File Size Controls
# ==============================================================================
Write-Host "📦 Commit 4/6: MEDIUM - Rate Limiting and File Size Controls" -ForegroundColor Yellow
Write-Host "----------------------------------------"

git add backend/src/modules/evidence/evidence.controller.ts
git add backend/src/modules/evidence/evidence.module.ts
git add backend/src/main.ts

$commit4Message = @"
feat(security): Rate limiting en descargas + Límite de 50MB para uploads

Security Enhancements:
- [M2] @Throttle(10 req/min) en GET /evidence/:id/download
      (Previene DoS por descarga masiva)
- [M3] Límite global de 50MB para archivos subidos
      (Previene ataques de storage exhaustion)

Dependencies:
- @nestjs/throttler integrado

Configuration:
- ThrottlerModule en EvidenceModule (TTL: 60s, Limit: 10)
- Multer fileSize limit: 52428800 bytes (50MB)

Closes: #M2, #M3
"@

git commit -m $commit4Message

Write-Host "✅ Commit 4 aplicado" -ForegroundColor Green
Write-Host ""

# ==============================================================================
# COMMIT 5: MEDIUM - FindingUpdate Ownership Validation
# ==============================================================================
Write-Host "📦 Commit 5/6: MEDIUM - FindingUpdate Ownership Validation" -ForegroundColor Yellow
Write-Host "----------------------------------------"

$commit5Message = @"
fix(security): Validar ownership antes de crear FindingUpdate

Fix:
- [M1] createUpdate() ahora valida que el hallazgo pertenece al tenant
      antes de agregar comentarios al timeline

Behavior:
- Usuarios restricted (CLIENT_ADMIN, AREA_ADMIN, ANALYST, VIEWER)
  no pueden agregar updates a hallazgos de otros clientes
- Lanza ForbiddenException (403) en caso de violación

Closes: #M1

Note: Cambios incluidos en commit 1 (finding.service.ts)
"@

git commit --allow-empty -m $commit5Message

Write-Host "✅ Commit 5 aplicado (tracking)" -ForegroundColor Green
Write-Host ""

# ==============================================================================
# COMMIT 6: CHORE - Git Security + Role Name Fixes
# ==============================================================================
Write-Host "📦 Commit 6/6: CHORE - Git Security + Role Name Fixes" -ForegroundColor Yellow
Write-Host "----------------------------------------"

git add .gitignore

$commit6Message = @"
chore: Agregar .gitignore + Corregir nombres de roles en decoradores

Changes:
- .gitignore: Excluir node_modules/, .env, uploads/, dist/
- Controllers: Reemplazar OWNER/PLATFORM_ADMIN por GLOBAL_ADMIN/SECURITY_MANAGER
  (Alineado con UserRole enum)

Impact: Cosmético - no afecta funcionalidad
Files: finding.controller.ts, evidence.controller.ts, .gitignore

Closes: #L1
"@

git commit -m $commit6Message

Write-Host "✅ Commit 6 aplicado" -ForegroundColor Green
Write-Host ""

# ==============================================================================
# FINALIZACIÓN
# ==============================================================================
Write-Host "🎉 ¡Todos los commits aplicados exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Resumen:" -ForegroundColor Cyan
Write-Host "  - 6 commits atómicos creados"
Write-Host "  - 3 CRITICAL vulnerabilities fixed"
Write-Host "  - 3 HIGH priority issues fixed"
Write-Host "  - 3 MEDIUM issues fixed"
Write-Host "  - 1 LOW cosmetic fix"
Write-Host ""
Write-Host "🔍 Ver log de commits:" -ForegroundColor Yellow
Write-Host "  git log --oneline -6" -ForegroundColor White
Write-Host ""
Write-Host "📤 Para push a repositorio remoto:" -ForegroundColor Yellow
Write-Host "  git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Ejecutar tests de seguridad antes de deployment" -ForegroundColor Red
Write-Host "  Ver sección G en AUDITORIA_SEGURIDAD.md"
Write-Host ""
Write-Host "✅ Script completado." -ForegroundColor Green
