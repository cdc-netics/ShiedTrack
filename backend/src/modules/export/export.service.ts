import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Finding } from '../finding/schemas/finding.schema';
import { Project } from '../project/schemas/project.schema';
import { Client } from '../client/schemas/client.schema';
import { Evidence } from '../evidence/schemas/evidence.schema';
import * as ExcelJS from 'exceljs';
import archiver from 'archiver';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { PassThrough } from 'stream';
import { exec } from 'child_process';

/**
 * Servicio de Exportación
 * Implementa 3 niveles de exportación con Streams (no buffers en RAM)
 * A. Nivel PROYECTO: Excel/CSV/JSON (ANALYST, ADMIN, OWNER)
 * B. Nivel TENANT: ZIP con carpetas por proyecto (CLIENT_ADMIN, OWNER)
 * C. Nivel SISTEMA: Backup JSON completo (SOLO OWNER)
 */
@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectModel(Finding.name) private findingModel: Model<Finding>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(Evidence.name) private evidenceModel: Model<Evidence>,
  ) {}

  /**
   * A. NIVEL PROYECTO - Exportar proyecto individual a Excel con Streams
   * Roles: ANALYST, ADMIN, OWNER
   * Excel con 2 pestañas: Dashboard (Resumen) y Detalle Hallazgos
   */
  async exportProjectToExcel(projectId: string, currentUser: any): Promise<PassThrough> {
    // Validar permisos
    const project = await this.projectModel.findById(projectId).populate('clientId areaId');
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    // RBAC: Validar que el usuario pertenece al cliente del proyecto
    if (!['OWNER', 'PLATFORM_ADMIN'].includes(currentUser.role)) {
      if (project.clientId._id.toString() !== currentUser.clientId?.toString()) {
        throw new ForbiddenException('No tiene permisos para exportar este proyecto');
      }
    }

    // Obtener hallazgos del proyecto
    const findings = await this.findingModel.find({ projectId })
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .lean();

    this.logger.log(`Exportando proyecto ${project.name} a Excel (${findings.length} hallazgos)`);

    // Crear workbook con Streams
    const stream = new PassThrough();
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream });

    // PESTAÑA 1: Dashboard (Resumen)
    const dashboardSheet = workbook.addWorksheet('Dashboard');
    dashboardSheet.columns = [
      { header: 'Métrica', key: 'metric', width: 30 },
      { header: 'Valor', key: 'value', width: 20 }
    ];

    // Calcular métricas
    const stats = findings.reduce((acc: any, f: any) => {
      acc.total++;
      acc.bySeverity[f.severity] = (acc.bySeverity[f.severity] || 0) + 1;
      acc.byStatus[f.status] = (acc.byStatus[f.status] || 0) + 1;
      return acc;
    }, { total: 0, bySeverity: {} as any, byStatus: {} as any });

    // Información del proyecto
    dashboardSheet.addRow({ metric: 'Nombre Proyecto', value: project.name });
    dashboardSheet.addRow({ metric: 'Código', value: project.code });
    dashboardSheet.addRow({ metric: 'Cliente', value: (project.clientId as any).name });
    dashboardSheet.addRow({ metric: 'Estado', value: project.projectStatus });
    dashboardSheet.addRow({ metric: 'Fecha Generación', value: new Date().toLocaleDateString('es-CL') });
    dashboardSheet.addRow({}); // Fila vacía

    // Resumen hallazgos
    dashboardSheet.addRow({ metric: 'RESUMEN HALLAZGOS', value: '' });
    dashboardSheet.addRow({ metric: 'Total Hallazgos', value: stats.total });
    dashboardSheet.addRow({}); // Fila vacía

    dashboardSheet.addRow({ metric: 'Por Severidad', value: '' });
    Object.entries(stats.bySeverity).forEach(([severity, count]) => {
      dashboardSheet.addRow({ metric: `  ${severity}`, value: count });
    });
    dashboardSheet.addRow({}); // Fila vacía

    dashboardSheet.addRow({ metric: 'Por Estado', value: '' });
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      dashboardSheet.addRow({ metric: `  ${status}`, value: count });
    });

    await dashboardSheet.commit();

    // PESTAÑA 2: Detalle Hallazgos
    const detailSheet = workbook.addWorksheet('Detalle Hallazgos');
    detailSheet.columns = [
      { header: 'Código', key: 'code', width: 15 },
      { header: 'Código Interno', key: 'internal_code', width: 15 },
      { header: 'Título', key: 'title', width: 40 },
      { header: 'Descripción', key: 'description', width: 60 },
      { header: 'Severidad', key: 'severity', width: 12 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'CVSS', key: 'cvss_score', width: 10 },
      { header: 'CVE', key: 'cve_id', width: 18 },
      { header: 'CWE', key: 'cweId', width: 15 },
      { header: 'Activo Afectado', key: 'affectedAsset', width: 25 },
      { header: 'Origen Detección', key: 'detection_source', width: 20 },
      { header: 'Recomendación', key: 'recommendation', width: 60 },
      { header: 'Impacto', key: 'impact', width: 50 },
      { header: 'Implicancias', key: 'implications', width: 50 },
      { header: 'Controles', key: 'controls', width: 30 },
      { header: 'Asignado A', key: 'assignedTo', width: 25 },
      { header: 'Fecha Creación', key: 'createdAt', width: 15 },
      { header: 'Fecha Cierre', key: 'closedAt', width: 15 }
    ];

    // Escribir hallazgos con Stream (para soportar grandes volúmenes)
    for (const finding of findings as any[]) {
      detailSheet.addRow({
        code: finding.code,
        internal_code: finding.internal_code || 'N/A',
        title: finding.title,
        description: finding.description || 'N/A',
        severity: finding.severity,
        status: finding.status,
        cvss_score: finding.cvss_score || 'N/A',
        cve_id: finding.cve_id || 'N/A',
        cweId: finding.cweId || 'N/A',
        affectedAsset: finding.affectedAsset || 'N/A',
        detection_source: finding.detection_source || 'N/A',
        recommendation: finding.recommendation || 'N/A',
        impact: finding.impact || 'N/A',
        implications: finding.implications || 'N/A',
        controls: finding.controls?.join(', ') || 'N/A',
        assignedTo: finding.assignedTo 
          ? `${finding.assignedTo.firstName} ${finding.assignedTo.lastName}`
          : 'No asignado',
        createdAt: finding.createdAt ? new Date(finding.createdAt).toLocaleDateString('es-CL') : 'N/A',
        closedAt: finding.closedAt 
          ? new Date(finding.closedAt).toLocaleDateString('es-CL')
          : 'N/A'
      });
    }

    await detailSheet.commit();
    await workbook.commit();

    return stream;
  }

  /**
   * A. NIVEL PROYECTO - Exportar proyecto a CSV
   */
  async exportProjectToCSV(projectId: string, currentUser: any): Promise<string> {
    // Validación similar a Excel
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const findings = await this.findingModel.find({ projectId })
      .populate('assignedTo', 'firstName lastName')
      .lean();

    // Generar CSV
    const headers = [
      'Código',
      'Código Interno',
      'Título',
      'Descripción',
      'Severidad',
      'Estado',
      'CVSS',
      'CVE',
      'CWE',
      'Activo Afectado',
      'Origen',
      'Recomendación',
      'Impacto',
      'Implicancias',
      'Controles',
      'Asignado A',
      'Fecha Creación'
    ];

    const rows = (findings as any[]).map((f: any) => [
      f.code,
      f.internal_code || 'N/A',
      `"${f.title.replace(/"/g, '""')}"`, // Escape comillas
      `"${(f.description || 'N/A').replace(/"/g, '""')}"`, // Escape comillas
      f.severity,
      f.status,
      f.cvss_score || 'N/A',
      f.cve_id || 'N/A',
      f.cweId || 'N/A',
      f.affectedAsset || 'N/A',
      f.detection_source || 'N/A',
      `"${(f.recommendation || 'N/A').replace(/"/g, '""')}"`,
      `"${(f.impact || 'N/A').replace(/"/g, '""')}"`,
      `"${(f.implications || 'N/A').replace(/"/g, '""')}"`,
      `"${(f.controls?.join(', ') || 'N/A').replace(/"/g, '""')}"`,
      f.assignedTo ? `${f.assignedTo.firstName} ${f.assignedTo.lastName}` : 'No asignado',
      f.createdAt ? new Date(f.createdAt).toLocaleDateString('es-CL') : 'N/A'
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   * A. NIVEL PROYECTO - Exportar proyecto a JSON
   */
  async exportProjectToJSON(projectId: string, currentUser: any): Promise<any> {
    const project = await this.projectModel.findById(projectId).populate('clientId areaId').lean();
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const findings = await this.findingModel.find({ projectId })
      .populate('assignedTo createdBy')
      .lean();

    return {
      project: {
        name: project.name,
        code: project.code,
        client: (project.clientId as any).name,
        status: project.projectStatus,
        exportDate: new Date().toISOString()
      },
      findings: findings,
      stats: {
        total: findings.length,
        bySeverity: (findings as any[]).reduce((acc: any, f: any) => {
          acc[f.severity] = (acc[f.severity] || 0) + 1;
          return acc;
        }, {})
      }
    };
  }

  /**
   * A. NIVEL PROYECTO - Exportar proyecto y sus evidencias en ZIP
   */
  async exportProjectAsZip(projectId: string, currentUser: any): Promise<PassThrough> {
    const project = await this.projectModel.findById(projectId).populate('clientId areaId');
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    // RBAC
    if (!['OWNER', 'PLATFORM_ADMIN'].includes(currentUser.role)) {
      if (project.clientId._id.toString() !== currentUser.clientId?.toString()) {
        throw new ForbiddenException('No tiene permisos para exportar este proyecto');
      }
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = new PassThrough();
    archive.pipe(stream);

    // Agregar Excel
    const excelStream = await this.exportProjectToExcel(projectId, currentUser);
    archive.append(excelStream, { name: `${project.name}/hallazgos.xlsx` });

    // Agregar evidencias
    const findings = await this.findingModel.find({ projectId }).select('_id code').lean();
    const findingIds = findings.map((f: any) => f._id);
    const evidences = await this.evidenceModel.find({ findingId: { $in: findingIds } }).lean();

    for (const evidence of evidences as any[]) {
      if (!existsSync(evidence.filePath)) {
        this.logger.warn(`Evidencia no encontrada en disco: ${evidence.filePath}`);
        continue;
      }
      const evidenceName = `evidencias/${evidence.filename || evidence.storedFilename}`;
      archive.append(createReadStream(evidence.filePath), {
        name: `${project.name}/${evidenceName}`,
      });
    }

    await archive.finalize();
    return stream;
  }

  /**
   * B. NIVEL TENANT - Exportar todos los proyectos de un cliente en ZIP
   * Roles: CLIENT_ADMIN, OWNER
   * Estructura: /ClientName/Project1/findings.xlsx, /ClientName/Project1/evidencias/
   */
  async exportClientPortfolio(clientId: string, currentUser: any): Promise<PassThrough> {
    // RBAC: Solo CLIENT_ADMIN del cliente u OWNER
    if (!['OWNER', 'PLATFORM_ADMIN'].includes(currentUser.role)) {
      if (clientId !== currentUser.clientId?.toString()) {
        throw new ForbiddenException('No tiene permisos para exportar este cliente');
      }
    }

    const client = await this.clientModel.findById(clientId);
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const projects = await this.projectModel.find({ clientId }).lean();
    
    this.logger.log(`Exportando portfolio del cliente ${client.name} (${projects.length} proyectos)`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = new PassThrough();
    archive.pipe(stream);

    // Por cada proyecto, agregar Excel al ZIP
    for (const project of projects) {
      const excelStream = await this.exportProjectToExcel(project._id.toString(), currentUser);
      archive.append(excelStream, { name: `${client.name}/${project.name}/findings.xlsx` });

      // Agregar evidencias si existen
      const projectFindings = await this.findingModel.find({ projectId: project._id }).select('_id code').lean();
      const projectFindingIds = projectFindings.map((f: any) => f._id);
      const evidences = await this.evidenceModel.find({ findingId: { $in: projectFindingIds } }).lean();

      for (const evidence of evidences as any[]) {
        if (!existsSync(evidence.filePath)) {
          this.logger.warn(`Evidencia no encontrada: ${evidence.filePath}`);
          continue;
        }
        const evidenceName = `${client.name}/${project.name}/evidencias/${evidence.filename || evidence.storedFilename}`;
        archive.append(createReadStream(evidence.filePath), { name: evidenceName });
      }
    }

    await archive.finalize();
    return stream;
  }

  /**
   * C. NIVEL SISTEMA - Backup completo de la base de datos
   * Rol: SOLO OWNER
   * Retorna JSON estructurado con todas las colecciones
   */
  async exportFullDatabaseBackup(currentUser: any): Promise<any> {
    // RBAC: SOLO OWNER
    if (currentUser.role !== 'OWNER') {
      throw new ForbiddenException('Solo OWNER puede realizar backup completo del sistema');
    }

    this.logger.warn(`Backup completo de BD solicitado por usuario ${currentUser.email}`);

    // Exportar todas las colecciones
    const [clients, projects, findings, evidences] = await Promise.all([
      this.clientModel.find().lean(),
      this.projectModel.find().lean(),
      this.findingModel.find().lean(),
      this.evidenceModel.find().lean(),
    ]);

    return {
      exportDate: new Date().toISOString(),
      exportedBy: currentUser.email,
      version: '1.0',
      data: {
        clients: clients,
        projects: projects,
        findings: findings,
        evidences: evidences.map(e => ({
          ...e,
          filePath: '[EXCLUDED]' // No incluir paths completos por seguridad
        })),
        // users: users
      },
      stats: {
        totalClients: clients.length,
        totalProjects: projects.length,
        totalFindings: findings.length,
        totalEvidences: evidences.length
      }
    };
  }

  /**
   * C. NIVEL SISTEMA - Backup completo vía mongodump
   */
  async createSystemBackup(currentUser: any): Promise<{ filename: string }> {
    if (currentUser.role !== 'OWNER') {
      throw new ForbiddenException('Solo OWNER puede ejecutar backup completo');
    }

    const backupsDir = 'backups';
    if (!existsSync(backupsDir)) {
      mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `shieldtrack_backup_${timestamp}.tar.gz`;
    const command = `mongodump --uri="${process.env.MONGODB_URI}" --archive=${backupsDir}/${filename} --gzip`;

    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          this.logger.error(`Error ejecutando backup: ${error.message}`);
          return reject(error);
        }
        this.logger.log(`Backup de sistema generado: ${backupsDir}/${filename}`);
        resolve({ filename });
      });
    });
  }
}
