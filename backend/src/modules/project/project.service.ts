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

    // MULTI-AREA LOGIC: Sync areaId and areaIds
    if (dto.areaId && (!dto.areaIds || dto.areaIds.length === 0)) {
        dto.areaIds = [dto.areaId];
    }
    if (dto.areaIds && dto.areaIds.length > 0) {
        dto.areaId = dto.areaIds[0]; // Backward compatibility
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
    // Nota: El aislamiento por tenant se aplica automáticamente por el plugin de Mongoose.
    // No forzamos clientId aquí para evitar dependencias al modelo "Client".
    // Si se recibe clientId como parámetro (uso legacy), lo usamos para filtrar por tenantId.
    if (clientId) {
      query.tenantId = clientId;
    }
    
    // Filtro por áreas para roles restringidos
    if (restrictedByArea) {
      if (!areaIds.length) {
        return []; // Sin áreas asignadas => sin acceso
      }
      // Support legacy areaId and new areaIds
      query.$or = [
        { areaIds: { $in: areaIds } },
        { areaId: { $in: areaIds } }
      ];
    }
    
    if (status) query.projectStatus = status;

    const projects = await this.projectModel.find(query)
      .populate('clientId', 'name code')
      .populate('areaId', 'name')
      .populate('areaIds', 'name')
      .sort({ createdAt: -1 });

    // Agregar contador de hallazgos para cada proyecto
    const projectsWithCount = await Promise.all(
      projects.map(async (project) => {
        const findingsCount = await this.findingModel.countDocuments({ projectId: project._id });
        return {
          ...project.toObject(),
          findingsCount
        };
      })
    );

    return projectsWithCount as any;
  }

  /**
   * Busca proyecto por ID
   */
  async findById(id: string, currentUser?: any): Promise<Project> {
    const project = await this.projectModel.findById(id)
      .populate('clientId', 'name code')
      .populate('areaId', 'name')
      .populate('areaIds', 'name');
    
    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }

    // Validar aislamiento por área para roles restringidos
    if (currentUser && ['AREA_ADMIN', 'ANALYST', 'VIEWER'].includes(currentUser.role)) {
      const allowedAreas = currentUser.areaIds?.map((a: any) => a.toString()) || [];
      const projectAreas = project.areaIds?.map((a: any) => a._id?.toString() || a.toString()) || [];
      const legacyArea = (project.areaId as any)?._id?.toString() || (project.areaId as any)?.toString();

      const hasAccess = allowedAreas.some((area: string) => 
        projectAreas.includes(area) || legacyArea === area
      );

      if (!hasAccess) {
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

    // Sync legacy areaId if areaIds is updated
    if (dto.areaIds && dto.areaIds.length > 0) {
        (dto as any).areaId = dto.areaIds[0];
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

  /**
   * Fusiona dos proyectos: mueve todos los hallazgos del proyecto origen al destino
   * y elimina el proyecto origen
   * @param sourceProjectId - ID del proyecto origen (será eliminado)
   * @param targetProjectId - ID del proyecto destino (recibirá los hallazgos)
   */
  async mergeProjects(sourceProjectId: string, targetProjectId: string): Promise<any> {
    // Validar que los proyectos existan
    const sourceProject = await this.projectModel.findById(sourceProjectId);
    const targetProject = await this.projectModel.findById(targetProjectId);

    if (!sourceProject) {
      throw new NotFoundException(`Proyecto origen con ID ${sourceProjectId} no encontrado`);
    }

    if (!targetProject) {
      throw new NotFoundException(`Proyecto destino con ID ${targetProjectId} no encontrado`);
    }

    if (sourceProjectId === targetProjectId) {
      throw new BadRequestException('No se puede fusionar un proyecto consigo mismo');
    }

    // Contar hallazgos antes de mover
    const findingsCount = await this.findingModel.countDocuments({ projectId: sourceProjectId });

    this.logger.log(`Iniciando fusión de proyectos: "${sourceProject.name}" → "${targetProject.name}" (${findingsCount} hallazgos)`);

    // Mover TODOS los hallazgos del proyecto origen al destino
    if (findingsCount > 0) {
      const result = await this.findingModel.updateMany(
        { projectId: sourceProjectId },
        { 
          $set: { 
            projectId: targetProjectId,
            // Preservar metadatos importantes del proyecto origen en los hallazgos
            mergedFrom: {
              projectId: sourceProjectId,
              projectName: sourceProject.name,
              projectCode: sourceProject.code,
              mergedAt: new Date()
            }
          } 
        }
      );

      this.logger.log(`${result.modifiedCount} hallazgos movidos de "${sourceProject.name}" a "${targetProject.name}"`);
    }

    // Actualizar contadores del proyecto destino
    const updatedFindingsCount = await this.findingModel.countDocuments({ projectId: targetProjectId });
    await this.projectModel.findByIdAndUpdate(targetProjectId, {
      $set: { findingsCount: updatedFindingsCount }
    });

    // Preservar información del proyecto origen antes de eliminarlo
    const mergeHistory = {
      sourceProject: {
        _id: sourceProject._id,
        name: sourceProject.name,
        code: sourceProject.code,
        description: sourceProject.description,
        clientId: sourceProject.clientId,
        areaIds: sourceProject.areaIds,
        serviceArchitecture: sourceProject.serviceArchitecture,
        findingsCount: findingsCount
      },
      mergedAt: new Date(),
      findingsMoved: findingsCount
    };

    // Agregar historia de fusión al proyecto destino
    await this.projectModel.findByIdAndUpdate(targetProjectId, {
      $push: { 
        mergeHistory: mergeHistory 
      }
    });

    // Eliminar el proyecto origen permanentemente
    await this.projectModel.findByIdAndDelete(sourceProjectId);

    this.logger.warn(`Proyecto "${sourceProject.name}" (ID: ${sourceProjectId}) fusionado y ELIMINADO`);

    return {
      success: true,
      message: `Proyectos fusionados exitosamente`,
      sourceProject: {
        id: sourceProjectId,
        name: sourceProject.name
      },
      targetProject: {
        id: targetProjectId,
        name: targetProject.name,
        newFindingsCount: updatedFindingsCount
      },
      findingsMoved: findingsCount,
      mergedAt: mergeHistory.mergedAt
    };
  }
}
