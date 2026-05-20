import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Finding, FindingSchema } from "../finding/schemas/finding.schema";
import { Project } from "../project/schemas/project.schema";
import { Client } from "../client/schemas/client.schema";
import { Evidence } from "../evidence/schemas/evidence.schema";
import { PdfService } from "../../common/services/pdf.service";
import { FindingStatus, UserRole } from "../../common/enums";
import { roleSatisfies } from "../../common/rbac/rbac-policy";
import { Types } from "mongoose";
import * as ExcelJS from "exceljs";
import archiver from "archiver";
import { createReadStream, existsSync, mkdirSync } from "fs";
import { PassThrough } from "stream";
import { exec } from "child_process";

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
    private readonly pdfService: PdfService,
  ) {}

  private toObjectId(id?: string): Types.ObjectId | undefined {
    if (!id || !Types.ObjectId.isValid(id)) return undefined;
    return new Types.ObjectId(id);
  }

  private getCurrentTenantId(currentUser?: any): string | undefined {
    return (
      currentUser?.tenantId?.toString?.() ??
      currentUser?.activeTenantId?.toString?.() ??
      currentUser?.clientId?.toString?.()
    );
  }

  private isGlobalUser(currentUser?: any): boolean {
    return roleSatisfies(UserRole.OWNER, currentUser?.role);
  }

  private isAreaRestrictedUser(currentUser?: any): boolean {
    return [
      UserRole.AREA_ADMIN,
      UserRole.ANALYST,
      UserRole.PENTESTER,
      UserRole.QA,
      UserRole.VIEWER,
      UserRole.AUDITOR,
    ].includes(currentUser?.role);
  }

  /**
   * Genera reporte PDF de un hallazgo
   */
  async exportFindingPdf(findingId: string, currentUser: any): Promise<Buffer> {
    // 1. Fetch the finding
    const finding = await this.findingModel.findById(findingId);
    if (!finding) {
      throw new NotFoundException("Hallazgo no encontrado");
    }

    // 2. Fetch the associated project to check RBAC
    // We need the project to determine the client/tenant for authorization checks.
    const project = await this.projectModel
      .findById(finding.projectId)
      .populate("clientId");
    if (!project) {
      // This case should ideally not happen if data integrity is maintained,
      // but it's good practice to handle it.
      throw new NotFoundException(
        "Proyecto asociado al hallazgo no encontrado",
      );
    }

    // 3. Implement RBAC checks
    // Allowed roles bypass strict tenant/client checks, but still need to be authenticated.
    if (!this.isGlobalUser(currentUser)) {
      // For other roles, check if the user belongs to the same tenant/client as the project.
      const userTenantId = (
        currentUser.activeTenantId || currentUser.clientId
      )?.toString();

      // Extract the project's tenant/client ID.
      // Assuming project.clientId is populated and represents the client's ID.
      // If project.tenantId exists and is used for multi-tenancy, that should also be considered.
      let projectTenantId: string | undefined;
      if (project.tenantId) {
        projectTenantId = (project.tenantId as any)?.toString();
      } else if (project.clientId && (project.clientId as any)._id) {
        // Assuming project.clientId is a populated Client object with an _id
        projectTenantId = (project.clientId as any)._id.toString();
      }

      // If user is not an OWNER/PLATFORM_ADMIN, they must have a tenant ID,
      // and it must match the project's tenant ID.
      if (
        !userTenantId ||
        !projectTenantId ||
        projectTenantId !== userTenantId
      ) {
        throw new ForbiddenException(
          "No tiene permisos para acceder a este hallazgo.",
        );
      }
    }

    // If all checks pass, generate the PDF report
    return this.pdfService.generateFindingReport(finding);
  }

  /**
   * Exporta una lista filtrada de hallazgos a CSV
   * Soporta filtros por proyecto, cliente, estado y severidad
   * Respeta Multi-tenancy y RBAC
   */
  async exportFindingsToCSV(filters: any, currentUser: any): Promise<string> {
    const query: any = {};
    const currentTenantId = this.getCurrentTenantId(currentUser);

    // 1. Aplicar Multi-tenancy
    if (currentTenantId && !this.isGlobalUser(currentUser)) {
      query.tenantId = this.toObjectId(currentTenantId);
    } else if (filters.tenantId || filters.clientId) {
      // Owner/Platform Admin pueden filtrar por tenant específico
      query.tenantId = this.toObjectId(filters.tenantId || filters.clientId);
    }

    // 2. Aplicar filtros opcionales
    if (filters.projectId) query.projectId = this.toObjectId(filters.projectId);
    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;

    // Si es un rol restringido (AREA_ADMIN, ANALYST), solo ve sus áreas
    if (this.isAreaRestrictedUser(currentUser) && currentUser.areaIds?.length > 0) {
      const allowedAreaIds = currentUser.areaIds
        .map((id: any) => this.toObjectId(id))
        .filter(Boolean);

      // Necesitamos encontrar proyectos que pertenezcan a esas áreas
      const accessibleProjects = await this.projectModel
        .find({
          $or: [
            { areaIds: { $in: allowedAreaIds } },
            { areaId: { $in: allowedAreaIds } },
          ],
        })
        .select("_id")
        .lean();

      const projectIds = accessibleProjects.map((p: any) => p._id);

      if (query.projectId) {
        // Si ya filtró por proyecto, verificar que sea accesible
        if (
          !projectIds.some((id) => id.toString() === query.projectId.toString())
        ) {
          throw new ForbiddenException(
            "No tiene acceso al proyecto seleccionado",
          );
        }
      } else {
        // Si no filtró por proyecto, restringir a los accesibles
        query.projectId = { $in: projectIds };
      }
    }

    // 3. Ejecutar consulta
    const findings = await this.findingModel
      .find(query)
      .populate("projectId", "name")
      .populate("assignedTo", "firstName lastName")
      .sort({ createdAt: -1 })
      .lean();

    this.logger.log(
      `Exportando ${findings.length} hallazgos a CSV para usuario ${currentUser.email}`,
    );

    // 4. Generar CSV
    const headers = [
      "Proyecto",
      "Código",
      "Título",
      "Severidad",
      "Estado",
      "CVSS",
      "CVE",
      "Activo Afectado",
      "Asignado A",
      "Fecha Creación",
    ];

    const rows = (findings as any[]).map((f: any) => [
      `"${(f.projectId?.name || "N/A").replace(/"/g, '""')}"`,
      f.code || "",
      `"${(f.title || "").replace(/"/g, '""')}"`,
      f.severity || "",
      f.status || "",
      f.cvss_score || "N/A",
      f.cve_id || "N/A",
      f.affectedAsset || "N/A",
      f.assignedTo
        ? `${f.assignedTo.firstName} ${f.assignedTo.lastName}`
        : "No asignado",
      f.createdAt ? new Date(f.createdAt).toLocaleDateString("es-CL") : "N/A",
    ]);

    const BOM = "\uFEFF";
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\r\n",
    );

    return BOM + csv;
  }

  async exportProjectPdf(projectId: string, currentUser: any): Promise<Buffer> {
    // Validar permisos
    const project = await this.projectModel
      .findById(projectId)
      .populate("clientId areaId areaIds");
    if (!project) throw new NotFoundException("Proyecto no encontrado");

    // RBAC (Simplified check)
    const findings = await this.findingModel
      .find({ projectId })
      .sort({ severity: 1 });

    return this.pdfService.generateProjectReport(project, findings);
  }

  /**
   * A. NIVEL PROYECTO - Exportar proyecto individual a Excel con Streams
   * Roles: ANALYST, ADMIN, OWNER
   * Excel con 2 pestañas: Dashboard (Resumen) y Detalle Hallazgos
   */
  async exportProjectToExcel(
    projectId: string,
    currentUser: any,
  ): Promise<PassThrough> {
    // Validar permisos
    const project = await this.projectModel
      .findById(projectId)
      .populate("clientId areaId areaIds");
    if (!project) {
      throw new NotFoundException("Proyecto no encontrado");
    }

    // RBAC: Validar que el usuario pertenece al cliente/tenant del proyecto
    if (!this.isGlobalUser(currentUser)) {
      const userTenantId = (
        currentUser.activeTenantId || currentUser.clientId
      )?.toString();

      let projectTenantId: string | undefined;
      if (project.tenantId) {
        projectTenantId = (project.tenantId as any)?.toString();
      } else if (project.clientId && (project.clientId as any)._id) {
        // Assuming project.clientId is a populated Client object
        projectTenantId = (project.clientId as any)._id.toString();
      }

      if (
        !userTenantId ||
        !projectTenantId ||
        projectTenantId !== userTenantId
      ) {
        throw new ForbiddenException(
          "No tiene permisos para exportar este proyecto",
        );
      }
    }

    // Obtener hallazgos del proyecto
    // IMPORTANT: Usar project._id en lugar del string para que la query funcione con lean()
    const findings = await this.findingModel
      .find({ projectId: project._id })
      .populate("assignedTo", "firstName lastName")
      .populate("createdBy", "firstName lastName")
      .lean();

    this.logger.log(
      `Exportando proyecto ${project.name} a Excel (${findings.length} hallazgos)`,
    );

    // Crear workbook con Streams
    const stream = new PassThrough();
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream });

    // PESTAÑA 1: Dashboard (Resumen)
    const dashboardSheet = workbook.addWorksheet("Dashboard");
    dashboardSheet.columns = [
      { header: "Métrica", key: "metric", width: 30 },
      { header: "Valor", key: "value", width: 20 },
    ];

    // Calcular métricas
    const stats = findings.reduce(
      (acc: any, f: any) => {
        acc.total++;
        acc.bySeverity[f.severity] = (acc.bySeverity[f.severity] || 0) + 1;
        acc.byStatus[f.status] = (acc.byStatus[f.status] || 0) + 1;
        return acc;
      },
      { total: 0, bySeverity: {} as any, byStatus: {} as any },
    );

    // Información del proyecto
    dashboardSheet.addRow({ metric: "Nombre Proyecto", value: project.name });
    dashboardSheet.addRow({ metric: "Código", value: project.code });
    dashboardSheet.addRow({
      metric: "Cliente",
      value: (project as any).clientId?.name || "N/A",
    });
    dashboardSheet.addRow({ metric: "Estado", value: project.projectStatus });
    dashboardSheet.addRow({
      metric: "Fecha Generación",
      value: new Date().toLocaleDateString("es-CL"),
    });
    dashboardSheet.addRow({}); // Fila vacía

    // Resumen hallazgos
    dashboardSheet.addRow({ metric: "RESUMEN HALLAZGOS", value: "" });
    dashboardSheet.addRow({ metric: "Total Hallazgos", value: stats.total });
    dashboardSheet.addRow({}); // Fila vacía

    dashboardSheet.addRow({ metric: "Por Severidad", value: "" });
    Object.entries(stats.bySeverity).forEach(([severity, count]) => {
      dashboardSheet.addRow({ metric: `  ${severity}`, value: count });
    });
    dashboardSheet.addRow({}); // Fila vacía

    dashboardSheet.addRow({ metric: "Por Estado", value: "" });
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      dashboardSheet.addRow({ metric: `  ${status}`, value: count });
    });

    await dashboardSheet.commit();

    // PESTAÑA 2: Detalle Hallazgos
    const detailSheet = workbook.addWorksheet("Detalle Hallazgos");
    detailSheet.columns = [
      { header: "Código", key: "code", width: 15 },
      { header: "Código Interno", key: "internal_code", width: 15 },
      { header: "Título", key: "title", width: 40 },
      { header: "Descripción", key: "description", width: 60 },
      { header: "Severidad", key: "severity", width: 12 },
      { header: "Estado", key: "status", width: 15 },
      { header: "CVSS", key: "cvss_score", width: 10 },
      { header: "CVE", key: "cve_id", width: 18 },
      { header: "CWE", key: "cweId", width: 15 },
      { header: "Activo Afectado", key: "affectedAsset", width: 25 },
      { header: "Origen Detección", key: "detection_source", width: 20 },
      { header: "Recomendación", key: "recommendation", width: 60 },
      { header: "Impacto", key: "impact", width: 50 },
      { header: "Implicancias", key: "implications", width: 50 },
      { header: "Controles", key: "controls", width: 30 },
      { header: "Asignado A", key: "assignedTo", width: 25 },
      { header: "Fecha Creación", key: "createdAt", width: 15 },
      { header: "Fecha Cierre", key: "closedAt", width: 15 },
    ];

    // Escribir hallazgos con Stream (para soportar grandes volúmenes)
    for (const finding of findings as any[]) {
      detailSheet.addRow({
        code: finding.code,
        internal_code: finding.internal_code || "N/A",
        title: finding.title,
        description: finding.description || "N/A",
        severity: finding.severity,
        status: finding.status,
        cvss_score: finding.cvss_score || "N/A",
        cve_id: finding.cve_id || "N/A",
        cweId: finding.cweId || "N/A",
        affectedAsset: finding.affectedAsset || "N/A",
        detection_source: finding.detection_source || "N/A",
        recommendation: finding.recommendation || "N/A",
        impact: finding.impact || "N/A",
        implications: finding.implications || "N/A",
        controls: finding.controls?.join(", ") || "N/A",
        assignedTo: finding.assignedTo
          ? `${finding.assignedTo.firstName} ${finding.assignedTo.lastName}`
          : "No asignado",
        createdAt: finding.createdAt
          ? new Date(finding.createdAt).toLocaleDateString("es-CL")
          : "N/A",
        closedAt: finding.closedAt
          ? new Date(finding.closedAt).toLocaleDateString("es-CL")
          : "N/A",
      });
    }

    await detailSheet.commit();
    await workbook.commit();

    return stream;
  }

  /**
   * A. NIVEL PROYECTO - Exportar proyecto a CSV
   */
  async exportProjectToCSV(
    projectId: string,
    currentUser: any,
  ): Promise<string> {
    // Validación similar a Excel
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException("Proyecto no encontrado");
    }

    // IMPORTANT: Mongoose no convierte automáticamente string a ObjectId con lean()
    // Debemos convertirlo explícitamente
    const findings = await this.findingModel
      .find({ projectId: project._id })
      .populate("assignedTo", "firstName lastName")
      .lean();

    this.logger.log(
      `Exportando proyecto ${projectId} a CSV: ${findings.length} hallazgos encontrados`,
    );

    // Generar CSV con BOM UTF-8 para correcta codificación en Excel
    const headers = [
      "Código",
      "Código Interno",
      "Título",
      "Descripción",
      "Severidad",
      "Estado",
      "CVSS",
      "CVE",
      "CWE",
      "Activo Afectado",
      "Origen",
      "Recomendación",
      "Impacto",
      "Implicancias",
      "Controles",
      "Asignado A",
      "Fecha Creación",
    ];

    const rows = (findings as any[]).map((f: any) => [
      f.code || "",
      f.internal_code || "N/A",
      `"${(f.title || "").replace(/"/g, '""')}"`, // Escape comillas
      `"${(f.description || "N/A").replace(/"/g, '""')}"`,
      f.severity || "",
      f.status || "",
      f.cvss_score || "N/A",
      f.cve_id || "N/A",
      f.cweId || "N/A",
      f.affectedAsset || "N/A",
      f.detection_source || "N/A",
      `"${(f.recommendation || "N/A").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${(f.impact || "N/A").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${(f.implications || "N/A").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${(f.controls?.join(", ") || "N/A").replace(/"/g, '""')}"`,
      f.assignedTo
        ? `${f.assignedTo.firstName} ${f.assignedTo.lastName}`
        : "No asignado",
      f.createdAt ? new Date(f.createdAt).toLocaleDateString("es-CL") : "N/A",
    ]);

    // BOM UTF-8 para que Excel detecte la codificación correctamente
    const BOM = "\uFEFF";
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\r\n",
    );

    return BOM + csv;
  }

  /**
   * A. NIVEL PROYECTO - Exportar proyecto a JSON
   */
  async exportProjectToJSON(projectId: string, currentUser: any): Promise<any> {
    const project = await this.projectModel
      .findById(projectId)
      .populate("clientId areaId areaIds")
      .lean();
    if (!project) {
      throw new NotFoundException("Proyecto no encontrado");
    }

    const findings = await this.findingModel
      .find({ projectId })
      .populate("assignedTo createdBy")
      .lean();

    return {
      project: {
        name: project.name,
        code: project.code,
        client: (project.clientId as any).name,
        status: project.projectStatus,
        exportDate: new Date().toISOString(),
      },
      findings: findings,
      stats: {
        total: findings.length,
        bySeverity: (findings as any[]).reduce((acc: any, f: any) => {
          acc[f.severity] = (acc[f.severity] || 0) + 1;
          return acc;
        }, {}),
      },
    };
  }

  /**
   * A. NIVEL PROYECTO - Exportar proyecto y sus evidencias en ZIP
   */
  async exportProjectAsZip(
    projectId: string,
    currentUser: any,
  ): Promise<PassThrough> {
    const project = await this.projectModel
      .findById(projectId)
      .populate("clientId areaId areaIds");
    if (!project) {
      throw new NotFoundException("Proyecto no encontrado");
    }

    // RBAC
    if (!this.isGlobalUser(currentUser)) {
      const userTenant = (
        currentUser.activeTenantId || currentUser.clientId
      )?.toString();
      const projectTenant =
        (project.tenantId as any)?.toString() ||
        (project.clientId as any)?._id?.toString();
      if (!userTenant || !projectTenant || projectTenant !== userTenant) {
        throw new ForbiddenException(
          "No tiene permisos para exportar este proyecto",
        );
      }
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = new PassThrough();
    archive.pipe(stream);

    // Agregar Excel
    const excelStream = await this.exportProjectToExcel(projectId, currentUser);
    archive.append(excelStream, { name: `${project.name}/hallazgos.xlsx` });

    // Agregar evidencias
    const findings = await this.findingModel
      .find({ projectId })
      .select("_id code")
      .lean();
    const findingIds = findings.map((f: any) => f._id);
    const evidences = await this.evidenceModel
      .find({ findingId: { $in: findingIds } })
      .lean();

    for (const evidence of evidences as any[]) {
      if (!existsSync(evidence.filePath)) {
        this.logger.warn(
          `Evidencia no encontrada en disco: ${evidence.filePath}`,
        );
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
  async exportClientPortfolio(
    clientId: string,
    currentUser: any,
  ): Promise<PassThrough> {
    // RBAC: Solo CLIENT_ADMIN del cliente u OWNER
    if (!this.isGlobalUser(currentUser)) {
      const userTenantId = (
        currentUser.activeTenantId || currentUser.clientId
      )?.toString();
      // The 'clientId' parameter is from the URL, representing the client to export.
      // Ensure userTenantId is defined and matches the requested clientId.
      if (!userTenantId || clientId !== userTenantId) {
        throw new ForbiddenException(
          "No tiene permisos para exportar este cliente",
        );
      }
    }

    const client = await this.clientModel.findById(clientId);
    if (!client) {
      throw new NotFoundException("Cliente no encontrado");
    }

    const projects = await this.projectModel.find({ clientId }).lean();

    this.logger.log(
      `Exportando portfolio del cliente ${client.name} (${projects.length} proyectos)`,
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = new PassThrough();
    archive.pipe(stream);

    // Por cada proyecto, agregar Excel al ZIP
    for (const project of projects) {
      const excelStream = await this.exportProjectToExcel(
        project._id.toString(),
        currentUser,
      );
      archive.append(excelStream, {
        name: `${client.name}/${project.name}/findings.xlsx`,
      });

      // Agregar evidencias si existen
      const projectFindings = await this.findingModel
        .find({ projectId: project._id })
        .select("_id code")
        .lean();
      const projectFindingIds = projectFindings.map((f: any) => f._id);
      const evidences = await this.evidenceModel
        .find({ findingId: { $in: projectFindingIds } })
        .lean();

      for (const evidence of evidences as any[]) {
        if (!existsSync(evidence.filePath)) {
          this.logger.warn(`Evidencia no encontrada: ${evidence.filePath}`);
          continue;
        }
        const evidenceName = `${client.name}/${project.name}/evidencias/${evidence.filename || evidence.storedFilename}`;
        archive.append(createReadStream(evidence.filePath), {
          name: evidenceName,
        });
      }
    }

    await archive.finalize();
    return stream;
  }

  /**
   * B. NIVEL TENANT - Exportar todos los hallazgos de un cliente a CSV
   */
  async exportClientPortfolioCSV(
    clientId: string,
    currentUser: any,
  ): Promise<string> {
    // RBAC: Solo CLIENT_ADMIN del cliente u OWNER
    if (!this.isGlobalUser(currentUser)) {
      const userTenantId = (
        currentUser.activeTenantId || currentUser.clientId
      )?.toString();
      // The 'clientId' parameter is from the URL, representing the client to export.
      // Ensure userTenantId is defined and matches the requested clientId.
      if (!userTenantId || clientId !== userTenantId) {
        throw new ForbiddenException(
          "No tiene permisos para exportar este cliente",
        );
      }
    }

    const client = await this.clientModel.findById(clientId);
    if (!client) {
      throw new NotFoundException("Cliente no encontrado");
    }

    // Usar client._id en lugar de clientId para asegurar ObjectId correcto
    const projects = await this.projectModel
      .find({ clientId: client._id })
      .select("_id name")
      .lean();
    this.logger.log(
      `✅ Cliente ${client.name}: ${projects.length} proyectos encontrados`,
    );

    if (projects.length === 0) {
      this.logger.warn(`⚠️ No hay proyectos para el cliente ${client.name}`);
      // Retornar CSV vacío con headers
      const BOM = "\uFEFF";
      const headers = [
        "Proyecto",
        "Código",
        "Código Interno",
        "Título",
        "Descripción",
        "Severidad",
        "Estado",
        "CVSS",
        "CVE",
        "CWE",
        "Activo Afectado",
        "Origen",
        "Recomendación",
        "Impacto",
        "Implicancias",
        "Controles",
        "Asignado A",
        "Fecha Creación",
      ];
      return BOM + headers.join(",") + "\r\n";
    }

    const projectIds = projects.map((p: any) => p._id);
    const projectMap = new Map(
      projects.map((p: any) => [p._id.toString(), p.name]),
    );

    this.logger.log(`🔍 Buscando hallazgos en ${projectIds.length} proyectos`);

    const findings = await this.findingModel
      .find({ projectId: { $in: projectIds } })
      .populate("assignedTo", "firstName lastName")
      .lean();

    this.logger.log(
      `📊 Exportando CSV de cliente ${client.name}: ${findings.length} hallazgos encontrados`,
    );

    if (findings.length === 0) {
      this.logger.warn(
        `⚠️ No se encontraron hallazgos en los proyectos del cliente ${client.name}`,
      );
    }

    // Generar CSV con BOM UTF-8 para correcta codificación en Excel
    const headers = [
      "Proyecto",
      "Código",
      "Código Interno",
      "Título",
      "Descripción",
      "Severidad",
      "Estado",
      "CVSS",
      "CVE",
      "CWE",
      "Activo Afectado",
      "Origen",
      "Recomendación",
      "Impacto",
      "Implicancias",
      "Controles",
      "Asignado A",
      "Fecha Creación",
    ];

    const rows = (findings as any[]).map((f: any) => [
      `"${(projectMap.get(f.projectId.toString()) || "N/A").replace(/"/g, '""')}"`,
      f.code || "",
      f.internal_code || "N/A",
      `"${(f.title || "").replace(/"/g, '""')}"`,
      `"${(f.description || "N/A").replace(/"/g, '""')}"`,
      f.severity || "",
      f.status || "",
      f.cvss_score || "N/A",
      f.cve_id || "N/A",
      f.cweId || "N/A",
      f.affectedAsset || "N/A",
      f.detection_source || "N/A",
      `"${(f.recommendation || "N/A").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${(f.impact || "N/A").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${(f.implications || "N/A").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${(f.controls?.join(", ") || "N/A").replace(/"/g, '""')}"`,
      f.assignedTo
        ? `${f.assignedTo.firstName} ${f.assignedTo.lastName}`
        : "No asignado",
      f.createdAt ? new Date(f.createdAt).toLocaleDateString("es-CL") : "N/A",
    ]);

    // BOM UTF-8 para que Excel detecte la codificación correctamente
    const BOM = "\uFEFF";
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\r\n",
    );

    return BOM + csv;
  }

  /**
   * C. NIVEL SISTEMA - Backup completo de la base de datos
   * Rol: SOLO OWNER
   * Retorna JSON estructurado con todas las colecciones
   */
  async exportFullDatabaseBackup(currentUser: any): Promise<any> {
    // RBAC: SOLO OWNER
    if (currentUser.role !== "OWNER") {
      throw new ForbiddenException(
        "Solo OWNER puede realizar backup completo del sistema",
      );
    }

    this.logger.warn(
      `Backup completo de BD solicitado por usuario ${currentUser.email}`,
    );

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
      version: "1.0",
      data: {
        clients: clients,
        projects: projects,
        findings: findings,
        evidences: evidences.map((e) => ({
          ...e,
          filePath: "[EXCLUDED]", // No incluir paths completos por seguridad
        })),
        // users: users
      },
      stats: {
        totalClients: clients.length,
        totalProjects: projects.length,
        totalFindings: findings.length,
        totalEvidences: evidences.length,
      },
    };
  }

  /**
   * C. NIVEL SISTEMA - Backup completo vía mongodump
   */
  async createSystemBackup(currentUser: any): Promise<{ filename: string }> {
    if (currentUser.role !== "OWNER") {
      throw new ForbiddenException("Solo OWNER puede ejecutar backup completo");
    }

    const backupsDir = "backups";
    if (!existsSync(backupsDir)) {
      mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const filename = `shieldtrack_backup_${timestamp}.tar.gz`;
    const command = `mongodump --uri="${process.env.MONGODB_URI}" --archive=${backupsDir}/${filename} --gzip`;

    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          this.logger.error(`Error ejecutando backup: ${error.message}`);
          return reject(error);
        }
        this.logger.log(
          `Backup de sistema generado: ${backupsDir}/${filename}`,
        );
        resolve({ filename });
      });
    });
  }
}
