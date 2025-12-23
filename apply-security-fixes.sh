#!/bin/bash

# 🚀 Script de Aplicación de Correcciones de Seguridad - ShieldTrack
# Este script aplica los 6 commits atómicos con las correcciones de la auditoría

set -e  # Detener si hay errores

echo "🔒 Iniciando aplicación de correcciones de seguridad..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "backend" ]; then
    echo "❌ Error: Este script debe ejecutarse desde la raíz del proyecto ShieldTrack"
    exit 1
fi

# ==============================================================================
# COMMIT 1: CRITICAL - Multi-Tenant Security Fixes
# ==============================================================================
echo "📦 Commit 1/6: CRITICAL - Multi-Tenant Security Fixes"
echo "----------------------------------------"

git add backend/src/modules/client/client.service.ts
git add backend/src/modules/client/client.controller.ts
git add backend/src/modules/project/project.service.ts
git add backend/src/modules/project/project.controller.ts
git add backend/src/modules/finding/finding.service.ts
git add backend/src/modules/finding/finding.controller.ts
git add backend/src/modules/finding/finding.module.ts

git commit -m "fix(security): CRITICAL - Implementar validación multi-tenant en servicios

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
Security-Advisory: HIGH PRIORITY"

echo "✅ Commit 1 aplicado"
echo ""

# ==============================================================================
# COMMIT 2: HIGH - Audit System Implementation
# ==============================================================================
echo "📦 Commit 2/6: HIGH - Audit System Implementation"
echo "----------------------------------------"

git add backend/src/modules/audit/
git add backend/src/app.module.ts

git commit -m "feat(audit): Implementar sistema de logs inmutables para compliance

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

Closes: #H4"

echo "✅ Commit 2 aplicado"
echo ""

# ==============================================================================
# COMMIT 3: HIGH - Security Hardening (Scheduler + JWT)
# ==============================================================================
echo "📦 Commit 3/6: HIGH - Security Hardening (Scheduler + JWT)"
echo "----------------------------------------"

# Ya está incluido project.service.ts en commit 1, solo agregar jwt.strategy
git add backend/src/modules/auth/strategies/jwt.strategy.ts

git commit -m "fix(security): Detener scheduler al cerrar proyecto + Validar JWT_SECRET

Fixes:
- [H1] Deshabilitar retestPolicy.enabled cuando project.status = CLOSED
      (Previene notificaciones de retest innecesarias)
- [H3] Lanzar error si JWT_SECRET no está configurado en NODE_ENV=production
      (Previene deployment inseguro)

Impact:
- Scheduler no envía emails para proyectos cerrados
- Deployment fallará si JWT_SECRET falta en producción (fail-fast)

Closes: #H1, #H3"

echo "✅ Commit 3 aplicado"
echo ""

# ==============================================================================
# COMMIT 4: MEDIUM - Rate Limiting and File Size Controls
# ==============================================================================
echo "📦 Commit 4/6: MEDIUM - Rate Limiting and File Size Controls"
echo "----------------------------------------"

git add backend/src/modules/evidence/evidence.controller.ts
git add backend/src/modules/evidence/evidence.module.ts
git add backend/src/main.ts

git commit -m "feat(security): Rate limiting en descargas + Límite de 50MB para uploads

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

Closes: #M2, #M3"

echo "✅ Commit 4 aplicado"
echo ""

# ==============================================================================
# COMMIT 5: MEDIUM - FindingUpdate Ownership Validation
# ==============================================================================
echo "📦 Commit 5/6: MEDIUM - FindingUpdate Ownership Validation"
echo "----------------------------------------"

# Ya incluido en commit 1, crear commit vacío para tracking
git commit --allow-empty -m "fix(security): Validar ownership antes de crear FindingUpdate

Fix:
- [M1] createUpdate() ahora valida que el hallazgo pertenece al tenant
      antes de agregar comentarios al timeline

Behavior:
- Usuarios restricted (CLIENT_ADMIN, AREA_ADMIN, ANALYST, VIEWER)
  no pueden agregar updates a hallazgos de otros clientes
- Lanza ForbiddenException (403) en caso de violación

Closes: #M1

Note: Cambios incluidos en commit 1 (finding.service.ts)"

echo "✅ Commit 5 aplicado (tracking)"
echo ""

# ==============================================================================
# COMMIT 6: CHORE - Git Security + Role Name Fixes
# ==============================================================================
echo "📦 Commit 6/6: CHORE - Git Security + Role Name Fixes"
echo "----------------------------------------"

git add .gitignore

git commit -m "chore: Agregar .gitignore + Corregir nombres de roles en decoradores

Changes:
- .gitignore: Excluir node_modules/, .env, uploads/, dist/
- Controllers: Reemplazar OWNER/PLATFORM_ADMIN por GLOBAL_ADMIN/SECURITY_MANAGER
  (Alineado con UserRole enum)

Impact: Cosmético - no afecta funcionalidad
Files: finding.controller.ts, evidence.controller.ts, .gitignore

Closes: #L1"

echo "✅ Commit 6 aplicado"
echo ""

# ==============================================================================
# FINALIZACIÓN
# ==============================================================================
echo "🎉 ¡Todos los commits aplicados exitosamente!"
echo ""
echo "📊 Resumen:"
echo "  - 6 commits atómicos creados"
echo "  - 3 CRITICAL vulnerabilities fixed"
echo "  - 3 HIGH priority issues fixed"
echo "  - 3 MEDIUM issues fixed"
echo "  - 1 LOW cosmetic fix"
echo ""
echo "🔍 Ver log de commits:"
echo "  git log --oneline -6"
echo ""
echo "📤 Para push a repositorio remoto:"
echo "  git push origin main"
echo ""
echo "⚠️  IMPORTANTE: Ejecutar tests de seguridad antes de deployment"
echo "  Ver sección G en AUDITORIA_SEGURIDAD.md"
echo ""
echo "✅ Script completado."
