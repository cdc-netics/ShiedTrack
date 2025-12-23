# QA Retención y Backups - ShieldTrack
**Fecha:** 21 de diciembre de 2025  
**Análisis:** Políticas de retención y backup para SOC

---

## 📊 ESTADO ACTUAL

### ❌ SIN POLÍTICAS DEFINIDAS
- ❌ No hay estrategia de backup automatizado
- ❌ No hay política de retención de datos
- ❌ No hay archivado de proyectos cerrados
- ❌ No hay export legal para auditorías

---

## 🚨 REQUISITOS LEGALES

### Retención Mínima por Tipo de Dato
| Tipo | Retención | Regulación | Justificación |
|------|-----------|------------|---------------|
| **Hallazgos activos** | Indefinida | ISO 27001 | Hasta cierre proyecto |
| **Hallazgos cerrados** | 2-7 años | SOX / ISO | Auditorías históricas |
| **Proyectos cerrados** | 5 años | Contratos SOC | Disputas legales |
| **Logs de auditoría** | 1-7 años | GDPR / SOX | Por severidad (ver doc anterior) |
| **Evidencias** | 2 años | Chain of custody | Post-cierre proyecto |
| **Datos personales** | 2 años | GDPR Art. 30 | Derecho al olvido |

---

## ✅ ESTRATEGIA DE BACKUP

### Backup Diario (Automatizado)
```yaml
# docker-compose.yml
services:
  mongodb-backup:
    image: tiredofit/mongodb-backup
    environment:
      - DB_HOST=mongodb
      - DB_NAME=shieldtrack
      - DB_USER=backup_user
      - DB_PASS=${BACKUP_PASSWORD}
      - BACKUP_SCHEDULE=0 2 * * * # Diario 2 AM
      - BACKUP_RETENTION=30 # 30 días en disco
      - BACKUP_LOCATION=/backups
      - COMPRESSION=GZ
    volumes:
      - ./backups:/backups
```

### Backup Incremental (MongoDB Ops Manager)
```javascript
// Alternativa profesional: MongoDB Atlas Backup
// - Backups continuos con PITR (Point-in-Time Recovery)
// - Retención configurable (7-365 días)
// - Restauración en < 1 hora
```

---

## ✅ POLÍTICA DE ARCHIVADO

### Archivar Proyectos Cerrados
```typescript
// Cron job diario: Archivar proyectos cerrados > 90 días
@Cron('0 3 * * *') // 3 AM diario
async archiveOldProjects(): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const projects = await this.projectModel.find({
    projectStatus: 'CLOSED',
    closedAt: { $lt: cutoffDate },
    archived: { $ne: true }
  });

  for (const project of projects) {
    // Mover hallazgos a colección archived_findings
    const findings = await this.findingModel.find({ projectId: project._id });
    await this.archivedFindingModel.insertMany(findings);

    // Mover evidencias a cold storage
    await this.archiveEvidences(project._id);

    // Marcar proyecto como archivado
    project.archived = true;
    project.archivedAt = new Date();
    await project.save();

    this.logger.log(`Proyecto archivado: ${project.name} (${findings.length} hallazgos)`);
  }
}
```

### Borrado Legal (GDPR Compliance)
```typescript
// Cron mensual: Borrar datos > 7 años (excepto críticos)
@Cron('0 4 1 * *') // 1er día del mes, 4 AM
async legalDeletion(): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 7);

  // Borrar proyectos archivados > 7 años
  const result = await this.archivedProjectModel.deleteMany({
    archivedAt: { $lt: cutoffDate },
    legalHold: { $ne: true } // ⚠️ Respetar retenciones legales
  });

  this.logger.warn(`Borrado legal: ${result.deletedCount} proyectos eliminados (> 7 años)`);
}
```

---

## ✅ EXPORT LEGAL

### Endpoint para Exportación Forense
```typescript
@Get('legal-export/:clientId')
@Roles(UserRole.OWNER) // ⚠️ Solo OWNER puede exportar todo
async legalExport(
  @Param('clientId') clientId: string,
  @Query('startDate') startDate: string,
  @Query('endDate') endDate: string
): Promise<StreamableFile> {
  // Export completo para auditoría legal
  const data = {
    client: await this.clientModel.findById(clientId),
    projects: await this.projectModel.find({ clientId }),
    findings: await this.findingModel.find({ 
      projectId: { $in: projectIds },
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }),
    auditLogs: await this.auditModel.find({ 
      'metadata.clientId': clientId,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }),
    evidences: await this.evidenceModel.find({ findingId: { $in: findingIds } })
  };

  // Comprimir y cifrar
  const zip = archiver('zip', { zlib: { level: 9 } });
  zip.append(JSON.stringify(data, null, 2), { name: 'data.json' });
  
  // Incluir archivos de evidencias
  for (const evidence of data.evidences) {
    zip.file(evidence.filepath, { name: `evidences/${evidence.filename}` });
  }

  zip.finalize();
  return new StreamableFile(zip);
}
```

---

## 🧪 CASOS DE PRUEBA

### TC-RET-001: Archivado Automático
```typescript
it('Proyectos cerrados > 90 días deben archivarse', async () => {
  const project = await createProject({ 
    status: 'CLOSED',
    closedAt: new Date('2024-09-01') // Hace 112 días
  });

  await projectService.archiveOldProjects();

  const archived = await archivedProjectModel.findById(project.id);
  expect(archived).toBeDefined();
  expect(archived.archivedAt).toBeDefined();
});
```

### TC-RET-002: Respeto a Legal Hold
```typescript
it('Proyectos con legalHold NO deben borrarse', async () => {
  const project = await createArchivedProject({
    archivedAt: new Date('2015-01-01'), // Hace 10 años
    legalHold: true
  });

  await projectService.legalDeletion();

  const stillExists = await archivedProjectModel.findById(project.id);
  expect(stillExists).toBeDefined(); // ⚠️ No debe borrarse
});
```

---

## 🎯 PLAN

### Fase 1 (2 días) 🔴
- [ ] Configurar MongoDB backup diario
- [ ] Cron archivado automático (90 días)
- [ ] Schema con campos: archived, archivedAt, legalHold

### Fase 2 (2 días) 🟠
- [ ] Cron borrado legal (> 7 años)
- [ ] Endpoint legal-export
- [ ] Tests (5 casos)

### Fase 3 (1 día) 🟡
- [ ] Dashboard retención (métricas: TB archivado, próximos borrados)
- [ ] Notificación legal (30 días antes de borrado)

---

## 📊 MÉTRICAS MONITOREO

| Métrica | Target | Alerta |
|---------|--------|--------|
| **Último backup exitoso** | < 24h | > 36h |
| **Tamaño backup** | < 50GB | > 100GB |
| **Proyectos pendientes archivar** | < 10 | > 50 |
| **Datos > 7 años sin legal hold** | 0 | > 100GB |

---

## ✅ CONCLUSIÓN

**ESTADO:** ❌ Sin backup/retención  
**Prioridad:** 🔴 CRÍTICA (riesgo pérdida datos)  
**Estimación:** 1 semana  
**Costo aprox:** MongoDB Atlas Backup ~$100/mes
