import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as ExcelJS from "exceljs";
import { Finding } from "./schemas/finding.schema";
import { FindingUpdate } from "./schemas/finding-update.schema";
import { Client } from "../client/schemas/client.schema";
import {
  CreateFindingDto,
  UpdateFindingDto,
  CloseFindingDto,
} from "./dto/finding.dto";
import { CreateFindingUpdateDto } from "./dto/finding-update.dto";
import {
  FindingStatus,
  FindingSeverity,
  FindingUpdateType,
  CloseReason,
  UserRole,
  ServiceArchitecture,
} from "../../common/enums";
import { normalizeRole, roleSatisfies } from "../../common/rbac/rbac-policy";
import { Project } from "../project/schemas/project.schema";
import { SystemConfig } from "../system-config/schemas/system-config.schema";
import { Area } from "../area/schemas/area.schema";
import { User } from "../auth/schemas/user.schema";
import { EmailService } from "../email/email.service";

/**
 * Servicio de gestión de Hallazgos
 * Maneja CRUD de hallazgos, timeline y lógica de cierre
 */
@Injectable()
export class FindingService {
  private readonly logger = new Logger(FindingService.name);

  constructor(
    @InjectModel(Finding.name) private findingModel: Model<Finding>,
    @InjectModel(FindingUpdate.name) private updateModel: Model<FindingUpdate>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(SystemConfig.name)
    private systemConfigModel: Model<SystemConfig>,
    @InjectModel(Area.name) private areaModel: Model<Area>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    private emailService: EmailService,
  ) {}

  private toObjectId(id?: string): Types.ObjectId | undefined {
    if (!id) return undefined;
    return new Types.ObjectId(id);
  }

  private toRequiredObjectId(id: string, fieldName: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`${fieldName} debe ser un ObjectId válido`);
    }

    return new Types.ObjectId(id);
  }

  private getCurrentTenantId(currentUser?: any): string | undefined {
    return (
      currentUser?.tenantId?.toString?.() ??
      currentUser?.activeTenantId?.toString?.() ??
      currentUser?.clientId?.toString?.()
    );
  }

  private isRestrictedByArea(currentUser?: any): boolean {
    if (!currentUser) return false;
    if ([UserRole.AREA_ADMIN, UserRole.VIEWER, UserRole.AUDITOR].includes(currentUser.role)) {
      return true;
    }

    return this.isOperationalUser(currentUser) && this.getUserAreaIds(currentUser).length > 0;
  }

  private isOperationalUser(currentUser?: any): boolean {
    return normalizeRole(currentUser?.role) === "PENTESTER_QA";
  }

  private shouldBypassTenantFilter(currentUser?: any): boolean {
    return this.isOperationalUser(currentUser) && !this.getCurrentTenantId(currentUser);
  }

  private getUserAreaIds(currentUser?: any): string[] {
    return currentUser?.areaIds?.map((id: any) => id.toString()) || [];
  }

  private resolveProjectTenantId(project: any): string | undefined {
    return (
      project?.tenantId?.toString?.() ??
      project?.clientId?._id?.toString?.() ??
      project?.clientId?.toString?.()
    );
  }

  private resolveFindingTenantId(finding: any): string | undefined {
    return (
      finding?.tenantId?.toString?.() ??
      finding?.projectId?.tenantId?.toString?.() ??
      finding?.projectId?.clientId?._id?.toString?.() ??
      finding?.projectId?.clientId?.toString?.()
    );
  }

  private getUserFullName(user: any): string {
    const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
    return fullName || user?.email || "Usuario";
  }

  private getProjectName(project: any): string {
    return project?.name || project?.projectName || "Proyecto sin nombre";
  }

  private areObjectIdsEqual(a: any, b: any): boolean {
    if (!a || !b) return false;
    return a.toString() === b.toString();
  }

  private async sendFindingCreatedNotification(
    finding: any,
    project: any,
    createdByUserId: string,
  ): Promise<void> {
    try {
      const creator = await this.userModel.findById(createdByUserId).lean();

      if (!creator || !creator.email) {
        return;
      }

      await this.emailService.notifyFindingCreated(
        creator.email,
        this.getUserFullName(creator),
        finding.title,
        finding.code || finding._id.toString(),
        finding.severity,
        this.getProjectName(project),
        finding.description,
      );

      this.logger.log(`Email de hallazgo creado enviado a ${creator.email}`);
    } catch (emailError: any) {
      this.logger.warn(
        `No se pudo enviar email de hallazgo creado: ${emailError?.message}`,
      );
    }
  }

  private async sendFindingAssignedNotification(
    assignedUserId: any,
    finding: any,
    project?: any,
  ): Promise<void> {
    try {
      if (!assignedUserId) return;

      const assignedUser = await this.userModel.findById(assignedUserId).lean();

      if (!assignedUser || !assignedUser.email) {
        return;
      }

      await this.emailService.notifyFindingAssigned(
        assignedUser.email,
        this.getUserFullName(assignedUser),
        finding.title,
        finding.code || finding._id.toString(),
        finding.severity,
        this.getProjectName(project),
        {
          tenantId:
            this.resolveFindingTenantId({
              ...finding,
              projectId: project || finding.projectId,
            }) || project?.tenantId?.toString?.(),
          projectId:
            project?._id?.toString?.() ||
            finding.projectId?._id?.toString?.() ||
            finding.projectId?.toString?.(),
        },
      );

      this.logger.log(
        `Email de hallazgo asignado enviado a ${assignedUser.email}`,
      );
    } catch (emailError: any) {
      this.logger.warn(
        `No se pudo enviar email de hallazgo asignado: ${emailError?.message}`,
      );
    }
  }

  private async sendFindingClosedNotifications(
    finding: any,
    closeReason: string,
  ): Promise<void> {
    try {
      const recipients = new Map<string, { email: string; name: string }>();

      if (finding.assignedTo) {
        const assignedUser = await this.userModel
          .findById(finding.assignedTo)
          .lean();
        if (assignedUser?.email) {
          recipients.set(assignedUser.email, {
            email: assignedUser.email,
            name: this.getUserFullName(assignedUser),
          });
        }
      }

      if (finding.createdBy) {
        const createdByUser = await this.userModel
          .findById(finding.createdBy)
          .lean();
        if (createdByUser?.email) {
          recipients.set(createdByUser.email, {
            email: createdByUser.email,
            name: this.getUserFullName(createdByUser),
          });
        }
      }

      const projectName =
        (finding.projectId as any)?.name ||
        (finding.projectId as any)?.projectName ||
        "Proyecto sin nombre";

      if (recipients.size === 0) {
        return;
      }

      await this.emailService.notifyFindingClosed(
        Array.from(recipients.values()).map((recipient) => ({
          email: recipient.email,
          name: recipient.name,
        })),
        finding.title,
        finding.code || finding._id.toString(),
        closeReason,
        projectName,
        {
          tenantId: this.resolveFindingTenantId(finding),
          projectId:
            (finding.projectId as any)?._id?.toString?.() ||
            finding.projectId?.toString?.(),
        },
      );

      for (const recipient of recipients.values()) {
        this.logger.log(`Email de cierre procesado para ${recipient.email}`);
      }
    } catch (emailError: any) {
      this.logger.warn(
        `No se pudo enviar email de cierre: ${emailError?.message}`,
      );
    }
  }

  private validateProjectAreaAccess(project: any, currentUser?: any): void {
    if (!currentUser || !this.isRestrictedByArea(currentUser)) {
      return;
    }

    const allowedAreas = this.getUserAreaIds(currentUser);
    const projectAreas =
      project?.areaIds?.map((a: any) => a?._id?.toString?.() || a.toString()) ||
      [];
    const legacyArea =
      project?.areaId?._id?.toString?.() || project?.areaId?.toString?.();

    const hasAccess = allowedAreas.some(
      (area: string) => projectAreas.includes(area) || legacyArea === area,
    );

    if (!allowedAreas.length || !hasAccess) {
      throw new ForbiddenException(
        "No tiene permisos para acceder a este recurso",
      );
    }
  }

  private async findProjectOrFailWithAccess(
    projectId: string,
    currentUser?: any,
  ): Promise<Project> {
    const projectQuery = this.projectModel
      .findById(projectId)
      .populate("clientId")
      .populate({ path: "areaId", options: { skipTenantFilter: true } })
      .populate({ path: "areaIds", options: { skipTenantFilter: true } });

    if (this.shouldBypassTenantFilter(currentUser)) {
      projectQuery.setOptions({ skipTenantFilter: true });
    }

    const project = await projectQuery;

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${projectId} no encontrado`);
    }

    const currentTenantId = this.getCurrentTenantId(currentUser);
    const projectTenantId = this.resolveProjectTenantId(project);

    if (
      currentUser &&
      !roleSatisfies(UserRole.OWNER, currentUser.role) &&
      currentTenantId &&
      projectTenantId &&
      currentTenantId !== projectTenantId
    ) {
      throw new ForbiddenException(
        "No tiene permisos para acceder a este proyecto",
      );
    }

    this.validateProjectAreaAccess(project, currentUser);

    return project;
  }

  private async findFindingOrFailWithAccess(
    id: string,
    currentUser?: any,
  ): Promise<Finding> {
    const findingQuery = this.findingModel
      .findById(id)
      .populate({
        path: "projectId",
        options: { skipTenantFilter: true },
        populate: [
          { path: "clientId" },
          { path: "areaId", options: { skipTenantFilter: true } },
          { path: "areaIds", options: { skipTenantFilter: true } },
        ],
      })
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("closedBy", "firstName lastName email");

    if (this.shouldBypassTenantFilter(currentUser)) {
      findingQuery.setOptions({ skipTenantFilter: true });
    }

    const finding = await findingQuery;

    if (!finding) {
      throw new NotFoundException(`Hallazgo con ID ${id} no encontrado`);
    }

    const currentTenantId = this.getCurrentTenantId(currentUser);
    const findingTenantId = this.resolveFindingTenantId(finding);

    if (
      currentUser &&
      !roleSatisfies(UserRole.OWNER, currentUser.role) &&
      currentTenantId &&
      findingTenantId &&
      currentTenantId !== findingTenantId
    ) {
      throw new ForbiddenException(
        "No tiene permisos para acceder a este hallazgo",
      );
    }

    const project = finding.projectId as any;
    this.validateProjectAreaAccess(project, currentUser);

    return finding;
  }

  /**
   * Crea un nuevo hallazgo
   * Genera código automático basado en configuración (Area > Global)
   * MULTI-TENANT: fuerza tenantId según proyecto/usuario autenticado
   */
  async create(
    dto: CreateFindingDto,
    createdBy: string,
    currentUser?: any,
  ): Promise<Finding> {
    const project = await this.findProjectOrFailWithAccess(
      dto.projectId,
      currentUser,
    );

    const currentTenantId =
      this.getCurrentTenantId(currentUser) ||
      this.resolveProjectTenantId(project);

    if (!currentTenantId) {
      throw new BadRequestException(
        "No se pudo determinar el tenant del hallazgo",
      );
    }

    // El correlativo `code` lo asigna el hook pre-save del esquema (contador atómico).
    const createPayload = {
      ...(dto as unknown as Record<string, unknown>),
    };
    delete createPayload.code;
    if (dto.cvssScore !== undefined) {
      createPayload.cvss_score = dto.cvssScore;
      delete createPayload.cvssScore;
    }

    const finding = new this.findingModel({
      ...(createPayload as unknown as CreateFindingDto),
      createdBy,
      status: FindingStatus.OPEN,
      tenantId: this.toObjectId(currentTenantId),
      projectId: this.toObjectId(dto.projectId),
    });

    await finding.save();

    this.logger.log(
      `Hallazgo creado: ${finding.code} - ${finding.title} (ID: ${finding._id})`,
    );

    await this.sendFindingCreatedNotification(finding, project, createdBy);

    if (finding.assignedTo) {
      await this.sendFindingAssignedNotification(
        finding.assignedTo,
        finding,
        project,
      );
    }

    return finding;
  }

  /**
   * Obtiene hallazgos con filtros
   * Por defecto, solo muestra hallazgos activos (no cerrados)
   * MULTI-TENANT: filtra por tenant y por área cuando corresponde
   */
  async findAll(
    filters: {
      projectId?: string;
      status?: FindingStatus;
      severity?: string;
      assignedTo?: string;
      includeClosed?: boolean;
    },
    currentUser?: any,
  ): Promise<Finding[]> {
    const query: any = {};
    const currentTenantId = this.getCurrentTenantId(currentUser);
    const restrictedByArea = this.isRestrictedByArea(currentUser);
    const allowedAreas = this.getUserAreaIds(currentUser);

    const isGlobalUser = roleSatisfies(UserRole.OWNER, currentUser?.role);
    if (currentTenantId && !isGlobalUser) {
      query.tenantId = this.toObjectId(currentTenantId);
    }

    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;

    if (!filters.includeClosed && !filters.status) {
      query.status = { $ne: FindingStatus.CLOSED };
    }

    if (filters.projectId) {
      await this.findProjectOrFailWithAccess(filters.projectId, currentUser);
      query.projectId = this.toObjectId(filters.projectId);
    } else if (restrictedByArea) {
      if (!allowedAreas.length) {
        return [];
      }

      const areaObjectIds = allowedAreas
        .map((id) => this.toObjectId(id))
        .filter(Boolean);

      const accessibleProjectsQuery = this.projectModel
        .find({
          ...(currentTenantId
            ? { tenantId: this.toObjectId(currentTenantId) }
            : {}),
          $or: [
            { areaIds: { $in: areaObjectIds } },
            { areaId: { $in: areaObjectIds } },
          ],
        })
        .select("_id");

      if (this.shouldBypassTenantFilter(currentUser)) {
        accessibleProjectsQuery.setOptions({ skipTenantFilter: true });
      }

      const accessibleProjects = await accessibleProjectsQuery;

      const projectIds = accessibleProjects.map((p: any) => p._id);

      if (!projectIds.length) {
        return [];
      }

      query.projectId = { $in: projectIds };
    }

    const findingsQuery = this.findingModel
      .find(query)
      .populate({
        path: "projectId",
        select: "name code clientId tenantId areaId areaIds",
        options: { skipTenantFilter: true },
      })
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    if (this.shouldBypassTenantFilter(currentUser)) {
      findingsQuery.setOptions({ skipTenantFilter: true });
    }

    return findingsQuery;
  }

  /**
   * Busca hallazgo por ID
   * MULTI-TENANT: valida acceso por tenant y área
   */
  async findById(id: string, currentUser?: any): Promise<Finding> {
    return this.findFindingOrFailWithAccess(id, currentUser);
  }

  /**
   * Actualiza un hallazgo
   * Si cambia el status, crea automáticamente una entrada en el timeline
   * MULTI-TENANT: valida acceso antes de modificar
   */
  async update(
    id: string,
    dto: UpdateFindingDto,
    userId: string,
    currentUser?: any,
  ): Promise<Finding> {
    const finding = await this.findFindingOrFailWithAccess(id, currentUser);
    const currentTenantId =
      this.getCurrentTenantId(currentUser) ||
      this.resolveFindingTenantId(finding);

    const previousAssignedTo = finding.assignedTo
      ? (finding.assignedTo as any)?._id?.toString?.() ||
        finding.assignedTo.toString()
      : undefined;

    const previousStatus = finding.status;

    if ((dto as any).tenantId !== undefined) {
      delete (dto as any).tenantId;
    }

    if (dto.cvssScore !== undefined) {
      (dto as any).cvss_score = dto.cvssScore;
      delete (dto as any).cvssScore;
    }

    if ((dto as any).projectId !== undefined) {
      const targetProject = await this.findProjectOrFailWithAccess(
        dto.projectId as any,
        currentUser,
      );

      const targetProjectTenantId = this.resolveProjectTenantId(targetProject);
      if (
        currentTenantId &&
        targetProjectTenantId &&
        currentTenantId !== targetProjectTenantId
      ) {
        throw new ForbiddenException(
          "No puede mover el hallazgo a un proyecto de otro tenant",
        );
      }

      (dto as any).projectId = this.toObjectId(dto.projectId as any);
      (dto as any).tenantId = this.toObjectId(targetProjectTenantId);
    }

    const statusChanged = dto.status && dto.status !== finding.status;
    const assignedChanged =
      dto.assignedTo !== undefined &&
      !this.areObjectIdsEqual(dto.assignedTo, previousAssignedTo);

    if (statusChanged) {
      if (dto.status === FindingStatus.CLOSED) {
        finding.closedAt = new Date();
        finding.closedBy = userId as any;
      } else if (previousStatus === FindingStatus.CLOSED) {
        finding.closedAt = undefined;
        finding.closedBy = undefined;
      }
    }

    Object.assign(finding, dto);
    await finding.save();

    if (statusChanged && dto.status) {
      await this.createStatusChangeUpdate(
        id,
        previousStatus,
        dto.status,
        userId,
        `Estado actualizado de ${previousStatus} a ${dto.status}`,
      );

      this.logger.log(
        `Estado del hallazgo ${finding.code} cambiado de ${previousStatus} a ${dto.status}`,
      );
    }

    if (assignedChanged && finding.assignedTo) {
      const project = (finding.projectId as any) || undefined;
      await this.sendFindingAssignedNotification(
        finding.assignedTo,
        finding,
        project,
      );
    }

    if (statusChanged && dto.status === FindingStatus.CLOSED) {
      await this.sendFindingClosedNotifications(
        finding,
        finding.closeReason || "Cierre de hallazgo",
      );
    }

    this.logger.log(`Hallazgo actualizado: ${finding.code} (ID: ${id})`);
    return finding;
  }

  /**
   * Cierra masivamente hallazgos accesibles para el usuario
   */
  async bulkClose(
    ids: string[],
    userId: string,
    currentUser?: any,
    closeReason: CloseReason = CloseReason.FIXED,
  ): Promise<number> {
    if (!ids || ids.length === 0) return 0;

    const allowedIds: string[] = [];

    for (const id of ids) {
      const finding = await this.findFindingOrFailWithAccess(id, currentUser);
      if (finding && finding.status !== FindingStatus.CLOSED) {
        allowedIds.push(id);
      }
    }

    if (!allowedIds.length) return 0;

    const result = await this.findingModel.updateMany(
      { _id: { $in: allowedIds } },
      {
        $set: {
          status: FindingStatus.CLOSED,
          closeReason: closeReason,
          closedAt: new Date(),
          closedBy: userId,
        },
      },
    );

    this.logger.log(
      `${result.modifiedCount} hallazgos cerrados masivamente por usuario ${userId}`,
    );
    return result.modifiedCount;
  }

  /**
   * Cierra un hallazgo con motivo específico
   * MULTI-TENANT: valida acceso antes de cerrar
   */
  async close(
    id: string,
    dto: CloseFindingDto,
    userId: string,
    currentUser?: any,
  ): Promise<Finding> {
    const finding = await this.findFindingOrFailWithAccess(id, currentUser);

    if (finding.status === FindingStatus.CLOSED) {
      throw new BadRequestException("El hallazgo ya está cerrado");
    }

    const previousStatus = finding.status;

    finding.status = FindingStatus.CLOSED;
    finding.closeReason = dto.closeReason;
    finding.closedAt = new Date();
    finding.closedBy = userId as any;
    await finding.save();

    await this.createStatusChangeUpdate(
      id,
      previousStatus,
      FindingStatus.CLOSED,
      userId,
      dto.comment || `Hallazgo cerrado: ${dto.closeReason}`,
    );

    this.logger.log(
      `Hallazgo cerrado: ${finding.code} - Motivo: ${dto.closeReason}`,
    );

    await this.sendFindingClosedNotifications(finding, dto.closeReason);

    return finding;
  }

  /**
   * Obtiene hallazgos de un proyecto que deben incluirse en retest
   * MULTI-TENANT: valida acceso al proyecto
   */
  async findForRetest(
    projectId: string,
    currentUser?: any,
  ): Promise<Finding[]> {
    await this.findProjectOrFailWithAccess(projectId, currentUser);

    const query: any = {
      projectId: this.toObjectId(projectId),
      retestIncluded: true,
      status: { $ne: FindingStatus.CLOSED },
    };

    const currentTenantId = this.getCurrentTenantId(currentUser);
    if (currentTenantId && !roleSatisfies(UserRole.OWNER, currentUser?.role)) {
      query.tenantId = this.toObjectId(currentTenantId);
    }

    const retestQuery = this.findingModel
      .find(query)
      .select("code title severity status");

    if (this.shouldBypassTenantFilter(currentUser)) {
      retestQuery.setOptions({ skipTenantFilter: true });
    }

    return retestQuery;
  }

  /**
   * TIMELINE - Crea una actualización de hallazgo
   * MULTI-TENANT: valida acceso por tenant y área
   */
  async createUpdate(
    dto: CreateFindingUpdateDto,
    createdBy: string,
    currentUser?: any,
  ): Promise<FindingUpdate> {
    await this.findFindingOrFailWithAccess(dto.findingId, currentUser);

    const findingObjectId = this.toRequiredObjectId(dto.findingId, "findingId");
    const createdByObjectId = this.toRequiredObjectId(createdBy, "createdBy");
    const evidenceObjectIds = (dto.evidenceIds || []).map((evidenceId) =>
      this.toRequiredObjectId(evidenceId, "evidenceIds"),
    );

    const update = new this.updateModel({
      findingId: findingObjectId,
      type: dto.type,
      content: dto.content,
      evidenceIds: evidenceObjectIds,
      createdBy: createdByObjectId,
    });

    await update.save();

    this.logger.log(
      `Update creado para hallazgo ${dto.findingId}: Tipo ${dto.type}`,
    );
    return update;
  }

  /**
   * TIMELINE - Obtiene el historial de un hallazgo
   * MULTI-TENANT: valida acceso antes de leer timeline
   */
  async getTimeline(
    findingId: string,
    currentUser?: any,
  ): Promise<FindingUpdate[]> {
    await this.findFindingOrFailWithAccess(findingId, currentUser);
    const findingObjectId = this.toRequiredObjectId(findingId, "findingId");

    return this.updateModel
      .find({ findingId: findingObjectId })
      .populate("createdBy", "firstName lastName email")
      .populate("evidenceIds", "filename mimeType size")
      .sort({ createdAt: -1 });
  }

  /**
   * Crea automáticamente una entrada de cambio de estado en el timeline
   */
  private async createStatusChangeUpdate(
    findingId: string,
    previousStatus: FindingStatus,
    newStatus: FindingStatus,
    userId: string,
    content: string,
  ): Promise<void> {
    const update = new this.updateModel({
      findingId: this.toRequiredObjectId(findingId, "findingId"),
      type: FindingUpdateType.STATUS_CHANGE,
      content,
      previousStatus,
      newStatus,
      createdBy: this.toRequiredObjectId(userId, "createdBy"),
    });

    await update.save();
  }

  /**
   * Hard delete - Solo OWNER
   * MULTI-TENANT: valida acceso antes de eliminar
   */
  async hardDelete(id: string, currentUser?: any): Promise<void> {
    await this.findFindingOrFailWithAccess(id, currentUser);

    await this.updateModel.deleteMany({ findingId: id });

    const result = await this.findingModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException(`Hallazgo con ID ${id} no encontrado`);
    }

    this.logger.warn(
      `Hallazgo ELIMINADO permanentemente: ${result.code} (ID: ${id})`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BULK IMPORT — M8
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Importa hallazgos masivamente desde un archivo CSV (;) o XLSX.
   * Resuelve cliente y proyecto desde las columnas del archivo.
   * Crea cliente y proyecto automáticamente si no existen.
   * Inserta uno por uno con .save() para que el hook pre-save genere el código.
   */
  async bulkImport(
    file: Express.Multer.File,
    projectName: string,
    currentUser: any,
  ): Promise<{ creados: number; fallidos: number; errores: { fila: number; detalle: string }[] }> {
    const resolvedProjectName = (projectName || "").trim() || "Importación CSV";

    // 1. Parsear el archivo
    const ext = (file.originalname || "").split(".").pop()?.toLowerCase();
    let rows: Record<string, string>[];

    try {
      rows = ext === "xlsx" || ext === "xls"
        ? await this.parseExcel(file.buffer)
        : this.parseCsv(file.buffer);
    } catch (e) {
      throw new BadRequestException(`Error al leer el archivo: ${e.message}`);
    }

    // 2. Procesar fila por fila
    const errores: { fila: number; detalle: string }[] = [];
    let creados = 0;
    let fallidos = 0;

    // Cache de resolución cliente→{projectId, tenantId} para evitar N+1
    const contextCache = new Map<string, { projectId: Types.ObjectId; tenantId: Types.ObjectId }>();

    for (let i = 0; i < rows.length; i++) {
      const fila = i + 2; // +2 porque la fila 1 es el header
      const row = rows[i];

      // Saltar filas completamente vacías
      const titulo = this.cell(row, "Título", "Titulo");
      if (!titulo) continue;

      try {
        // Validar campos obligatorios
        const missingFields: string[] = [];
        if (!titulo) missingFields.push("Título");
        if (!this.cell(row, "Descripción", "Descripcion")) missingFields.push("Descripción");
        if (!this.cell(row, "CAT-COD-interno")) missingFields.push("CAT-COD-interno");
        if (!this.cell(row, "Criticidad")) missingFields.push("Criticidad");
        if (!this.cell(row, "Cliente")) missingFields.push("Cliente");
        if (missingFields.length > 0) {
          errores.push({ fila, detalle: `Campos obligatorios faltantes: ${missingFields.join(", ")}` });
          fallidos++;
          continue;
        }

        const severity = this.normalizeSeverity(this.cell(row, "Criticidad"));
        if (!severity) {
          errores.push({ fila, detalle: `Criticidad inválida: "${this.cell(row, "Criticidad")}"` });
          fallidos++;
          continue;
        }

        // Resolver cliente / proyecto / área desde la columna "Cliente"
        const clientName = this.cell(row, "Cliente").trim();
        if (!contextCache.has(clientName)) {
          const ctx = await this.findOrCreateClientProjectArea(clientName, resolvedProjectName, currentUser);
          contextCache.set(clientName, ctx);
        }
        const { projectId, tenantId } = contextCache.get(clientName)!;

        const internalCode = this.cell(row, "CAT-COD-interno");
        const description = this.cell(row, "Descripción", "Descripcion");

        // Activos afectados: Dominio + Subdominio
        const assets = this.parseAssets(
          this.cell(row, "Dominio asociado"),
          this.cell(row, "Subdominio"),
        );

        // Tags: Categoria + REQUIRES_DEEP_REVIEW
        const tags: string[] = [];
        const cat = this.cell(row, "Categoria", "Categoría");
        if (cat) tags.push(cat);
        const revisarFlag = this.cell(row, "Revisar en profundidad");
        if (revisarFlag && /^(si|sí|yes|true|1)$/i.test(revisarFlag.trim())) {
          tags.push("REQUIRES_DEEP_REVIEW");
        }

        // CVE
        const cve = this.normalizeCVE(this.cell(row, "CVE/EUVD"));

        // CVSS score
        const cvss = this.parseCVSS(this.cell(row, "cvss_score (si aplica)", "cvss_score"));

        // Referencias
        const refs = this.parseReferences(this.cell(row, "referencias(NIST, MITRE, ENISA, INCIBE)", "referencias"));

        // Evidencia → riskJustification
        const evidencia = this.cell(row, "Evidencia");
        const observaciones = this.cell(row, "Observaciones");
        const riskJustification = [evidencia, observaciones].filter(Boolean).join("\n\n") || undefined;

        // Detection source
        const detectionSource =
          this.cell(row, "fuente_detectado") ||
          this.cell(row, "Metodo_de_busqueda") ||
          undefined;

        // Construir documento (sin código — lo genera pre-save)
        const finding = new this.findingModel({
          internal_code: internalCode,
          title: titulo,
          description,
          severity,
          status: FindingStatus.OPEN,
          projectId,
          tenantId,
          createdBy: this.toObjectId(currentUser.userId || currentUser._id),
          affectedAssets: assets,
          tags,
          ...(cve ? { cve_id: cve } : {}),
          ...(cvss !== undefined ? { cvss_score: cvss } : {}),
          ...(detectionSource ? { detection_source: detectionSource } : {}),
          ...(this.cell(row, "Impacto") ? { impact: this.cell(row, "Impacto") } : {}),
          ...(this.cell(row, "Recomendación", "Recomendacion") ? { recommendation: this.cell(row, "Recomendación", "Recomendacion") } : {}),
          ...(refs.length ? { references: refs } : {}),
          ...(riskJustification ? { riskJustification } : {}),
        });

        await finding.save();

        // Sobreescribir createdAt con fecha histórica si viene en el CSV
        const historicalDate = this.parseDate(this.cell(row, "fecha_hallazgo"));
        if (historicalDate) {
          await this.findingModel.updateOne(
            { _id: finding._id },
            { $set: { createdAt: historicalDate } },
          ).setOptions({ skipTenantFilter: true });
        }

        creados++;
      } catch (e) {
        errores.push({ fila, detalle: e.message || String(e) });
        fallidos++;
      }
    }

    this.logger.log(
      `Bulk import (proyecto "${resolvedProjectName}"): ${creados} creados, ${fallidos} fallidos`,
    );

    return { creados, fallidos, errores };
  }

  /**
   * Busca o crea el cliente, proyecto y área necesarios para insertar hallazgos.
   * Usamos skipTenantFilter para operar cross-tenant (solo OWNER/ADMIN pueden llamar bulkImport).
   */
  private async findOrCreateClientProjectArea(
    clientName: string,
    projectName: string,
    currentUser: any,
  ): Promise<{ projectId: Types.ObjectId; tenantId: Types.ObjectId }> {
    const escapedName = clientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 1. Buscar o crear cliente
    let client = await this.clientModel
      .findOne({ name: new RegExp(`^${escapedName}$`, "i") })
      .setOptions({ skipTenantFilter: true });

    if (!client) {
      client = new this.clientModel({ name: clientName, isActive: true });
      await client.save();
      this.logger.log(`Bulk import: cliente creado automáticamente → "${clientName}"`);
    }

    const tenantId = client._id as Types.ObjectId;

    // 2. Buscar o crear proyecto
    let project = await this.projectModel
      .findOne({ name: projectName, tenantId })
      .setOptions({ skipTenantFilter: true });

    if (!project) {
      project = new this.projectModel({
        name: projectName,
        tenantId,
        serviceArchitecture: ServiceArchitecture.HYBRID,
      });
      await project.save();
      this.logger.log(`Bulk import: proyecto creado → "${projectName}" para cliente "${clientName}"`);
    }

    const projectId = project._id as Types.ObjectId;

    // 3. Buscar o crear área por defecto para este tenant
    const areaCode = "IMP-DEFAULT";
    let area = await this.areaModel
      .findOne({ tenantId, code: areaCode })
      .setOptions({ skipTenantFilter: true });

    if (!area) {
      area = new this.areaModel({
        name: "Importación CSV",
        code: areaCode,
        tenantId,
        findingCodePrefix: "VULN",
      });
      await area.save();
      this.logger.log(`Bulk import: área creada → "${areaCode}" para cliente "${clientName}"`);
    }

    // Vincular área al proyecto si aún no está
    await this.projectModel
      .findByIdAndUpdate(projectId, { $addToSet: { areaIds: area._id } })
      .setOptions({ skipTenantFilter: true });

    return { projectId, tenantId };
  }

  /** Lee columna por uno o más alias (case-insensitive) */
  private cell(row: Record<string, string>, ...keys: string[]): string {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) return String(row[key]).trim();
      // búsqueda case-insensitive
      const found = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
      if (found && row[found] !== undefined) return String(row[found]).trim();
    }
    return "";
  }

  /** Parsea CSV con separador ; — detecta encoding UTF-8 (con/sin BOM) y Windows-1252 */
  private parseCsv(buffer: Buffer): Record<string, string>[] {
    // Detectar y normalizar encoding
    let text: string;
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      text = buffer.slice(3).toString("utf8");
    } else {
      const utf8 = buffer.toString("utf8");
      // Si hay caracteres de reemplazo, el archivo es Windows-1252 (CSV de Excel en Windows)
      if (utf8.includes("�")) {
        const iconv = require("iconv-lite");
        text = iconv.decode(buffer, "cp1252");
      } else {
        text = utf8;
      }
    }

    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    if (lines.length === 0) return [];

    const headers = this.parseCsvRow(lines[0]);
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = this.parseCsvRow(lines[i]);
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (h) obj[h] = (values[idx] ?? "").trim();
      });
      rows.push(obj);
    }

    return rows;
  }

  /** Parsea una línea CSV con delimitador ; y soporte para campos entre comillas */
  private parseCsvRow(line: string): string[] {
    const result: string[] = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ";") {
        result.push(field);
        field = "";
      } else {
        field += ch;
      }
    }
    result.push(field);
    return result;
  }

  /** Parsea XLSX usando ExcelJS */
  private async parseExcel(buffer: any): Promise<Record<string, string>[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    const headers: string[] = [];
    const rows: Record<string, string>[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          headers[colNumber - 1] = String(cell.value ?? "").trim();
        });
        return;
      }
      const obj: Record<string, string> = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          const val = cell.value;
          obj[header] = val instanceof Date
            ? val.toISOString()
            : String(val ?? "").trim();
        }
      });
      rows.push(obj);
    });

    return rows;
  }

  private normalizeSeverity(raw: string): FindingSeverity | null {
    const clean = (raw || "")
      .toLowerCase()
      .trim()
      .replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i")
      .replace(/ó/g, "o").replace(/ú/g, "u");

    const map: Record<string, FindingSeverity> = {
      critica: FindingSeverity.CRITICAL,
      critical: FindingSeverity.CRITICAL,
      alta: FindingSeverity.HIGH,
      alto: FindingSeverity.HIGH,
      high: FindingSeverity.HIGH,
      media: FindingSeverity.MEDIUM,
      medio: FindingSeverity.MEDIUM,
      medium: FindingSeverity.MEDIUM,
      baja: FindingSeverity.LOW,
      bajo: FindingSeverity.LOW,
      low: FindingSeverity.LOW,
      informativa: FindingSeverity.INFORMATIONAL,
      informativo: FindingSeverity.INFORMATIONAL,
      informational: FindingSeverity.INFORMATIONAL,
      info: FindingSeverity.INFORMATIONAL,
    };
    return map[clean] ?? null;
  }

  private normalizeCVE(raw: string): string | undefined {
    if (!raw || raw.toUpperCase() === "N/A") return undefined;
    const match = raw.match(/CVE-\d{4}-\d{4,7}/i);
    return match ? match[0].toUpperCase() : undefined;
  }

  private parseCVSS(raw: string): number | undefined {
    if (!raw || raw.toUpperCase() === "N/A") return undefined;
    const n = parseFloat(raw.replace(",", ".").replace(/[^\d.]/g, "").slice(0, 4));
    if (isNaN(n) || n < 0 || n > 10) return undefined;
    return n;
  }

  private parseAssets(domain: string, subdomain: string): string[] {
    const all: string[] = [];
    const addParts = (s: string) => {
      if (s && s.toUpperCase() !== "N/A") {
        s.split(/[;,\n\t\/]/).map(p => p.trim()).filter(Boolean).forEach(p => all.push(p));
      }
    };
    addParts(domain);
    addParts(subdomain);
    return [...new Set(all)];
  }

  private parseReferences(raw: string): string[] {
    if (!raw) return [];
    return raw.split(/[,;\n]/).map(r => r.trim()).filter(Boolean);
  }

  private parseDate(raw: string): Date | undefined {
    if (!raw || raw.toUpperCase() === "N/A" || raw === "-") return undefined;

    // DD/MM/YYYY
    const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
      return isNaN(d.getTime()) ? undefined : d;
    }

    // YYYY-MM-DD
    const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymd) {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? undefined : d;
    }

    // YYYY-MM (e.g. 2025-10)
    const ym = raw.match(/^(\d{4})-(\d{1,2})$/);
    if (ym) return new Date(Number(ym[1]), Number(ym[2]) - 1, 1);

    // dic-25, ene-26, etc.
    const monthMap: Record<string, number> = {
      ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
      jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
    };
    const mes = raw.match(/^([a-záéíóú]{3})-(\d{2})$/i);
    if (mes) {
      const month = monthMap[mes[1].toLowerCase()];
      if (month !== undefined) return new Date(2000 + Number(mes[2]), month, 1);
    }

    const fallback = new Date(raw);
    return isNaN(fallback.getTime()) ? undefined : fallback;
  }
}
