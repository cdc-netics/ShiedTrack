# Implementación de Multi-Tenancy Real

## ✅ Implementado

### 1. Aislamiento Total por Tenant

#### Plugin de Mongoose (`multi-tenant.plugin.ts`)
- **Filtros automáticos** en TODAS las queries (find, findOne, update, delete, count)
- **Inyección automática** de `tenantId` al crear registros
- **Validación post-query** para prevenir fugas de datos
- Se aplica a: Finding, Project (extender a más entidades según necesidad)

#### Contexto de Tenant (CLS - Continuation-Local Storage)
- Usa `cls-hooked` para mantener contexto de tenant en toda la cadena de ejecución
- No requiere pasar `tenantId` manualmente en cada función
- Thread-safe y async-safe

---

### 2. Roles Implementados

#### OWNER (Global)
- `isOwner = true` en contexto CLS
- **Puede ver TODOS los tenants** si no especifica `X-TENANT-ID` header
- **Puede especificar tenant** via header `X-TENANT-ID` para operar en un tenant específico
- **Bypasea filtros automáticos** del plugin cuando no especifica tenant

#### TENANT_ADMIN y otros roles
- **Solo ven SU tenant** (el asociado a `clientId` o `activeTenantId`)
- **No pueden** especificar otro tenant via header
- **Aislamiento forzado** a nivel de base de datos

---

### 3. Guard de Contexto (`TenantContextGuard`)

**Flujo de ejecución:**

1. **Sin autenticación** (login, register): Permite sin tenant
2. **Con usuario autenticado**:
   - Si es OWNER/PLATFORM_ADMIN:
     - Lee header `X-TENANT-ID` (opcional)
     - Si no hay header, puede ver todos los tenants
   - Si es otro rol:
     - Usa: `header > activeTenantId > clientId > tenantIds[0]`
     - Si no tiene tenant: Error 400

3. **Establece contexto CLS** con:
   - `tenantId`: ID del tenant activo
   - `isOwner`: true/false
   - `userId`: ID del usuario actual

---

### 4. Schemas Actualizados

#### Finding, Project
- **Plugin aplicado**: `multiTenantPlugin`
- **tenantId obligatorio** en todas las operaciones
- **Filtrado automático** por tenant en queries

#### User
- Ya tiene: `tenantIds[]`, `activeTenantId`, `clientId`
- **No necesita plugin** (los usuarios cruzan tenants para OWNER)

#### Client (Tenant raíz)
- **NO tiene tenantId** (es el tenant mismo)
- Representa la unidad de aislamiento máxima

---

## 🔄 Cómo Funciona

### Ejemplo: Owner viendo todos los proyectos

```typescript
// Request sin X-TENANT-ID header
GET /api/projects

// Guard detecta: user.role === 'OWNER'
// CLS: { isOwner: true, tenantId: undefined }
// Plugin: isOwner() === true → NO aplica filtro
// Resultado: Todos los proyectos de todos los tenants
```

### Ejemplo: Owner viendo proyectos de un tenant específico

```typescript
// Request con header
GET /api/projects
Headers: { X-TENANT-ID: '507f1f77bcf86cd799439011' }

// Guard detecta: user.role === 'OWNER' + header presente
// CLS: { isOwner: true, tenantId: '507f1f77bcf86cd799439011' }
// Plugin: isOwner() === true pero tenantId presente → Aplica filtro
// Resultado: Solo proyectos del tenant especificado
```

### Ejemplo: TENANT_ADMIN viendo proyectos

```typescript
// Request (header ignorado)
GET /api/projects
Headers: { X-TENANT-ID: 'otro-tenant' }  // ❌ Ignorado

// Guard detecta: user.role === 'TENANT_ADMIN'
// CLS: { isOwner: false, tenantId: user.clientId }
// Plugin: Aplica filtro automático por user.clientId
// Resultado: Solo proyectos de SU tenant
```

---

## 📋 Pendiente de Implementar

### Backend

1. **Extender plugin a más entidades**:
   - Area
   - Template
   - SystemConfig
   - Evidence
   - CustomRole
   - Audit logs

2. **Servicios multi-tenant**:
   - ClientService: Gestión de tenants (crear, listar, actualizar)
   - UserService: Asignar usuarios a tenants
   - TenantConfigService: Configuración centralizada por tenant

3. **Endpoints específicos**:
   - `POST /api/admin/tenants` - Crear tenant (solo OWNER)
   - `GET /api/admin/tenants` - Listar todos (solo OWNER)
   - `PUT /api/admin/tenants/:id` - Configurar tenant
   - `POST /api/admin/users/:id/assign-tenant` - Asignar usuario a tenant (solo OWNER)
   - `POST /api/auth/switch-tenant/:tenantId` - Cambiar contexto de tenant

4. **Migraciones de datos**:
   - Script para agregar `tenantId` a registros existentes
   - Asociar datos huérfanos a un tenant por defecto

---

### Frontend

1. **Selector de Tenant (Owner)**:
   - Dropdown en toolbar para Owner
   - Lista de tenants disponibles
   - Enviar `X-TENANT-ID` header en todas las requests

2. **Servicio de Tenant**:
   ```typescript
   @Injectable()
   export class TenantService {
     currentTenant$ = new BehaviorSubject<string | null>(null);
     
     setTenant(tenantId: string) {
       this.currentTenant$.next(tenantId);
       // Actualizar interceptor HTTP
     }
   }
   ```

3. **HTTP Interceptor**:
   - Agregar header `X-TENANT-ID` automáticamente
   - Solo para Owner cuando tenga tenant seleccionado

4. **UI condicional**:
   - Ocultar selector de tenant para no-Owner
   - Mostrar banner de "Tenant Activo" para contexto

5. **Página de Configuración de Tenant**:
   - `/admin/tenants/:id/config`
   - Nomenclaturas personalizadas
   - Workflows de hallazgos
   - Estados, criticidades
   - Campos personalizados
   - Reglas específicas

---

## 🔒 Seguridad

### ✅ Garantías de Seguridad

1. **Filtrado a nivel de base de datos**:
   - No depende de lógica de frontend
   - Mongoose middleware ejecuta ANTES de queries

2. **Validación post-query**:
   - Verifica que ningún documento escape del tenant
   - Throw error si se detecta violación

3. **Contexto inmutable**:
   - CLS establece contexto una vez por request
   - No se puede modificar durante la ejecución

4. **Owner bypass controlado**:
   - Solo roles específicos pueden bypassear
   - Requiere flag explícito en contexto

---

## 📊 Testing

### Tests Recomendados

```typescript
describe('Multi-Tenancy', () => {
  it('Owner sin header: ve todos los tenants', async () => {
    // ...
  });

  it('Owner con header: ve solo ese tenant', async () => {
    // ...
  });

  it('TENANT_ADMIN: solo ve su tenant', async () => {
    // ...
  });

  it('TENANT_ADMIN con header malicioso: header ignorado', async () => {
    // ...
  });

  it('Plugin: inyecta tenantId al crear Finding', async () => {
    // ...
  });

  it('Plugin: filtra queries automáticamente', async () => {
    // ...
  });
});
```

---

## 🚀 Próximos Pasos

1. ✅ **Plugin y Guard implementados** (HECHO)
2. ⏳ **Extender a todas las entidades** (EN PROGRESO)
3. ⏳ **Crear endpoints de gestión de tenants**
4. ⏳ **Implementar selector de tenant en frontend**
5. ⏳ **Migrar datos existentes**
6. ⏳ **Tests de aislamiento**
7. ⏳ **Configuración centralizada por tenant**

---

## 📝 Notas Técnicas

- **CLS vs AsyncLocalStorage**: Se usa cls-hooked por compatibilidad con Node.js 14+
- **Performance**: Los índices en `tenantId` son críticos (ya aplicados)
- **Soft Delete**: El plugin NO filtra documentos eliminados (usar isDeleted separately)
- **Aggregation**: Pipelines de agregación requieren `$match: { tenantId }` manual

---

**Implementado por**: Copilot AI  
**Fecha**: 2026-01-14  
**Basado en**: Prompt de arquitectura multi-tenant empresarial
