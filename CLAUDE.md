# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Stack

**Monorepo** (pnpm workspaces) — **must use `pnpm`**, never `npm` or `yarn` (enforced by `scripts/enforce-pnpm.js`).

| Layer | Tech |
|---|---|
| Backend | NestJS 11, TypeScript, Mongoose/MongoDB 8 |
| Frontend | Angular 20 (standalone components, Signals), Angular Material 20 |
| DB | MongoDB 8 (single logical DB, multi-tenant via `tenantId` field) |
| Deploy | Docker Compose (3 services: `shieldtrack-frontend :80`, `shieldtrack-backend :3000`, `shieldtrack-db :27017`) |

---

## Commands

### Full stack (Docker — standard workflow)
```bash
pnpm start                        # docker compose up --build
pnpm run start:detached           # detached
pnpm run stop                     # docker compose down

# Rebuild a single service after code changes
docker-compose up --build backend -d
docker-compose up --build frontend -d
```

### Backend (local dev)
```bash
cd backend
pnpm install
pnpm run start:dev       # nest start --watch (hot reload)
pnpm run build           # nest build → dist/
pnpm run lint            # eslint --fix
pnpm run test            # jest
pnpm run test:watch      # jest --watch
pnpm run test:e2e        # jest --config ./test/jest-e2e.json
pnpm run seed:owner      # create initial OWNER user
pnpm run seed:test       # seed test data
```

### Frontend (local dev)
```bash
cd frontend
pnpm install
pnpm start               # ng serve  (http://localhost:4200)
pnpm run build           # ng build --configuration production
pnpm test                # ng test (karma)

# Type-check only (no emit)
npx tsc --noEmit --project tsconfig.app.json
```

### Maintenance scripts (run from backend/)
```bash
pnpm run maintenance:fix-users
pnpm run maintenance:fix-indexes
pnpm run maintenance:clean
pnpm run maintenance:reset
```

---

## Architecture

### Backend modules (`backend/src/modules/`)

Each module follows the standard NestJS pattern: `module.ts / controller.ts / service.ts / schemas/ / dto/`.

| Module | Purpose |
|---|---|
| `auth` | JWT auth, user CRUD, MFA, password reset, user-area assignments |
| `client` | Tenant/client management (Clients = Tenants in business logic) |
| `area` | Sub-organizational units; hold finding code counters (`findingCodePrefix`, `nextFindingNumber`) |
| `project` | Security engagements; owns retest policy and triggers auto-close of findings on status→CLOSED |
| `finding` | Core entity; atomic code generation via `Counter` collection and `pre-save` hook |
| `evidence` | File upload/download (disk, `./uploads/evidence/`); tenant-scoped access |
| `export` | ExcelJS streaming export at project/tenant/system level; PDF via pdfmake |
| `template` | Finding templates (scope: USER / TENANT / GLOBAL) |
| `audit` | Immutable audit log via global `AuditInterceptor` |
| `backup` | mongodump/mongorestore, keeps last 30 backups |
| `retest-scheduler` | `@nestjs/schedule` cron; sends retest notifications per project policy |
| `metrics` | Aggregated analytics, exportable CSV/JSON |
| `notification` | Rule-based email notifications (NotificationRule + NotificationTemplate) |
| `system-config` | SMTP, branding (logo/favicon), platform settings |

### Multi-tenancy (critical — read before touching data queries)

Every data entity has a `tenantId: ObjectId` field. Isolation is enforced at three layers:

1. **`TenantContextMiddleware`** — runs on every request, reads `X-Tenant-Id` header or user's `clientId`/`activeTenantId`, sets CLS namespace `tenant-context`.
2. **`TenantContextGuard`** (global `APP_GUARD`) — validates tenantId is present; exempts OWNER, PLATFORM_ADMIN, and operational roles (PENTESTER, QA, ANALYST, ADMIN_AREA).
3. **Mongoose plugins** — `tenantPlugin` (global, registered in `main.ts`) and `multiTenantPlugin` (per-schema) auto-inject `tenantId` filter on all queries and validate on save. Bypass with `.setOptions({ skipTenantFilter: true })` for cross-tenant queries.

**Role groups** (defined in `backend/src/common/rbac/rbac-policy.ts`):
- `OWNER` group: `OWNER`, `PLATFORM_ADMIN` — global visibility, bypass all tenant filters
- `ADMIN_AREA` group: `ADMIN_AREA`, `CLIENT_ADMIN`, `AREA_ADMIN`
- `PENTESTER_QA` group: `PENTESTER`, `QA`, `ANALYST` — operational, bypass tenant guard but scoped by assignments
- `NORMAL_USER`, `AUDITOR`

Always use `normalizeRole(role)` and `roleSatisfies(requiredRole, actualRole)` from `rbac-policy.ts` for role checks in services — never compare role strings directly.

### Finding code generation

Finding codes (`VULN-2026-000001`) are generated atomically via `FindingSchema`'s `pre-save` hook using `findOneAndUpdate` on the `Counter` collection (keyed by `areaId`). **Never batch-insert findings with `insertMany`** — always call `.save()` individually to trigger this hook.

### Frontend architecture

Angular 20 **standalone components** with lazy loading. State management uses Angular **Signals** (`signal()`, `computed()`). No NgModules — every component declares its own `imports: []`.

Key frontend services (`frontend/src/app/core/services/`): `AuthService`, `FindingService`, `ProjectService`, `ClientService`, `EvidenceService`, `ExportService`.

The `environment.apiUrl` is `/api` (proxied by nginx in Docker). In dev (`ng serve`), configure `proxy.conf.json` or use `http://localhost:3000/api` directly.

### Global guards and interceptors (`backend/src/app.module.ts`)
- `APP_GUARD: TenantContextGuard` — runs before all route handlers
- `APP_INTERCEPTOR: TenantContextInterceptor` — runs after all route handlers
- `APP_INTERCEPTOR: AuditInterceptor` (global, registered in `main.ts`) — logs all mutations

### ValidationPipe (global)
```
whitelist: true
forbidNonWhitelisted: true   ← extra fields in body → 400
transform: true
```

### File storage
Evidence files stored at `./backend/uploads/evidence/` using the absolute path saved in the `Evidence.filePath` field. **This path is not in a Docker volume by default** — files are lost on container rebuild unless a volume is mounted.

### Key invariants
- `Finding.tenantId` is derived from the project's `tenantId`/`clientId` at creation time; never trust client-sent `tenantId`.
- OWNER in `findAll` queries must **not** be filtered by tenant — use `!roleSatisfies(UserRole.OWNER, role)` guard before applying `query.tenantId` (see `project.service.ts` line 277 as canonical reference; `finding.service.ts` follows same pattern).
- Closing a project auto-closes all open findings with `closeReason: CONTRACT_ENDED`.

---

## Pending work (ISSUES.md)

| ID | Description |
|---|---|
| B2c | "New Project" button routes to `/projects/new` (no route registered — partial fix) |
| B5b | `PATCH /api/auth/users/:userId/assignments` doesn't persist to MongoDB |
| M5 | Advanced email notification management |
| M6 | Exportable metrics for BI (Metabase/PowerBI) |
| **M8** | **Bulk findings import from CSV/Excel** — spec fully defined in ISSUES.md; not yet implemented |

### M8 implementation notes (from ISSUES.md spec)
- Backend endpoint: `POST /api/findings/bulk-import` — `@Roles(OWNER, PLATFORM_ADMIN, PENTESTER, QA)`
- Parse with `csv-parser` or `papaparse` (not yet installed); or use existing `exceljs` for `.xlsx`
- Insert findings one-by-one with `.save()` (triggers code-generation hook)
- Column mapping defined in ISSUES.md § M8 (Cliente → tenantId, cod_netics → projectId, Criticidad → severity enum in Spanish, etc.)
- Frontend: button in `FindingListComponent` + `BulkImportDialogComponent` with drag-and-drop and result summary
