import { Injectable, NotFoundException, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Finding } from './schemas/finding.schema';
import { FindingUpdate } from './schemas/finding-update.schema';
import { CreateFindingDto, UpdateFindingDto, CloseFindingDto } from './dto/finding.dto';
import { CreateFindingUpdateDto } from './dto/finding-update.dto';
import { FindingStatus, FindingUpdateType } from '../../common/enums';
import { Project } from '../project/schemas/project.schema';

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
  ) {}

  /**
   * Crea un nuevo hallazgo
   */
  async create(dto: CreateFindingDto, createdBy: string, currentUser?: any): Promise<Finding> {
    // SECURITY FIX C3: Validar que el proyecto pertenece al cliente del usuario
    if (currentUser) {
      const project = await this.projectModel.findById(dto.projectId).populate('clientId');
      if (!project) {
        throw new NotFoundException(`Proyecto con ID ${dto.projectId} no encontrado`);
      }

      // Solo OWNER y PLATFORM_ADMIN pueden crear en cualquier proyecto
      const globalRoles = ['OWNER', 'PLATFORM_ADMIN'];
      if (!globalRoles.includes(currentUser.role)) {
        if (project.clientId.toString() !== currentUser.clientId?.toString()) {
          throw new ForbiddenException('No tiene permisos para crear hallazgos en este proyecto');
        }
      }
    }

    // Verificar que el código sea único
    const existing = await this.findingModel.findOne({ code: dto.code });
    if (existing) {
      throw new BadRequestException(`Ya existe un hallazgo con código ${dto.code}`);
    }

    const finding = new this.findingModel({
      ...dto,
      createdBy,
      status: FindingStatus.OPEN,
    });

    await finding.save();
    
    this.logger.log(`Hallazgo creado: ${finding.code} - ${finding.title} (ID: ${finding._id})`);
    return finding;
  }

  /**
   * Obtiene hallazgos con filtros
   * Por defecto, solo muestra hallazgos activos (no cerrados)
   * SECURITY FIX C3: Validación multi-tenant
   */
  async findAll(filters: {
    projectId?: string;
    status?: FindingStatus;
    severity?: string;
    assignedTo?: string;
    includeClosed?: boolean;
  }, currentUser?: any): Promise<Finding[]> {
    const query: any = {};

    if (filters.projectId) query.projectId = filters.projectId;
    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;

    // Por defecto, excluir cerrados en vista operativa
    if (!filters.includeClosed && !filters.status) {
      query.status = { $ne: FindingStatus.CLOSED };
    }

    // SECURITY FIX C3: Filtrado multi-tenant
    if (currentUser) {
      const restrictedRoles = ['CLIENT_ADMIN', 'AREA_ADMIN', 'ANALYST', 'VIEWER'];
      if (restrictedRoles.includes(currentUser.role) && currentUser.clientId) {
        // Obtener proyectos del cliente
        const projects = await this.projectModel.find({ clientId: currentUser.clientId }).select('_id');
        const projectIds = projects.map((p: any) => p._id);
        query.projectId = { $in: projectIds };
      }
    }

    return this.findingModel.find(query)
      .populate('projectId', 'name code')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  /**
   * Busca hallazgo por ID
   * SECURITY FIX C3: Validación de tenant ownership
   */
  async findById(id: string, currentUser?: any): Promise<Finding> {
    const finding = await this.findingModel.findById(id)
      .populate('projectId', 'name code clientId areaId')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('closedBy', 'firstName lastName email');
    
    if (!finding) {
      throw new NotFoundException(`Hallazgo con ID ${id} no encontrado`);
    }

    // SECURITY FIX C3: Validar acceso multi-tenant
    if (currentUser) {
      const restrictedRoles = ['CLIENT_ADMIN', 'AREA_ADMIN', 'ANALYST', 'VIEWER'];
      if (restrictedRoles.includes(currentUser.role) && currentUser.clientId) {
        const project = finding.projectId as any;
        if (project.clientId.toString() !== currentUser.clientId.toString()) {
          throw new ForbiddenException('No tiene permisos para acceder a este hallazgo');
        }
      }
    }

    return finding;
  }

  /**
   * Actualiza un hallazgo
   * Si cambia el status, crea automáticamente una entrada en el timeline
   */
  async update(id: string, dto: UpdateFindingDto, userId: string, currentUser?: any): Promise<Finding> {
    const finding = await this.findingModel.findById(id).populate('projectId');
    
    if (!finding) {
      throw new NotFoundException(`Hallazgo con ID ${id} no encontrado`);
    }

    // SECURITY FIX C3: Validar ownership antes de actualizar
    if (currentUser) {
      const restrictedRoles = ['CLIENT_ADMIN', 'AREA_ADMIN', 'ANALYST', 'VIEWER'];
      if (restrictedRoles.includes(currentUser.role) && currentUser.clientId) {
        const project = finding.projectId as any;
        if (project.clientId.toString() !== currentUser.clientId.toString()) {
          throw new ForbiddenException('No tiene permisos para actualizar este hallazgo');
        }
      }
    }

    // Detectar cambio de status
    const statusChanged = dto.status && dto.status !== finding.status;
    const previousStatus = finding.status;

    // Actualizar hallazgo
    Object.assign(finding, dto);
    await finding.save();

    // Si cambió el status, registrar en timeline
    if (statusChanged && dto.status) {
      await this.createStatusChangeUpdate(
        id,
        previousStatus,
        dto.status,
        userId,
        `Estado actualizado de ${previousStatus} a ${dto.status}`,
      );
    }

    this.logger.log(`Hallazgo actualizado: ${finding.code} (ID: ${id})`);
    return finding;
  }

  /**
   * Cierra un hallazgo con motivo específico
   */
  async close(id: string, dto: CloseFindingDto, userId: string): Promise<Finding> {
    const finding = await this.findingModel.findById(id);
    
    if (!finding) {
      throw new NotFoundException(`Hallazgo con ID ${id} no encontrado`);
    }

    if (finding.status === FindingStatus.CLOSED) {
      throw new BadRequestException('El hallazgo ya está cerrado');
    }

    const previousStatus = finding.status;

    // Actualizar hallazgo
    finding.status = FindingStatus.CLOSED;
    finding.closeReason = dto.closeReason;
    finding.closedAt = new Date();
    finding.closedBy = userId as any;
    await finding.save();

    // Registrar en timeline
    await this.createStatusChangeUpdate(
      id,
      previousStatus,
      FindingStatus.CLOSED,
      userId,
      dto.comment || `Hallazgo cerrado: ${dto.closeReason}`,
    );

    this.logger.log(`Hallazgo cerrado: ${finding.code} - Motivo: ${dto.closeReason}`);
    return finding;
  }

  /**
   * Obtiene hallazgos de un proyecto que deben incluirse en retest
   */
  async findForRetest(projectId: string): Promise<Finding[]> {
    return this.findingModel.find({
      projectId,
      retestIncluded: true,
      status: { $ne: FindingStatus.CLOSED },
    }).select('code title severity status');
  }

  /**
   * TIMELINE - Crea una actualización de hallazgo
   * SECURITY FIX M1: Validar ownership del hallazgo
   */
  async createUpdate(dto: CreateFindingUpdateDto, createdBy: string, currentUser?: any): Promise<FindingUpdate> {
    // SECURITY FIX M1: Validar que el hallazgo pertenece al tenant del usuario
    if (currentUser) {
      const finding = await this.findingModel.findById(dto.findingId).populate('projectId');
      if (!finding) {
        throw new NotFoundException(`Hallazgo con ID ${dto.findingId} no encontrado`);
      }

      const restrictedRoles = ['CLIENT_ADMIN', 'AREA_ADMIN', 'ANALYST', 'VIEWER'];
      if (restrictedRoles.includes(currentUser.role) && currentUser.clientId) {
        const project = finding.projectId as any;
        if (project.clientId.toString() !== currentUser.clientId.toString()) {
          throw new ForbiddenException('No tiene permisos para actualizar este hallazgo');
        }
      }
    }

    const update = new this.updateModel({
      ...dto,
      createdBy,
    });

    await update.save();
    
    this.logger.log(`Update creado para hallazgo ${dto.findingId}: Tipo ${dto.type}`);
    return update;
  }

  /**
   * TIMELINE - Obtiene el historial de un hallazgo
   */
  async getTimeline(findingId: string): Promise<FindingUpdate[]> {
    return this.updateModel.find({ findingId })
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
   */
  async hardDelete(id: string): Promise<void> {
    // Eliminar también todas las actualizaciones asociadas
    await this.updateModel.deleteMany({ findingId: id });

    const result = await this.findingModel.findByIdAndDelete(id);
    
    if (!result) {
      throw new NotFoundException(`Hallazgo con ID ${id} no encontrado`);
    }

    this.logger.warn(`Hallazgo ELIMINADO permanentemente: ${result.code} (ID: ${id})`);
  }
}
