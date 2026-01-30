# QA Concurrencia y Conflictos - ShieldTrack
**Fecha:** 21 de diciembre de 2025  
**Análisis:** Validación de ediciones simultáneas

---

## 📊 PROBLEMA: Sin Control de Concurrencia

### ❌ CÓDIGO ACTUAL
```typescript
// finding.service.ts línea 145
async update(id: string, dto: UpdateFindingDto): Promise<Finding> {
  const finding = await this.findingModel.findById(id);
  Object.assign(finding, dto);
  await finding.save(); // ⚠️ LAST-WRITE-WINS (overwrite silencioso)
  return finding;
}
```

### 🚨 ESCENARIO REAL DE CONFLICTO

```
T=0: Finding { severity: 'CRITICAL', status: 'OPEN' }

T=1: Analyst A lee finding (severity: CRITICAL)
T=2: Analyst B lee finding (severity: CRITICAL)

T=3: Analyst A actualiza: { severity: 'LOW' }
T=4: Analyst B actualiza: { status: 'IN_PROGRESS' }

RESULTADO: 
- Cambio de severidad de A se PIERDE (overwrite)
- Solo queda status de B
- Sin notificación a ninguno
```

---

## ✅ SOLUCIÓN 1: Locking Optimista

### Agregar Versión a Schema
```typescript
// finding.schema.ts
@Schema({ timestamps: true, versionKey: '__v' })
export class Finding extends Document {
  // ... campos existentes
  __v: number; // ⚠️ Mongoose automático
}
```

### Validar Versión en Update
```typescript
async update(id: string, dto: UpdateFindingDto, expectedVersion: number): Promise<Finding> {
  const result = await this.findingModel.findOneAndUpdate(
    { 
      _id: id,
      __v: expectedVersion // ⚠️ Solo actualiza si versión coincide
    },
    { $set: dto, $inc: { __v: 1 } },
    { new: true, runValidators: true }
  );

  if (!result) {
    const current = await this.findingModel.findById(id);
    throw new ConflictException(
      `Conflicto: hallazgo modificado por otro usuario. ` +
      `Versión esperada: ${expectedVersion}, actual: ${current.__v}`
    );
  }

  return result;
}
```

---

## ✅ SOLUCIÓN 2: Timestamps + Diff

```typescript
async update(id: string, dto: UpdateFindingDto, lastModified: Date): Promise<Finding> {
  const finding = await this.findingModel.findById(id);

  // Verificar si fue modificado desde que el usuario lo leyó
  if (finding.updatedAt > lastModified) {
    // Calcular diff
    const conflicts = this.detectConflicts(finding, dto);
    
    throw new ConflictException({
      message: 'Hallazgo modificado por otro usuario',
      currentData: finding,
      conflicts: conflicts,
      yourChanges: dto
    });
  }

  // Actualizar...
}

private detectConflicts(current: Finding, incoming: any): string[] {
  const conflicts = [];
  if (incoming.severity && current.severity !== incoming.severity) {
    conflicts.push(`severity (actual: ${current.severity})`);
  }
  if (incoming.status && current.status !== incoming.status) {
    conflicts.push(`status (actual: ${current.status})`);
  }
  return conflicts;
}
```

---

## 🧪 CASOS DE PRUEBA

### TC-CONC-001: Detección de Conflicto
```typescript
it('Ediciones simultáneas deben detectar conflicto', async () => {
  const finding = await createFinding({ severity: 'CRITICAL', __v: 0 });

  // User A actualiza primero
  await findingService.update(finding.id, { severity: 'HIGH' }, 0);

  // User B intenta actualizar con versión antigua
  await expect(
    findingService.update(finding.id, { status: 'IN_PROGRESS' }, 0)
  ).rejects.toThrow(ConflictException);
});
```

### TC-CONC-002: Cierre + Update Concurrente
```typescript
it('Cierre concurrente con update debe bloquear update', async () => {
  const finding = await createFinding({ status: 'OPEN', __v: 0 });

  // User A cierra
  await findingService.close(finding.id, { closeReason: 'FIXED' });

  // User B intenta actualizar (debería fallar)
  await expect(
    findingService.update(finding.id, { severity: 'LOW' }, 0)
  ).rejects.toThrow('Hallazgo cerrado, no se puede actualizar');
});
```

---

## 🎯 PLAN

### Fase 1 (2 días) 🔴
- [ ] Implementar locking optimista con __v
- [ ] Validación en controllers (dto con version)
- [ ] Tests (6 casos)

### Fase 2 (1 día) 🟠
- [ ] Frontend: Manejo de ConflictException
- [ ] Modal "Resolver conflicto" con diff visual

---

## ✅ CONCLUSIÓN

**ESTADO:** ❌ Sin control concurrencia  
**Prioridad:** 🟠 ALTA (pérdida de datos)  
**Estimación:** 3 días
