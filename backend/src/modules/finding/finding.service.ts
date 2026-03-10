import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Finding } from './schemas/finding.schema';
import { FindingUpdate } from './schemas/finding-update.schema';
import {
  CreateFindingDto,
  UpdateFindingDto,
  CloseFindingDto,
} from './dto/finding.dto';
import { CreateFindingUpdateDto } from './dto/finding-update.dto';
import { FindingStatus, FindingUpdateType } from '../../common/enums';
import { Project } from '../project/schemas/project.schema';
import { SystemConfig } from '../system-config/schemas/system-config.schema';
import { Area } from '../area/schemas/area.schema';
import { User } from '../auth/schemas/user.schema';
import { EmailService } from '../email/email.service';

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
    private emailService: EmailService,
  ) {}

  private toObjectId(id?: string): Types.ObjectId | undefined {
    if (!id) return undefined;
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
    return ['AREA_ADMIN', 'ANALYST', 'VIEWER'].includes(currentUser?.role);
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
        'No tiene permisos para acceder a este recurso',
      );
    }
  }

  private async findProjectOrFailWithAccess(
    projectId: string,
    currentUser?: any,
  ): Promise<Project> {
    const project = await this.projectModel
      .findById(projectId)
      .populate('clientId')
      .populate('areaId')
      .populate('areaIds');

    if (!project) {
      throw new NotFoundException(
        `Proyecto con ID ${projectId} no encontrado`,
      );
    }

    const currentTenantId = this.getCurrentTenantId(currentUser);
    const projectTenantId = this.resolveProjectTenantId(project);

    if (
      currentUser &&
      !['OWNER', 'PLATFORM_ADMIN'].includes(currentUser.role) &&
      currentTenantId &&
      projectTenantId &&
      currentTenantId !== projectTenantId
    ) {
      throw new ForbiddenException(
        'No tiene permisos para acceder a este proyecto',
      );
    }

    this.validateProjectAreaAccess(project, currentUser);

    return project;
  }

  private async findFindingOrFailWithAccess(
    id: string,
    currentUser?: any,
  ): Promise<Finding> {
    const finding = await this.findingModel
      .findById(id)
      .populate({
        path: 'projectId',
        populate: [
          { path: 'clientId' },
          { path: 'areaId' },
          { path: 'areaIds' },
        ],
      })
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('closedBy', 'firstName lastName email');

    if (!finding) {
      throw new NotFoundException(`Hallazgo con ID ${id} no encontrado`);
    }

    const currentTenantId = this.getCurrentTenantId(currentUser);
    const findingTenantId = this.resolveFindingTenantId(finding);

    if (
      currentUser &&
      !['OWNER', 'PLATFORM_ADMIN'].includes(currentUser.role) &&
      currentTenantId &&
      findingTenantId &&
      currentTenantId !== findingTenantId
    ) {
      throw new ForbiddenException(
        'No tiene permisos para acceder a este hallazgo',
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
      this.getCurrentTenantId(currentUser) || this.resolveProjectTenantId(project);

    if (!currentTenantId) {
      throw new BadRequestException(
        'No se pudo determinar el tenant del hallazgo',
      );
    }

    // GENERACIÓN DE CÓDIGO DINÁMICO
    let prefix = 'VULN';

    if (project.areaIds && project.areaIds.length > 0) {
      const firstArea = project.areaIds[0] as any;
      if (firstArea.findingCodePrefix) prefix = firstArea.findingCodePrefix;
    } else if (project.areaId && (project.areaId as any).findingCodePrefix) {
      prefix = (project.areaId as any).findingCodePrefix;
    } else {
      await this.systemConfigModel.findOne({ configKey: 'smtp_config' });
    }

    const regex = new RegExp(`^${prefix}-\\d+$`);
    const lastFinding = await this.findingModel
      .findOne({
        tenantId: this.toObjectId(currentTenantId),
        code: { $regex: regex },
      })
      .sort({ createdAt: -1 })
      .select('code');

    let nextNum = 1;
    if (lastFinding && lastFinding.code) {
      const parts = lastFinding.code.split('-');
      const numPart = parts[parts.length - 1];
      if (!isNaN(Number(numPart))) {
        nextNum = Number(numPart) + 1;
      }
    }

    const generatedCode = `${prefix}-${String(nextNum).padStart(6, '0')}`;

    const finding = new this.findingModel({
      ...dto,
      code: generatedCode,
      createdBy,
      status: FindingStatus.OPEN,
      tenantId: this.toObjectId(currentTenantId),
      projectId: this.toObjectId(dto.projectId),
    });

    await finding.save();

    this.logger.log(
      `Hallazgo creado: ${finding.code} - ${finding.title} (ID: ${finding._id})`,
    );

    if (finding.assignedTo) {
      try {
        const assignedUser = await this.userModel.findById(finding.assignedTo);
        if (assignedUser && assignedUser.email) {
          await this.emailService.notifyFindingAssigned(
            assignedUser.email,
            `${assignedUser.firstName} ${assignedUser.lastName}`,
            finding.title,
            finding.code || finding._id.toString(),
            finding.severity,
          );
          this.logger.log(
            `Email de nuevo hallazgo enviado a ${assignedUser.email}`,
          );
        }
      } catch (emailError: any) {
        this.logger.warn(
          `No se pudo enviar email de hallazgo: ${emailError?.message}`,
        );
      }
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

    if (currentTenantId) {
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

      const accessibleProjects = await this.projectModel
        .find({
          ...(currentTenantId ? { tenantId: this.toObjectId(currentTenantId) } : {}),
          $or: [
            { areaIds: { $in: allowedAreas.map((id) => this.toObjectId(id)).filter(Boolean) } },
            { areaId: { $in: allowedAreas.map((id) => this.toObjectId(id)).filter(Boolean) } },
          ],
        })
        .select('_id');

      const projectIds = accessibleProjects.map((p: any) => p._id);

      if (!projectIds.length) {
        return [];
      }

      query.projectId = { $in: projectIds };
    }

    return this.findingModel
      .find(query)
      .populate('projectId', 'name code clientId tenantId areaId areaIds')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
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
      this.getCurrentTenantId(currentUser) || this.resolveFindingTenantId(finding);

    if ((dto as any).tenantId !== undefined) {
      delete (dto as any).tenantId;
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
          'No puede mover el hallazgo a un proyecto de otro tenant',
        );
      }

      (dto as any).projectId = this.toObjectId(dto.projectId as any);
      (dto as any).tenantId = this.toObjectId(targetProjectTenantId);
    }

    const statusChanged = dto.status && dto.status !== finding.status;
    const previousStatus = finding.status;

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
    closeReason: string = 'Bulk Close',
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
      throw new BadRequestException('El hallazgo ya está cerrado');
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

    if (finding.assignedTo) {
      try {
        const assignedUser = await this.userModel.findById(finding.assignedTo);
        if (assignedUser && assignedUser.email) {
          await this.emailService.notifyFindingClosed(
            assignedUser.email,
            `${assignedUser.firstName} ${assignedUser.lastName}`,
            finding.title,
            finding.code || finding._id.toString(),
            dto.closeReason,
          );
          this.logger.log(`Email de cierre enviado a ${assignedUser.email}`);
        }
      } catch (emailError: any) {
        this.logger.warn(
          `No se pudo enviar email de cierre: ${emailError?.message}`,
        );
      }
    }

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
    if (currentTenantId) {
      query.tenantId = this.toObjectId(currentTenantId);
    }

    return this.findingModel
      .find(query)
      .select('code title severity status');
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

    const update = new this.updateModel({
      ...dto,
      createdBy,
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

    return this.updateModel
      .find({ findingId })
      .populate('createdBy', 'firstName lastName email')
      .populate('evidenceIds', 'filename mimeType size')
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
      findingId,
      type: FindingUpdateType.STATUS_CHANGE,
      content,
      previousStatus,
      newStatus,
      createdBy: userId,
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
}