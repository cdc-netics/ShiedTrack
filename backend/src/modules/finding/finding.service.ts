import { Injectable, NotFoundException, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Finding } from './schemas/finding.schema';
import { FindingUpdate } from './schemas/finding-update.schema';
import { CreateFindingDto, UpdateFindingDto, CloseFindingDto } from './dto/finding.dto';
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
    @InjectModel(SystemConfig.name) private systemConfigModel: Model<SystemConfig>,
    @InjectModel(Area.name) private areaModel: Model<Area>,
    @InjectModel(User.name) private userModel: Model<User>,
    private emailService: EmailService,
  ) {}

  /**
   * Crea un nuevo hallazgo
   * Genera código automático basado en configuración (Area > Global)
   */
  async create(dto: CreateFindingDto, createdBy: string, currentUser?: any): Promise<Finding> {
    // SECURITY FIX C3: Validar que el proyecto pertenece al cliente del usuario
    const project = await this.projectModel.findById(dto.projectId)
      .populate('clientId')
      .populate('areaId')
      .populate('areaIds'); // Populate Area to check prefix

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${dto.projectId} no encontrado`);
    }

    if (currentUser) {
      // Solo OWNER y PLATFORM_ADMIN pueden crear en cualquier proyecto
      const globalRoles = ['OWNER', 'PLATFORM_ADMIN'];
      if (!globalRoles.includes(currentUser.role)) {
        if (project.clientId._id.toString() !== currentUser.clientId?.toString()) {
          throw new ForbiddenException('No tiene permisos para crear hallazgos en este proyecto');
        }
      }
    }

    // GENERACIÓN DE CÓDIGO DINÁMICO
    let prefix = 'VULN'; // Default global
    
    // 1. Intentar obtener prefijo del Área del proyecto
    if (project.areaIds && project.areaIds.length > 0) {
      const firstArea = project.areaIds[0] as any;
      if (firstArea.findingCodePrefix) prefix = firstArea.findingCodePrefix;
    } else if (project.areaId && (project.areaId as any).findingCodePrefix) {
      prefix = (project.areaId as any).findingCodePrefix;
    } else {
      // 2. Intentar obtener prefijo de Configuración Global
      const sysConfig = await this.systemConfigModel.findOne({ configKey: 'smtp_config' }); // TODO: Split config keys?
      // Nota: Asumimos que la config general esta en el mismo doc o buscamos por otro key
      // Por simplicidad, usaremos 'VULN' si no hay area prefix, o implementaremos lectura de config general
      // si se separara la config de smtp.
    }

    // Buscamos el último hallazgo con este prefijo para incrementar
    // Regex: Empieza con PREFIX- y le siguen numeros
    const regex = new RegExp(`^${prefix}-\\d+$`);
    const lastFinding = await this.findingModel
      .findOne({ code: { $regex: regex } })
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
      code: generatedCode, // Sobrescribimos el código del DTO con el generado oficialmente
      createdBy,
      status: FindingStatus.OPEN,
    });

    await finding.save();
    
    this.logger.log(`Hallazgo creado: ${finding.code} - ${finding.title} (ID: ${finding._id})`);

    // 📧 Enviar notificación al usuario asignado
    if (finding.assignedTo) {
      try {
        const assignedUser = await this.userModel.findById(finding.assignedTo);
        if (assignedUser && assignedUser.email) {
          await this.emailService.notifyFindingAssigned(
            assignedUser.email,
            `${assignedUser.firstName} ${assignedUser.lastName}`,
            finding.title,
            finding.code || finding._id.toString(),
            finding.severity
          );
          this.logger.log(`Email de nuevo hallazgo enviado a ${assignedUser.email}`);
        }
      } catch (emailError) {
        this.logger.warn(`No se pudo enviar email de hallazgo: ${emailError.message}`);
      }
    }

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
    const restrictedByArea = ['AREA_ADMIN', 'ANALYST', 'VIEWER'].includes(currentUser?.role);
    const allowedAreas = currentUser?.areaIds?.map((id: any) => id.toString()) || [];

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

      // Aislamiento por áreas
      if (restrictedByArea) {
        if (!allowedAreas.length) {
          return []; // Sin áreas asignadas
        }

        const projectsByArea = await this.projectModel.find({
          $or: [
             { areaIds: { $in: allowedAreas } },
             { areaId: { $in: allowedAreas } }
          ],
          ...(currentUser.clientId ? { clientId: currentUser.clientId } : {}),
        }).select('_id');

        const projectIds = projectsByArea.map((p: any) => p._id.toString());
        if (query.projectId) {
          // Intersecar si ya hay filtro por proyecto
          const existingIds = Array.isArray((query.projectId as any).$in)
            ? (query.projectId as any).$in.map((id: any) => id.toString())
            : [query.projectId.toString()];
          query.projectId = { $in: existingIds.filter((id: string) => projectIds.includes(id)) };
        } else {
          query.projectId = { $in: projectIds };
        }
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
      .populate('projectId', 'name code clientId areaId areaIds')
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

      // Aislamiento por áreas para roles restringidos
      if (['AREA_ADMIN', 'ANALYST', 'VIEWER'].includes(currentUser.role)) {
        const allowedAreas = currentUser.areaIds?.map((id: any) => id.toString()) || [];
        const project = finding.projectId as any;
        
        const projectAreas = project.areaIds?.map((a: any) => a.toString()) || [];
        const legacyArea = project.areaId?.toString();
        
        const hasAccess = allowedAreas.some((area: string) => 
            projectAreas.includes(area) || legacyArea === area
        );

        if (!allowedAreas.length || !hasAccess) {
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
        if (project.clientId?.toString() !== currentUser.clientId.toString()) {
          throw new ForbiddenException('No tiene permisos para actualizar este hallazgo');
        }
      }

      // Aislamiento por áreas para roles restringidos en update
      if (['AREA_ADMIN', 'ANALYST', 'VIEWER'].includes(currentUser.role)) {
        const allowedAreas = currentUser.areaIds?.map((id: any) => id.toString()) || [];
        const project = finding.projectId as any;
        
        const projectAreas = project.areaIds?.map((a: any) => a.toString()) || [];
        const legacyArea = project.areaId?.toString();
        
        const hasAccess = allowedAreas.some((area: string) => 
            projectAreas.includes(area) || legacyArea === area
        );

        if (!allowedAreas.length || !hasAccess) {
             throw new ForbiddenException('No tiene permisos para actualizar este hallazgo');
        }
      }
    }

    // Detectar cambio de status
    const statusChanged = dto.status && dto.status !== finding.status;
    const previousStatus = finding.status;

    // Manejo automático de fechas de cierre
    if (statusChanged) {
      if (dto.status === FindingStatus.CLOSED) {
        finding.closedAt = new Date();
        finding.closedBy = userId as any;
      } else if (previousStatus === FindingStatus.CLOSED) {
        // Si se reabre, limpiar fecha de cierre
        finding.closedAt = undefined;
        finding.closedBy = undefined;
      }
    }

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

      // Log status change (specific email notifications only for assignment/closure)
      this.logger.log(`Estado del hallazgo ${finding.code} cambiado de ${previousStatus} a ${dto.status}`);
    }

    this.logger.log(`Hallazgo actualizado: ${finding.code} (ID: ${id})`);
    return finding;
  }

  /**
   * Cierra masivamente hallazgos
   */
  async bulkClose(ids: string[], userId: string, closeReason: string = 'Bulk Close'): Promise<number> {
    if (!ids || ids.length === 0) return 0;

    const result = await this.findingModel.updateMany(
      { _id: { $in: ids }, status: { $ne: FindingStatus.CLOSED } },
      { 
        $set: { 
          status: FindingStatus.CLOSED, 
          closeReason: closeReason,
          closedAt: new Date(),
          closedBy: userId 
        } 
      }
    );
    
    this.logger.log(`${result.modifiedCount} hallazgos cerrados masivamente por usuario ${userId}`);
    return result.modifiedCount;
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

    // 📧 Enviar notificación de cierre
    if (finding.assignedTo) {
      try {
        const assignedUser = await this.userModel.findById(finding.assignedTo);
        if (assignedUser && assignedUser.email) {
          await this.emailService.notifyFindingClosed(
            assignedUser.email,
            `${assignedUser.firstName} ${assignedUser.lastName}`,
            finding.title,
            finding.code || finding._id.toString(),
            dto.closeReason
          );
          this.logger.log(`Email de cierre enviado a ${assignedUser.email}`);
        }
      } catch (emailError) {
        this.logger.warn(`No se pudo enviar email de cierre: ${emailError.message}`);
      }
    }

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
