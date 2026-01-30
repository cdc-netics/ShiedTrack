# QA Configuración por Cliente - ShieldTrack
**Fecha:** 21 de diciembre de 2025  
**Análisis:** Validación de configuración multi-tenant escalable

---

## 📊 ESTADO ACTUAL

### ❌ HARDCODE GLOBAL DETECTADO
**Problema:** Configuraciones críticas están hardcodeadas a nivel global, imposibilitando customización por cliente.

| Configuración | Ubicación | Estado | Problema |
|--------------|-----------|--------|----------|
| **Offsets retest** | `project.dto.ts` | ❌ Hardcode | Validación global @Min(0) @Max(365) |
| **Max recipients** | `project.dto.ts` | ❌ SIN VALIDACIÓN | No existe `@ArrayMaxSize(3)` |
| **Severidad default** | `finding.schema.ts` | ❌ N/A | No hay default configurado |
| **Retest obligatorio** | `project.schema.ts` | ❌ Hardcode | `default: false` global |
| **Cierre automático** | `project.service.ts` | ❌ Hardcode | Siempre ON al cerrar proyecto |

---

## 🚨 GAPS CRÍTICOS

### GAP-1: Sin Overrides por Cliente
```typescript
// ❌ CÓDIGO ACTUAL (project.dto.ts línea 9-45)
export class RetestPolicyDto {
  @ArrayMinSize(1)
  @ArrayMaxSize(10) // ⚠️ GLOBAL - Cliente A quiere max 3, Cliente B max 10
  offsetDays: number[];

  @ArrayMinSize(1)
  // ❌ FALTA: @ArrayMaxSize(X) - Sin límite de recipients
  recipients: string[];
}
```

**SOLUCIÓN REQUERIDA:**
```typescript
// Crear ClientConfig entity
@Schema()
export class ClientConfig {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true, unique: true })
  clientId: Types.ObjectId;

  @Prop({ type: Object })
  retestDefaults: {
    offsetDaysMax: number; // Ej: Cliente A = 3, Cliente B = 10
    recipientsMax: number; // Ej: Cliente A = 5, Cliente B = 20
    mandatory: boolean;    // Si retest es obligatorio por contrato
  };

  @Prop({ type: Object })
  findingDefaults: {
    defaultSeverity: string; // 'MEDIUM' para Cliente A, 'HIGH' para Cliente B
    allowSelfClose: boolean; // Analista puede cerrar o requiere aprobación
    maxOpenFindings: number; // Límite de hallazgos abiertos simultáneos
  };

  @Prop({ type: Object })
  projectDefaults: {
    autoCloseFindings: boolean; // Al cerrar proyecto, cerrar hallazgos auto
    archiveAfterDays: number;   // Días para archivar proyectos cerrados
  };
}
```

### GAP-2: Herencia Cliente → Proyecto NO Implementada
```typescript
// ❌ CÓDIGO ACTUAL (project.service.ts línea 20-29)
async create(dto: CreateProjectDto): Promise<Project> {
  const project = new this.projectModel(dto);
  await project.save();
  return project;
}
// ⚠️ NO hereda defaults del cliente
```

**SOLUCIÓN:**
```typescript
async create(dto: CreateProjectDto, clientId: string): Promise<Project> {
  // Obtener configuración del cliente
  const clientConfig = await this.clientConfigModel.findOne({ clientId });
  
  // Aplicar defaults si no se especificaron
  const projectData = {
    ...dto,
    retestPolicy: {
      enabled: dto.retestPolicy?.enabled ?? clientConfig.retestDefaults.mandatory,
      notify: {
        offsetDays: dto.retestPolicy?.notify?.offsetDays || clientConfig.retestDefaults.defaultOffsets,
        recipients: dto.retestPolicy?.notify?.recipients || []
      }
    }
  };

  const project = new this.projectModel(projectData);
  await project.save();
  return project;
}
```

---

## 📋 MATRIZ CLIENTE/CONFIG

| Cliente | Max Offsets | Max Recipients | Retest Obligatorio | Severidad Default | Auto-Close | Max Hallazgos Abiertos |
|---------|-------------|----------------|-------------------|-------------------|----------|----------------------|
| **Cliente A (Banco)** | 3 | 5 | ✅ SÍ | HIGH | ❌ NO | 500 |
| **Cliente B (Startup)** | 5 | 10 | ❌ NO | MEDIUM | ✅ SÍ | 100 |
| **Cliente C (Gobierno)** | 2 | 3 | ✅ SÍ | CRITICAL | ❌ NO | 1000 |

**Sin configuración por cliente:** Imposible soportar estos 3 clientes simultáneamente.

---

## 🧪 CASOS DE PRUEBA

### TC-CFG-001: Validar Max Offsets por Cliente
```typescript
it('Cliente A con max 3 offsets debe rechazar 5', async () => {
  await createClientConfig({ clientId: 'A', retestDefaults: { offsetDaysMax: 3 } });

  const response = await request(app)
    .post('/api/projects')
    .send({
      clientId: 'A',
      retestPolicy: { offsetDays: [30, 15, 7, 3, 1] } // ❌ 5 offsets
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toContain('Máximo 3 offsets');
});
```

### TC-CFG-002: Herencia de Defaults
```typescript
it('Proyecto sin retestPolicy debe heredar del cliente', async () => {
  await createClientConfig({
    clientId: 'B',
    retestDefaults: { mandatory: true, defaultOffsets: [30, 7] }
  });

  const project = await projectService.create({
    name: 'Test Project',
    clientId: 'B'
    // ⚠️ Sin retestPolicy especificado
  });

  expect(project.retestPolicy.enabled).toBe(true); // Heredado
  expect(project.retestPolicy.notify.offsetDays).toEqual([30, 7]); // Heredado
});
```

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### Fase 1 (2-3 días) 🔴
- [ ] Crear `ClientConfig` schema
- [ ] Implementar herencia cliente → proyecto
- [ ] Validación dinámica por cliente (offsetDaysMax, recipientsMax)

### Fase 2 (2 días) 🟠
- [ ] Endpoint CRUD para ClientConfig (solo OWNER)
- [ ] Tests automatizados (8 casos)

---

## ✅ CONCLUSIÓN

**ESTADO: ❌ HARDCODE GLOBAL → NO ESCALABLE**  
**Prioridad:** 🟠 ALTA (bloquea multi-cliente avanzado)  
**Estimación:** 1 semana
