import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from './schemas/project.schema';
import { Finding } from '../finding/schemas/finding.schema';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectStatus, FindingStatus } from '../../common/enums';

/**
 * Servicio de gestión de Proyectos
 * Maneja CRUD de proyectos y lógica de cierre que afecta hallazgos
 */
@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Finding.name) private findingModel: Model<Finding>,
  ) {}

  /**
   * Crea un nuevo proyecto
   */
  async create(dto: CreateProjectDto): Promise<Project> {
    // Generar código automático si no viene en el DTO
    if (!dto.code) {
      const year = new Date().getFullYear();
      const count = await this.projectModel.countDocuments();
      dto.code = `PROJ-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    const project = new this.projectModel(dto);
    await project.save();
    
    this.logger.log(`Proyecto creado: ${project.name} (ID: ${project._id})`);
    return project;
  }

  /**
   * Obtiene proyectos con filtros opcionales
   * MULTI-TENANT: Valida acceso según rol
   */
  async findAll(clientId?: string, status?: ProjectStatus, currentUser?: any): Promise<Project[]> {
    const query: any = {};
    const restrictedByArea = ['AREA_ADMIN', 'ANALYST', 'VIEWER'].includes(currentUser?.role);
    const areaIds = currentUser?.areaIds?.map((id: any) => id.toString()) || [];
    
    // SEGURIDAD MULTI-TENANT: Validar scope del usuario
    if (currentUser) {
      const isGlobalAdmin = ['OWNER', 'PLATFORM_ADMIN'].includes(currentUser.role);
      
      if (!isGlobalAdmin) {
        // Usuario limitado a su tenant
        if (!currentUser.clientId) {
          throw new BadRequestException('Usuario sin clientId asignado');
        }
        query.clientId = currentUser.clientId;
        
        // Validar que no intente acceder a otro cliente
        if (clientId && clientId !== currentUser.clientId.toString()) {
          throw new BadRequestException('No tiene acceso a este cliente');
        }
      } else if (clientId) {
        // Admin global puede filtrar por cliente específico
        query.clientId = clientId;
      }
    } else if (clientId) {
      query.clientId = clientId;
    }
    
    // Filtro por áreas para roles restringidos
    if (restrictedByArea) {
      if (!areaIds.length) {
        return []; // Sin áreas asignadas => sin acceso
      }
      query.areaId = { $in: areaIds };
    }
    
    if (status) query.projectStatus = status;

    return this.projectModel.find(query)
      .populate('clientId', 'name code')
      .populate('areaId', 'name')
      .sort({ createdAt: -1 });
  }

  /**
   * Busca proyecto por ID
   */
  async findById(id: string, currentUser?: any): Promise<Project> {
    const project = await this.projectModel.findById(id)
      .populate('clientId', 'name code')
      .populate('areaId', 'name');
    
    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }

    // Validar aislamiento por área para roles restringidos
    if (currentUser && ['AREA_ADMIN', 'ANALYST', 'VIEWER'].includes(currentUser.role)) {
      const allowedAreas = currentUser.areaIds?.map((a: any) => a.toString()) || [];
      if (!allowedAreas.length || !allowedAreas.includes((project.areaId as any)?.toString())) {
        throw new BadRequestException('No tiene acceso a este proyecto');
      }
    }
    return project;
  }

  /**
   * Actualiza un proyecto
   * Si se cambia a CLOSED, cierra automáticamente todos los hallazgos abiertos
   */
  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.projectModel.findById(id);
    
    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }

    // Detectar cambio de estado a CLOSED
    const isBeingClosed = dto.projectStatus === ProjectStatus.CLOSED && 
                          project.projectStatus !== ProjectStatus.CLOSED;

    if (isBeingClosed) {
      await this.closeProjectFindings(id);
      
      // SEGURIDAD: Detener notificaciones futuras de retest
      project.retestPolicy = {
        enabled: false,
        nextRetestAt: undefined,
        notify: undefined,
      };
    }

    // Actualizar proyecto
    Object.assign(project, dto);
    await project.save();

    this.logger.log(`Proyecto actualizado: ${project.name} (ID: ${id})`);
    
    if (isBeingClosed) {
      this.logger.log(`Proyecto cerrado y hallazgos automáticamente cerrados: ${id}`);
    }

    return project;
  }

  /**
   * Cierra todos los hallazgos abiertos de un proyecto
   * Se ejecuta automáticamente al cerrar un proyecto
   */
  private async closeProjectFindings(projectId: string): Promise<void> {
    const result = await this.findingModel.updateMany(
      {
        projectId,
        status: { $ne: FindingStatus.CLOSED }, // No cerrados
      },
      {
        $set: {
          status: FindingStatus.CLOSED,
          closeReason: 'CONTRACT_ENDED',
          closedAt: new Date(),
        },
      },
    );

    this.logger.log(`${result.modifiedCount} hallazgos cerrados automáticamente para proyecto ${projectId}`);
  }

  /**
   * Obtiene proyectos con retest habilitado (para el scheduler)
   */
  async findProjectsWithRetestEnabled(): Promise<Project[]> {
    return this.projectModel.find({
      'retestPolicy.enabled': true,
      projectStatus: ProjectStatus.ACTIVE,
    });
  }

  /**
   * Soft delete - Cambia estado a ARCHIVED
   */
  async archive(id: string): Promise<Project> {
    const project = await this.projectModel.findByIdAndUpdate(
      id,
      { projectStatus: ProjectStatus.ARCHIVED },
      { new: true },
    );

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }

    this.logger.warn(`Proyecto archivado: ${project.name} (ID: ${id})`);
    return project;
  }

  /**
   * Hard delete - Solo OWNER
   * Elimina el proyecto y TODOS sus hallazgos asociados
   */
  async hardDelete(id: string): Promise<void> {
    const project = await this.projectModel.findById(id);
    
    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }

    // Contar hallazgos antes de eliminar
    const findingsCount = await this.findingModel.countDocuments({ projectId: id });
    
    // Eliminar TODOS los hallazgos del proyecto
    if (findingsCount > 0) {
      await this.findingModel.deleteMany({ projectId: id });
      this.logger.warn(`${findingsCount} hallazgos eliminados del proyecto ${id}`);
    }

    // Eliminar el proyecto
    await this.projectModel.findByIdAndDelete(id);

    this.logger.warn(`Proyecto ELIMINADO permanentemente: ${project.name} (ID: ${id}) con ${findingsCount} hallazgos`);
  }
}
