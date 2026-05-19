import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Project } from "./schemas/project.schema";
import { Finding } from "../finding/schemas/finding.schema";
import { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto";
import { ProjectStatus, FindingStatus } from "../../common/enums";

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

  /** Helper: convierte string -> ObjectId (o undefined) */
  private toObjectId(id?: string): Types.ObjectId | undefined {
    if (!id) return undefined;
    return new Types.ObjectId(id);
  }

  /** Obtiene tenant actual desde el usuario autenticado */
  private getCurrentTenantId(currentUser?: any): string | undefined {
    return (
      currentUser?.activeTenantId?.toString?.() ??
      currentUser?.clientId?.toString?.()
    );
  }

  /** Obtiene client actual desde el usuario autenticado */
  private getCurrentClientId(currentUser?: any): string | undefined {
    return currentUser?.clientId?.toString?.();
  }

  /** Determina si el usuario está restringido por área */
  private isRestrictedByArea(currentUser?: any): boolean {
    return ["AREA_ADMIN", "ANALYST", "VIEWER"].includes(currentUser?.role);
  }

  private isGlobalUser(currentUser?: any): boolean {
    return ["OWNER", "PLATFORM_ADMIN"].includes(currentUser?.role);
  }

  /** Obtiene áreas asignadas al usuario */
  private getUserAreaIds(currentUser?: any): string[] {
    return currentUser?.areaIds?.map((id: any) => id.toString()) || [];
  }

  /** Determina si el usuario está restringido por proyectos visibles */
  private isRestrictedByVisibleProjects(currentUser?: any): boolean {
    return ["VIEWER", "ANALYST"].includes(currentUser?.role);
  }

  /** Obtiene proyectos visibles del usuario */
  private getUserVisibleProjectIds(currentUser?: any): string[] {
    return (
      currentUser?.visibleProjectIds?.map((id: any) => id.toString()) || []
    );
  }

  /**
   * Valida que un clientId recibido coincida con el tenant actual.
   * Se usa para evitar desalineación tenantId/clientId.
   */
  private validateClientMatchesTenant(
    clientId: any,
    currentTenantId?: string,
  ): void {
    if (!clientId || !currentTenantId) return;

    if (clientId.toString() !== currentTenantId.toString()) {
      throw new BadRequestException(
        "clientId no coincide con el tenant del usuario autenticado",
      );
    }
  }

  /** Valida acceso al proyecto según lista de proyectos visibles */
  private validateProjectVisibleAccess(project: any, currentUser?: any): void {
    if (!currentUser || !this.isRestrictedByVisibleProjects(currentUser)) {
      return;
    }

    const allowedProjects = this.getUserVisibleProjectIds(currentUser);

    if (!allowedProjects.length) {
      throw new BadRequestException("No tiene acceso a este proyecto");
    }

    const projectId = project?._id?.toString?.();

    if (!projectId || !allowedProjects.includes(projectId)) {
      throw new BadRequestException("No tiene acceso a este proyecto");
    }
  }

  /** Valida acceso al proyecto según áreas */
  private validateProjectAreaAccess(project: any, currentUser?: any): void {
    if (!currentUser || !this.isRestrictedByArea(currentUser)) {
      return;
    }

    const allowedAreas = this.getUserAreaIds(currentUser);
    const projectAreas =
      project.areaIds?.map((a: any) => a?._id?.toString?.() || a.toString()) ||
      [];
    const legacyArea =
      (project.areaId as any)?._id?.toString?.() ||
      (project.areaId as any)?.toString?.();

    const hasAccess = allowedAreas.some(
      (area: string) => projectAreas.includes(area) || legacyArea === area,
    );

    if (!hasAccess) {
      throw new BadRequestException("No tiene acceso a este proyecto");
    }
  }

  /**
   * Busca proyecto por ID y valida acceso por tenant + área + proyectos visibles
   */
  private async findProjectOrFailWithAccess(
    id: string,
    currentUser?: any,
  ): Promise<Project> {
    const project = await this.projectModel
      .findById(id)
      .populate("clientId", "name code")
      .populate("areaId", "name")
      .populate("areaIds", "name");

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }

    const currentTenantId = this.getCurrentTenantId(currentUser);
    const projectTenantId = (project as any).tenantId?.toString?.();

    if (
      currentTenantId &&
      projectTenantId &&
      currentTenantId !== projectTenantId
    ) {
      throw new BadRequestException("No tiene acceso a este proyecto");
    }

    this.validateProjectAreaAccess(project, currentUser);
    this.validateProjectVisibleAccess(project, currentUser);

    return project;
  }

  /**
   * Crea un nuevo proyecto
   * MULTI-TENANT: usa tenant del usuario autenticado
   * CONSISTENCIA: fuerza tenantId === clientId
   */
  async create(dto: CreateProjectDto, user: any): Promise<Project> {
    if (!dto.code) {
      const year = new Date().getFullYear();
      const count = await this.projectModel.countDocuments();
      dto.code = `PROJ-${year}-${String(count + 1).padStart(3, "0")}`;
    }

    if (dto.areaId && (!dto.areaIds || dto.areaIds.length === 0)) {
      dto.areaIds = [dto.areaId];
    }

    if (dto.areaIds && dto.areaIds.length > 0) {
      dto.areaId = dto.areaIds[0];
    }

    const currentTenantId = this.getCurrentTenantId(user);
    const requestedTenantId = dto.tenantId || dto.clientId;
    const finalTenantId =
      this.isGlobalUser(user) && requestedTenantId
        ? requestedTenantId
        : currentTenantId || requestedTenantId;

    if (!finalTenantId) {
      throw new BadRequestException(
        "No se pudo determinar el tenant del usuario actual",
      );
    }

    if (!this.isGlobalUser(user)) {
      this.validateClientMatchesTenant(dto.clientId, currentTenantId);
    }

    const projectToCreate: any = {
      name: dto.name,
      code: dto.code,
      description: dto.description,
      serviceArchitecture: dto.serviceArchitecture,

      tenantId: this.toObjectId(finalTenantId),
      clientId: this.toObjectId(dto.clientId || finalTenantId),

      areaId: this.toObjectId(dto.areaId),
      areaIds: Array.isArray(dto.areaIds)
        ? dto.areaIds.map((x) => this.toObjectId(x)).filter(Boolean)
        : [],

      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      retestPolicy: dto.retestPolicy ?? { enabled: false },
    };

    const project = new this.projectModel(projectToCreate);
    await project.save();

    this.logger.log(`Proyecto creado: ${project.name} (ID: ${project._id})`);
    return project;
  }
  /**
   * Obtiene proyectos con filtros opcionales
   * MULTI-TENANT: filtra por tenantId del usuario autenticado
   * SEGURIDAD: aplica restricciones por área y proyectos visibles
   */
  async findAll(
    filters: { status?: ProjectStatus; clientId?: string } = {},
    currentUser?: any,
  ): Promise<Project[]> {
    const query: any = {};
    const { status, clientId } = filters;

    const restrictedByArea = this.isRestrictedByArea(currentUser);
    const restrictedByVisibleProjects =
      this.isRestrictedByVisibleProjects(currentUser);

    const areaIds = this.getUserAreaIds(currentUser);
    const visibleProjectIds = this.getUserVisibleProjectIds(currentUser);
    const currentTenantId = this.getCurrentTenantId(currentUser);

    if (currentTenantId) {
      query.tenantId = this.toObjectId(currentTenantId);
    }

    if (status) {
      query.projectStatus = status;
    }

    if (clientId) {
      query.$or = [
        { clientId: this.toObjectId(clientId) },
        { tenantId: this.toObjectId(clientId) },
      ];
    }

    const andConditions: any[] = [];

    if (restrictedByArea) {
      if (!areaIds.length) {
        return [];
      }

      const areaObjectIds = areaIds
        .map((id) => this.toObjectId(id))
        .filter(Boolean);

      andConditions.push({
        $or: [
          { areaIds: { $in: areaObjectIds } },
          { areaId: { $in: areaObjectIds } },
        ],
      });
    }

    if (restrictedByVisibleProjects) {
      if (!visibleProjectIds.length) {
        return [];
      }

      const projectObjectIds = visibleProjectIds
        .map((id) => this.toObjectId(id))
        .filter(Boolean);

      andConditions.push({
        _id: { $in: projectObjectIds },
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const projects = await this.projectModel
      .find(query)
      .populate("clientId", "name code")
      .populate("areaId", "name")
      .populate("areaIds", "name")
      .sort({ createdAt: -1 });

    const projectsWithCount = await Promise.all(
      projects.map(async (project) => {
        const findingsCount = await this.findingModel.countDocuments({
          projectId: project._id,
        });

        return {
          ...project.toObject(),
          findingsCount,
        };
      }),
    );

    return projectsWithCount as any;
  }

  /**
   * Busca proyecto por ID
   * MULTI-TENANT: valida acceso por tenant + área + proyectos visibles
   */
  async findById(id: string, currentUser?: any): Promise<Project> {
    return this.findProjectOrFailWithAccess(id, currentUser);
  }

  /**
   * Actualiza un proyecto
   * Si se cambia a CLOSED, cierra automáticamente todos los hallazgos abiertos
   * MULTI-TENANT: valida acceso antes de modificar
   * CONSISTENCIA: no permite desalinear tenantId/clientId
   */
  async update(
    id: string,
    dto: UpdateProjectDto,
    currentUser?: any,
  ): Promise<Project> {
    const project = await this.findProjectOrFailWithAccess(id, currentUser);
    const currentTenantId = this.getCurrentTenantId(currentUser);
    const isGlobalUser = this.isGlobalUser(currentUser);

    if (!currentTenantId && !isGlobalUser) {
      throw new BadRequestException(
        "No se pudo determinar el cliente del usuario actual",
      );
    }

    // tenant no se actualiza manualmente desde frontend
    if ((dto as any).tenantId !== undefined) {
      delete (dto as any).tenantId;
    }

    const isBeingClosed =
      dto.projectStatus === ProjectStatus.CLOSED &&
      project.projectStatus !== ProjectStatus.CLOSED;

    if (isBeingClosed) {
      await this.closeProjectFindings(id);

      project.retestPolicy = {
        enabled: false,
        nextRetestAt: undefined,
        notify: undefined,
      } as any;
    }

    if (dto.areaIds && dto.areaIds.length > 0) {
      (dto as any).areaId = dto.areaIds[0];
    }

    if (dto.areaIds) {
      (dto as any).areaIds = dto.areaIds
        .map((x) => this.toObjectId(x))
        .filter(Boolean);
    }

    if (!isGlobalUser) {
      this.validateClientMatchesTenant((dto as any).clientId, currentTenantId);
    }

    // Si viene clientId en el body, usarlo; para usuarios globales también
    // movemos el proyecto a ese tenant para mantener tenantId/clientId alineados.
    if ((dto as any).clientId !== undefined) {
      (dto as any).clientId = this.toObjectId((dto as any).clientId);
      if (isGlobalUser) {
        (dto as any).tenantId = (dto as any).clientId;
      }
    }

    Object.assign(project, dto);

    // Si por alguna razón el proyecto no tuviera clientId, intentar resolverlo
    if (!(project as any).clientId) {
      const fallbackClientId = this.getCurrentClientId(currentUser);
      if (fallbackClientId) {
        (project as any).clientId = this.toObjectId(fallbackClientId);
        (project as any).tenantId = this.toObjectId(currentTenantId);
      }
    }

    await project.save();

    this.logger.log(`Proyecto actualizado: ${project.name} (ID: ${id})`);

    if (isBeingClosed) {
      this.logger.log(
        `Proyecto cerrado y hallazgos automáticamente cerrados: ${id}`,
      );
    }

    const populated = await this.projectModel
      .findById(project._id)
      .populate("clientId", "name code")
      .populate("areaId", "name")
      .populate("areaIds", "name");

    return populated as any;
  }

  /**
   * Cierra todos los hallazgos abiertos de un proyecto
   * Se ejecuta automáticamente al cerrar un proyecto
   */
  private async closeProjectFindings(projectId: string): Promise<void> {
    const result = await this.findingModel.updateMany(
      {
        projectId,
        status: { $ne: FindingStatus.CLOSED },
      },
      {
        $set: {
          status: FindingStatus.CLOSED,
          closeReason: "CONTRACT_ENDED",
          closedAt: new Date(),
        },
      },
    );

    this.logger.log(
      `${result.modifiedCount} hallazgos cerrados automáticamente para proyecto ${projectId}`,
    );
  }

  /**
   * Obtiene proyectos con retest habilitado (para el scheduler)
   */
  async findProjectsWithRetestEnabled(): Promise<Project[]> {
    return this.projectModel.find({
      "retestPolicy.enabled": true,
      projectStatus: ProjectStatus.ACTIVE,
    });
  }

  /**
   * Soft delete - Cambia estado a ARCHIVED
   * MULTI-TENANT: valida acceso antes de archivar
   */
  async archive(id: string, currentUser?: any): Promise<Project> {
    await this.findProjectOrFailWithAccess(id, currentUser);

    const project = await this.projectModel.findByIdAndUpdate(
      id,
      { projectStatus: ProjectStatus.ARCHIVED },
      { new: true },
    );

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }

    return project;
  }

  /**
   * Hard delete - Solo OWNER
   * Elimina el proyecto y TODOS sus hallazgos asociados
   * MULTI-TENANT: valida acceso antes de eliminar
   */
  async hardDelete(id: string, currentUser?: any): Promise<void> {
    const project = await this.findProjectOrFailWithAccess(id, currentUser);

    const findingsCount = await this.findingModel.countDocuments({
      projectId: id,
    });

    if (findingsCount > 0) {
      await this.findingModel.deleteMany({ projectId: id });
      this.logger.warn(
        `${findingsCount} hallazgos eliminados del proyecto ${id}`,
      );
    }

    await this.projectModel.findByIdAndDelete(id);

    this.logger.warn(
      `Proyecto ELIMINADO permanentemente: ${project.name} (ID: ${id}) con ${findingsCount} hallazgos`,
    );
  }

  /**
   * Fusiona dos proyectos: mueve todos los hallazgos del proyecto origen al destino
   * y elimina el proyecto origen
   * MULTI-TENANT: valida acceso a ambos proyectos
   */
  async mergeProjects(
    sourceProjectId: string,
    targetProjectId: string,
    currentUser?: any,
  ): Promise<any> {
    const sourceProject = await this.findProjectOrFailWithAccess(
      sourceProjectId,
      currentUser,
    );
    const targetProject = await this.findProjectOrFailWithAccess(
      targetProjectId,
      currentUser,
    );

    if (sourceProjectId === targetProjectId) {
      throw new BadRequestException(
        "No se puede fusionar un proyecto consigo mismo",
      );
    }

    const findingsCount = await this.findingModel.countDocuments({
      projectId: sourceProjectId,
    });

    this.logger.log(
      `Iniciando fusión de proyectos: "${sourceProject.name}" → "${targetProject.name}" (${findingsCount} hallazgos)`,
    );

    if (findingsCount > 0) {
      const result = await this.findingModel.updateMany(
        { projectId: sourceProjectId },
        {
          $set: {
            projectId: targetProjectId,
            mergedFrom: {
              projectId: sourceProjectId,
              projectName: sourceProject.name,
              projectCode: sourceProject.code,
              mergedAt: new Date(),
            },
          },
        },
      );

      this.logger.log(
        `${result.modifiedCount} hallazgos movidos de "${sourceProject.name}" a "${targetProject.name}"`,
      );
    }

    const updatedFindingsCount = await this.findingModel.countDocuments({
      projectId: targetProjectId,
    });

    await this.projectModel.findByIdAndUpdate(targetProjectId, {
      $set: { findingsCount: updatedFindingsCount },
    });

    const mergeHistory = {
      sourceProject: {
        _id: sourceProject._id,
        name: sourceProject.name,
        code: sourceProject.code,
        description: sourceProject.description,
        clientId: sourceProject.clientId,
        areaIds: sourceProject.areaIds,
        serviceArchitecture: sourceProject.serviceArchitecture,
        findingsCount: findingsCount,
      },
      mergedAt: new Date(),
      findingsMoved: findingsCount,
    };

    await this.projectModel.findByIdAndUpdate(targetProjectId, {
      $push: { mergeHistory: mergeHistory },
    });

    await this.projectModel.findByIdAndDelete(sourceProjectId);

    this.logger.warn(
      `Proyecto "${sourceProject.name}" (ID: ${sourceProjectId}) fusionado y ELIMINADO`,
    );

    return {
      success: true,
      message: `Proyectos fusionados exitosamente`,
      sourceProject: { id: sourceProjectId, name: sourceProject.name },
      targetProject: {
        id: targetProjectId,
        name: targetProject.name,
        newFindingsCount: updatedFindingsCount,
      },
      findingsMoved: findingsCount,
      mergedAt: mergeHistory.mergedAt,
    };
  }
}
