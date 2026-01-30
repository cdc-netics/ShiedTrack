# QA Export & Reporting - ShieldTrack
**Fecha:** 21 de diciembre de 2025  
**Autor:** Análisis QA Export & Reporting  
**Objetivo:** Validar funcionalidad de exportación controlada para SOC/MSSP

---

## 📊 RESUMEN EJECUTIVO

### ❌ ESTADO ACTUAL: FUNCIONALIDAD NO IMPLEMENTADA
**El sistema NO tiene endpoints de exportación/reporting definidos.**

Búsqueda exhaustiva en el código:
- ❌ NO existe endpoint `/export`
- ❌ NO existe generación de PDF/CSV/JSON
- ❌ NO existe controller de reporting
- ❌ NO hay filtros de exportación

### 🔴 IMPACTO CRÍTICO EN SOC REAL

En operaciones SOC profesionales, la exportación de informes es **OBLIGATORIA** para:

1. **Cumplimiento Legal/Auditoría:**
   - ISO 27001 requiere evidencia documental
   - GDPR requiere reportes de incidentes
   - Contratos SLA exigen informes mensuales

2. **Comunicación con Clientes:**
   - Informe ejecutivo mensual (PDF)
   - Detalle técnico de hallazgos (Excel/CSV)
   - Timeline de remediación (PDF)

3. **Escalamiento Interno:**
   - Export de hallazgos críticos para management
   - Reportes de proyectos cerrados
   - Métricas de performance del SOC

**Sin exportación → El sistema NO es viable en producción SOC real.**

---

## 🚨 GAPS DETECTADOS (5 BLOCKERS)

| ID | Gap | Severidad | Justificación |
|----|-----|-----------|---------------|
| **EXP-001** | ❌ Sin endpoint export hallazgos | 🔴 CRÍTICO | Imposible generar informes mensuales |
| **EXP-002** | ❌ Sin validación RBAC en export | 🔴 CRÍTICO | Risk data leak multi-tenant |
| **EXP-003** | ❌ Sin filtros export (estados/fechas) | 🟠 ALTO | Export sin control = datos incorrectos |
| **EXP-004** | ❌ Sin rate limiting export | 🟠 ALTO | DDoS con export masivo |
| **EXP-005** | ❌ Sin formato estandarizado | 🟡 MEDIO | CSV/PDF inconsistentes |

---

## 1️⃣ DISEÑO DE EXPORTACIÓN CONTROLADA

### 🎯 Principios de Diseño

#### Principio 1: Multi-Tenant Obligatorio
```typescript
// ❌ MAL (Sin filtro cliente)
const findings = await this.findingModel.find({ status: 'CLOSED' });
// ⚠️ RIESGO: Cliente A exporta hallazgos de Cliente B

// ✅ BIEN (Con validación multi-tenant)
const projects = await this.projectModel.find({ clientId: user.clientId });
const findings = await this.findingModel.find({ 
  projectId: { $in: projects.map(p => p._id) },
  status: 'CLOSED'
});
```

#### Principio 2: Filtros Obligatorios
```typescript
// ❌ MAL (Sin restricción temporal)
GET /export/findings
// ⚠️ RIESGO: Export de 100,000 hallazgos históricos

// ✅ BIEN (Ventana temporal obligatoria)
GET /export/findings?startDate=2025-01-01&endDate=2025-01-31&limit=5000
```

#### Principio 3: RBAC Estricto
```typescript
// Solo OWNER, PLATFORM_ADMIN, CLIENT_ADMIN pueden exportar
@Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN)
@Post('export/findings')
async exportFindings(@Body() filters: ExportDto, @CurrentUser() user) {
  // ANALYST y VIEWER NO pueden exportar datos sensibles
}
```

---

## 2️⃣ IMPLEMENTACIÓN REQUERIDA

### 📁 DTOs de Exportación

**Crear `backend/src/modules/export/dto/export-findings.dto.ts`:**
```typescript
import { IsEnum, IsOptional, IsDateString, IsInt, Max, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { FindingStatus, FindingSeverity } from '../../../common/enums';

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  PDF = 'pdf',
}

export class ExportFindingsDto {
  @IsOptional()
  @IsArray()
  projectIds?: string[]; // Filtrar por proyectos específicos

  @IsOptional()
  @IsEnum(FindingStatus)
  status?: FindingStatus; // OPEN, CLOSED, etc.

  @IsOptional()
  @IsArray()
  @IsEnum(FindingSeverity, { each: true })
  severities?: FindingSeverity[]; // CRITICAL, HIGH, etc.

  @IsDateString()
  startDate: string; // ⚠️ OBLIGATORIO - Ventana temporal

  @IsDateString()
  endDate: string; // ⚠️ OBLIGATORIO - Ventana temporal

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(10000) // ⚠️ HARD LIMIT 10,000 hallazgos por export
  limit?: number = 5000;

  @IsEnum(ExportFormat)
  format: ExportFormat; // csv, json, pdf

  @IsOptional()
  includeClosed?: boolean = false; // Por defecto solo activos
}
```

### 📁 Service de Exportación

**Crear `backend/src/modules/export/export.service.ts`:**
```typescript
import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Finding } from '../finding/schemas/finding.schema';
import { Project } from '../project/schemas/project.schema';
import { ExportFindingsDto, ExportFormat } from './dto/export-findings.dto';
import * as ExcelJS from 'exceljs'; // npm install exceljs
import * as PDFDocument from 'pdfkit'; // npm install pdfkit
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectModel(Finding.name) private findingModel: Model<Finding>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  /**
   * Exporta hallazgos con validación multi-tenant y RBAC
   */
  async exportFindings(dto: ExportFindingsDto, currentUser: any): Promise<Buffer | string> {
    // SECURITY: Validar ventana temporal máxima (6 meses)
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const monthsDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsDiff > 6) {
      throw new BadRequestException('Ventana temporal máxima: 6 meses');
    }

    // SECURITY: Multi-tenant filtering
    const query: any = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // Restringir por cliente (excepto OWNER)
    if (currentUser.role !== 'OWNER' && currentUser.role !== 'PLATFORM_ADMIN') {
      const projects = await this.projectModel.find({ clientId: currentUser.clientId }).select('_id');
      const projectIds = projects.map(p => p._id.toString());
      
      // Si el usuario especificó projectIds, validar que pertenecen a su cliente
      if (dto.projectIds && dto.projectIds.length > 0) {
        const invalidProjects = dto.projectIds.filter(id => !projectIds.includes(id));
        if (invalidProjects.length > 0) {
          throw new ForbiddenException('No tiene permisos para exportar proyectos ajenos');
        }
        query.projectId = { $in: dto.projectIds };
      } else {
        query.projectId = { $in: projectIds };
      }
    } else if (dto.projectIds && dto.projectIds.length > 0) {
      query.projectId = { $in: dto.projectIds };
    }

    // Filtros adicionales
    if (dto.status) query.status = dto.status;
    if (dto.severities && dto.severities.length > 0) query.severity = { $in: dto.severities };
    if (!dto.includeClosed) query.status = { $ne: 'CLOSED' };

    // Fetch data con límite estricto
    const findings = await this.findingModel.find(query)
      .limit(dto.limit || 5000)
      .populate('projectId', 'name code clientId')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    this.logger.log(`Export solicitado: ${findings.length} hallazgos (Usuario: ${currentUser.email}, Formato: ${dto.format})`);

    // Generar según formato
    switch (dto.format) {
      case ExportFormat.CSV:
        return this.generateCSV(findings);
      case ExportFormat.JSON:
        return JSON.stringify(findings, null, 2);
      case ExportFormat.PDF:
        return this.generatePDF(findings, currentUser);
      default:
        throw new BadRequestException('Formato no soportado');
    }
  }

  /**
   * Genera CSV con formato estándar SOC
   */
  private generateCSV(findings: any[]): string {
    const headers = [
      'Código',
      'Título',
      'Severidad',
      'Estado',
      'Proyecto',
      'Activo Afectado',
      'CVSS',
      'CWE',
      'Asignado A',
      'Fecha Creación',
      'Fecha Cierre',
      'Razón Cierre'
    ];

    const rows = findings.map(f => [
      f.code,
      `"${f.title.replace(/"/g, '""')}"`, // Escape comillas
      f.severity,
      f.status,
      f.projectId?.name || 'N/A',
      f.affectedAsset || 'N/A',
      f.cvssScore || 'N/A',
      f.cweId || 'N/A',
      f.assignedTo ? `${f.assignedTo.firstName} ${f.assignedTo.lastName}` : 'No asignado',
      new Date(f.createdAt).toISOString().split('T')[0],
      f.closedAt ? new Date(f.closedAt).toISOString().split('T')[0] : 'N/A',
      f.closeReason || 'N/A'
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   * Genera PDF ejecutivo con formato profesional
   */
  private async generatePDF(findings: any[], currentUser: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('ShieldTrack - Informe de Hallazgos', { align: 'center' });
      doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-ES')}`, { align: 'center' });
      doc.fontSize(10).text(`Usuario: ${currentUser.firstName} ${currentUser.lastName}`, { align: 'center' });
      doc.moveDown(2);

      // Resumen ejecutivo
      const bySeverity = findings.reduce((acc, f) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1;
        return acc;
      }, {});

      doc.fontSize(14).text('Resumen Ejecutivo', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Total Hallazgos: ${findings.length}`);
      Object.entries(bySeverity).forEach(([severity, count]) => {
        doc.text(`${severity}: ${count}`);
      });
      doc.moveDown(2);

      // Tabla de hallazgos (primeros 50)
      doc.fontSize(14).text('Detalle de Hallazgos', { underline: true });
      doc.moveDown(0.5);

      findings.slice(0, 50).forEach((f, idx) => {
        doc.fontSize(10);
        doc.text(`${idx + 1}. ${f.code} - ${f.title}`);
        doc.fontSize(8).text(`   Severidad: ${f.severity} | Estado: ${f.status} | Proyecto: ${f.projectId?.name || 'N/A'}`);
        doc.moveDown(0.3);
      });

      if (findings.length > 50) {
        doc.fontSize(8).text(`... y ${findings.length - 50} hallazgos adicionales (consultar CSV para detalle completo)`, { italic: true });
      }

      doc.end();
    });
  }

  /**
   * Exporta informe de proyecto (resumen + hallazgos)
   */
  async exportProjectReport(projectId: string, currentUser: any): Promise<Buffer> {
    // SECURITY: Validar permisos sobre el proyecto
    const project = await this.projectModel.findById(projectId).populate('clientId areaId');
    
    if (!project) {
      throw new BadRequestException('Proyecto no encontrado');
    }

    if (currentUser.role !== 'OWNER' && currentUser.role !== 'PLATFORM_ADMIN') {
      if (project.clientId.toString() !== currentUser.clientId?.toString()) {
        throw new ForbiddenException('No tiene permisos para exportar este proyecto');
      }
    }

    const findings = await this.findingModel.find({ projectId })
      .populate('assignedTo', 'firstName lastName')
      .sort({ severity: 1, createdAt: -1 })
      .lean();

    return this.generateProjectPDF(project, findings, currentUser);
  }

  private async generateProjectPDF(project: any, findings: any[], currentUser: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text(`Informe de Proyecto: ${project.name}`, { align: 'center' });
      doc.fontSize(10).text(`Código: ${project.code}`, { align: 'center' });
      doc.fontSize(10).text(`Cliente: ${project.clientId.name}`, { align: 'center' });
      doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-ES')}`, { align: 'center' });
      doc.moveDown(2);

      // Datos del proyecto
      doc.fontSize(14).text('Información del Proyecto', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Estado: ${project.projectStatus}`);
      doc.text(`Arquitectura: ${project.serviceArchitecture}`);
      doc.text(`Fecha Inicio: ${project.startDate ? new Date(project.startDate).toLocaleDateString('es-ES') : 'N/A'}`);
      doc.text(`Fecha Fin: ${project.endDate ? new Date(project.endDate).toLocaleDateString('es-ES') : 'N/A'}`);
      doc.moveDown(1);

      // Retest policy
      if (project.retestPolicy?.enabled) {
        doc.fontSize(12).text('Política de Retest', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(9);
        doc.text(`Próximo Retest: ${project.retestPolicy.nextRetestAt ? new Date(project.retestPolicy.nextRetestAt).toLocaleDateString('es-ES') : 'N/A'}`);
        doc.text(`Notificar a: ${project.retestPolicy.notify?.recipients.join(', ') || 'N/A'}`);
        doc.moveDown(1);
      }

      // Estadísticas hallazgos
      doc.fontSize(14).text('Resumen de Hallazgos', { underline: true });
      doc.moveDown(0.5);
      const stats = findings.reduce((acc, f) => {
        acc.total++;
        acc.bySeverity[f.severity] = (acc.bySeverity[f.severity] || 0) + 1;
        acc.byStatus[f.status] = (acc.byStatus[f.status] || 0) + 1;
        return acc;
      }, { total: 0, bySeverity: {}, byStatus: {} });

      doc.fontSize(10);
      doc.text(`Total Hallazgos: ${stats.total}`);
      doc.moveDown(0.3);
      doc.text('Por Severidad:');
      Object.entries(stats.bySeverity).forEach(([sev, count]) => {
        doc.text(`  - ${sev}: ${count}`);
      });
      doc.moveDown(0.3);
      doc.text('Por Estado:');
      Object.entries(stats.byStatus).forEach(([status, count]) => {
        doc.text(`  - ${status}: ${count}`);
      });
      doc.moveDown(2);

      // Lista de hallazgos
      doc.fontSize(14).text('Detalle de Hallazgos', { underline: true });
      doc.moveDown(0.5);
      findings.forEach((f, idx) => {
        doc.fontSize(9);
        doc.text(`${idx + 1}. [${f.severity}] ${f.code} - ${f.title}`);
        doc.fontSize(7).text(`   Estado: ${f.status} | Asignado: ${f.assignedTo ? `${f.assignedTo.firstName} ${f.assignedTo.lastName}` : 'No asignado'}`);
        if (f.affectedAsset) doc.text(`   Activo: ${f.affectedAsset}`);
        doc.moveDown(0.2);
      });

      doc.end();
    });
  }
}
```

### 📁 Controller de Exportación

**Crear `backend/src/modules/export/export.controller.ts`:**
```typescript
import { Controller, Post, Get, Body, Param, UseGuards, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { ExportService } from './export.service';
import { ExportFindingsDto } from './dto/export-findings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

/**
 * Controller de Exportación
 * CRÍTICO: Solo roles administrativos pueden exportar (prevención data leak)
 */
@ApiTags('Export')
@Controller('api/export')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('findings')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN)
  @Throttle(5, 60) // ⚠️ RATE LIMIT: 5 exports por minuto
  @ApiOperation({ summary: 'Exportar hallazgos con filtros (CSV/JSON/PDF)' })
  async exportFindings(
    @Body() dto: ExportFindingsDto,
    @CurrentUser() user,
    @Res() res: Response
  ) {
    const data = await this.exportService.exportFindings(dto, user);

    // Headers según formato
    const contentTypes = {
      csv: 'text/csv',
      json: 'application/json',
      pdf: 'application/pdf'
    };

    const filenames = {
      csv: `hallazgos_${new Date().toISOString().split('T')[0]}.csv`,
      json: `hallazgos_${new Date().toISOString().split('T')[0]}.json`,
      pdf: `informe_hallazgos_${new Date().toISOString().split('T')[0]}.pdf`
    };

    res.setHeader('Content-Type', contentTypes[dto.format]);
    res.setHeader('Content-Disposition', `attachment; filename="${filenames[dto.format]}"`);
    res.send(data);
  }

  @Get('project/:id')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN)
  @Throttle(10, 60) // ⚠️ RATE LIMIT: 10 exports proyecto por minuto
  @ApiOperation({ summary: 'Exportar informe completo de proyecto (PDF)' })
  async exportProjectReport(
    @Param('id') projectId: string,
    @CurrentUser() user,
    @Res() res: Response
  ) {
    const pdf = await this.exportService.exportProjectReport(projectId, user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="proyecto_${projectId}_${Date.now()}.pdf"`);
    res.send(pdf);
  }

  @Post('client-monthly')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN)
  @Throttle(3, 60) // ⚠️ RATE LIMIT: 3 informes mensuales por minuto
  @ApiOperation({ summary: 'Informe mensual del cliente (consolidado)' })
  async exportMonthlyReport(
    @Body('clientId') clientId: string,
    @Body('month') month: string, // Format: 2025-01
    @CurrentUser() user,
    @Res() res: Response
  ) {
    // TODO: Implementar lógica de informe mensual consolidado
    // - Resumen ejecutivo
    // - Hallazgos nuevos del mes
    // - Hallazgos cerrados
    // - Proyectos activos
    // - Métricas de SLA
    res.status(501).send('Not Implemented');
  }
}
```

### 📁 Module de Exportación

**Crear `backend/src/modules/export/export.module.ts`:**
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { Finding, FindingSchema } from '../finding/schemas/finding.schema';
import { Project, ProjectSchema } from '../project/schemas/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Finding.name, schema: FindingSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
```

---

## 3️⃣ CASOS DE PRUEBA

### 🧪 TC-EXP-001: Export con Multi-Tenant Aislado
```typescript
describe('Export Findings - Multi-Tenant', () => {
  it('CLIENT_ADMIN solo exporta hallazgos de su cliente', async () => {
    // Arrange
    const clientA_admin = await createUser({ role: 'CLIENT_ADMIN', clientId: 'A' });
    await createFindings({ clientId: 'A', count: 10 });
    await createFindings({ clientId: 'B', count: 5 });

    // Act
    const response = await request(app.getHttpServer())
      .post('/api/export/findings')
      .set('Authorization', `Bearer ${clientA_admin.token}`)
      .send({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        format: 'json'
      });

    // Assert
    expect(response.status).toBe(200);
    const exported = JSON.parse(response.text);
    expect(exported).toHaveLength(10); // ⚠️ Solo los 10 de Cliente A
    expect(exported.every(f => f.projectId.clientId === 'A')).toBe(true);
  });

  it('❌ CLIENT_ADMIN NO puede exportar proyectos ajenos', async () => {
    const clientA_admin = await createUser({ role: 'CLIENT_ADMIN', clientId: 'A' });
    const projectB = await createProject({ clientId: 'B' });

    const response = await request(app.getHttpServer())
      .post('/api/export/findings')
      .set('Authorization', `Bearer ${clientA_admin.token}`)
      .send({
        projectIds: [projectB.id],
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        format: 'csv'
      });

    expect(response.status).toBe(403); // ⚠️ FORBIDDEN
    expect(response.body.message).toContain('No tiene permisos');
  });
});
```

### 🧪 TC-EXP-002: Filtros Obligatorios
```typescript
it('❌ Export sin fechas debe fallar', async () => {
  const admin = await createUser({ role: 'OWNER' });

  const response = await request(app.getHttpServer())
    .post('/api/export/findings')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ format: 'csv' }); // ⚠️ Sin startDate/endDate

  expect(response.status).toBe(400);
  expect(response.body.message).toContain('startDate');
});

it('❌ Ventana temporal > 6 meses debe fallar', async () => {
  const admin = await createUser({ role: 'OWNER' });

  const response = await request(app.getHttpServer())
    .post('/api/export/findings')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      startDate: '2024-01-01',
      endDate: '2024-12-31', // ⚠️ 12 meses
      format: 'json'
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toContain('Ventana temporal máxima: 6 meses');
});
```

### 🧪 TC-EXP-003: RBAC Estricto
```typescript
it('❌ ANALYST NO puede exportar', async () => {
  const analyst = await createUser({ role: 'ANALYST' });

  const response = await request(app.getHttpServer())
    .post('/api/export/findings')
    .set('Authorization', `Bearer ${analyst.token}`)
    .send({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      format: 'csv'
    });

  expect(response.status).toBe(403); // ⚠️ FORBIDDEN
});

it('✅ CLIENT_ADMIN puede exportar su cliente', async () => {
  const admin = await createUser({ role: 'CLIENT_ADMIN', clientId: 'A' });

  const response = await request(app.getHttpServer())
    .post('/api/export/findings')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      format: 'csv'
    });

  expect(response.status).toBe(200);
});
```

### 🧪 TC-EXP-004: Rate Limiting
```typescript
it('❌ Más de 5 exports/min debe bloquearse', async () => {
  const admin = await createUser({ role: 'OWNER' });

  // Realizar 6 exports consecutivos
  const promises = Array(6).fill(null).map(() => 
    request(app.getHttpServer())
      .post('/api/export/findings')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        format: 'json'
      })
  );

  const responses = await Promise.all(promises);

  const blocked = responses.filter(r => r.status === 429); // Too Many Requests
  expect(blocked.length).toBeGreaterThan(0); // ⚠️ Al menos 1 bloqueado
});
```

### 🧪 TC-EXP-005: Formatos Consistentes
```typescript
describe('Export Formats', () => {
  it('CSV debe tener headers correctos', async () => {
    const admin = await createUser({ role: 'OWNER' });
    await createFindings({ count: 5 });

    const response = await request(app.getHttpServer())
      .post('/api/export/findings')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        format: 'csv'
      });

    const csv = response.text;
    const lines = csv.split('\n');
    const headers = lines[0].split(',');

    expect(headers).toContain('Código');
    expect(headers).toContain('Título');
    expect(headers).toContain('Severidad');
    expect(headers).toContain('Estado');
    expect(lines.length).toBeGreaterThan(1); // Header + data
  });

  it('JSON debe ser parseable', async () => {
    const admin = await createUser({ role: 'OWNER' });
    await createFindings({ count: 3 });

    const response = await request(app.getHttpServer())
      .post('/api/export/findings')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        format: 'json'
      });

    expect(() => JSON.parse(response.text)).not.toThrow();
    const data = JSON.parse(response.text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
  });

  it('PDF debe tener Content-Type correcto', async () => {
    const admin = await createUser({ role: 'OWNER' });

    const response = await request(app.getHttpServer())
      .post('/api/export/findings')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        format: 'pdf'
      });

    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toContain('attachment');
  });
});
```

---

## 4️⃣ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Data leak multi-tenant** | ALTA | CRÍTICO | Validación clientId obligatoria |
| **Export masivo (DDoS)** | MEDIA | ALTO | Rate limiting + hard limit 10k hallazgos |
| **Ventana temporal ilimitada** | ALTA | MEDIO | Máximo 6 meses obligatorio |
| **CSV con SQL injection** | BAJA | MEDIO | Escape de comillas en campos text |
| **PDF OOM con 10k hallazgos** | MEDIA | ALTO | Limitar a 50 hallazgos en PDF detalle |

---

## 5️⃣ DEPENDENCIAS REQUERIDAS

```bash
npm install exceljs pdfkit @types/pdfkit
```

**package.json:**
```json
{
  "dependencies": {
    "exceljs": "^4.3.0",
    "pdfkit": "^0.13.0"
  },
  "devDependencies": {
    "@types/pdfkit": "^0.12.9"
  }
}
```

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### Fase 1 - Crítica (2-3 días) 🔴
- [ ] **EXP-001:** Crear módulo export + DTOs
- [ ] **EXP-002:** Implementar exportFindings con multi-tenant
- [ ] **EXP-003:** Validación RBAC (solo admins)
- [ ] **EXP-004:** Rate limiting por endpoint

### Fase 2 - Alta (2 días) 🟠
- [ ] Generación CSV con formato estándar
- [ ] Generación JSON estructurado
- [ ] Generación PDF básico (resumen ejecutivo)
- [ ] Export de proyecto individual

### Fase 3 - Media (1 semana) 🟡
- [ ] Informe mensual consolidado
- [ ] Export con timeline de hallazgos
- [ ] Métricas de SLA en PDF
- [ ] Tests automatizados (15 casos)

---

## 📈 MÉTRICAS DE ÉXITO

| Métrica | Objetivo | Validación |
|---------|----------|------------|
| **RBAC bypass** | 0 casos | TC-EXP-003 pasa 100% |
| **Multi-tenant leak** | 0 casos | TC-EXP-001 pasa 100% |
| **Rate limiting** | 5 exports/min | TC-EXP-004 bloquea correctamente |
| **Ventana temporal** | Máximo 6 meses | TC-EXP-002 rechaza > 6 meses |
| **Formatos válidos** | CSV/JSON/PDF | TC-EXP-005 parsea correctamente |

---

## ✅ CONCLUSIÓN

**ESTADO ACTUAL: ❌ SISTEMA NO VIABLE PARA SOC PROFESIONAL**

Sin funcionalidad de exportación/reporting:
- ❌ Imposible cumplir ISO 27001 / GDPR
- ❌ No se pueden entregar informes mensuales a clientes
- ❌ No hay trazabilidad para auditorías

**PRIORIDAD: 🔴 CRÍTICA**  
**Estimación:** 1-2 semanas para implementación completa  
**Blockers:** 5 (todos críticos para producción SOC real)
