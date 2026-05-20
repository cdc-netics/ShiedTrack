import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { UserAreaAssignment } from "./schemas/user-area-assignment.schema";
import { User } from "./schemas/user.schema";
import { Area } from "../area/schemas/area.schema";
import { Project } from "../project/schemas/project.schema";
import { Client } from "../client/schemas/client.schema";

/**
 * Servicio de asignación centralizada de usuarios
 * Maneja asignaciones de usuarios a clientes, proyectos y áreas
 */
@Injectable()
export class UserAssignmentService {
  private readonly logger = new Logger(UserAssignmentService.name);

  constructor(
    @InjectModel(UserAreaAssignment.name)
    private userAreaModel: Model<UserAreaAssignment>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Area.name)
    private areaModel: Model<Area>,
    @InjectModel(Project.name)
    private projectModel: Model<Project>,
    @InjectModel(Client.name)
    private clientModel: Model<Client>,
  ) {}

  /**
   * Actualizar asignaciones centralizadas del usuario (clientes, proyectos, áreas)
   * Para esta primera versión, implementamos solo la asignación de áreas
   * que es lo que el backend soporta nativamente
   */
  async updateAssignments(
    userId: string,
    assignmentIds: {
      clientIds?: string[];
      projectIds?: string[];
      areaIds?: string[];
    },
    assignedBy: string,
  ): Promise<any> {
    // Verificar que el usuario existe
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }

    // Verificar que el usuario asignador existe
    const assigner = await this.userModel.findById(assignedBy);
    if (!assigner) {
      throw new NotFoundException("Usuario asignador no encontrado");
    }

    const result: any = {
      success: true,
      message: "Asignaciones actualizadas exitosamente",
      assigned: {
        areas: [] as any[],
        projects: [] as any[],
        clients: [] as any[],
      },
      warnings: [] as string[],
    };

    // Procesar asignación de áreas (soportado nativamente)
    const areaIdsToAssign = new Set<string>(assignmentIds.areaIds || []);

    // Procesar asignación de proyectos (derivar a áreas)
    if (assignmentIds.projectIds && assignmentIds.projectIds.length > 0) {
      const projects = await this.projectModel
        .find({
          _id: {
            $in: assignmentIds.projectIds.map((id) => new Types.ObjectId(id)),
          },
        })
        .exec();

      if (projects.length !== assignmentIds.projectIds.length) {
        result.warnings.push("Algunos proyectos no existen");
      }

      // Obtener todas las áreas de los proyectos
      for (const project of projects) {
        if (project.areaIds && project.areaIds.length > 0) {
          project.areaIds.forEach((areaId) =>
            areaIdsToAssign.add(areaId.toString()),
          );
        }
      }

      result.assigned.projects = projects.map((p) => ({
        _id: p._id,
        name: p.name,
      }));
    }

    // Procesar asignación de clientes (derivar a sus áreas)
    if (assignmentIds.clientIds && assignmentIds.clientIds.length > 0) {
      const clients = await this.clientModel
        .find({
          _id: {
            $in: assignmentIds.clientIds.map((id) => new Types.ObjectId(id)),
          },
        })
        .exec();

      if (clients.length !== assignmentIds.clientIds.length) {
        result.warnings.push("Algunos clientes no existen");
      }

      // Obtener todas las áreas del cliente
      const areaIdsFromClients = await this.areaModel
        .find({
          clientId: { $in: clients.map((c) => c._id) },
        })
        .select("_id")
        .exec();

      if (areaIdsFromClients.length > 0) {
        areaIdsFromClients.forEach((area) =>
          areaIdsToAssign.add(area._id.toString()),
        );
        result.assigned.clients = clients.map((c) => ({
          _id: c._id,
          name: c.name,
        }));
      }
    }

    result.assigned.areas = await this.replaceUserAreas(
      userId,
      Array.from(areaIdsToAssign),
      assignedBy,
    );

    user.tenantIds = (assignmentIds.clientIds || []).map(
      (id) => new Types.ObjectId(id),
    );
    user.visibleProjectIds = (assignmentIds.projectIds || []).map(
      (id) => new Types.ObjectId(id),
    );
    user.areaIds = Array.from(areaIdsToAssign).map(
      (id) => new Types.ObjectId(id),
    );
    user.clientId = user.tenantIds[0];
    await user.save();

    return result;
  }

  /**
   * Obtener asignaciones actuales del usuario
   */
  async getAssignments(userId: string): Promise<any> {
    // Verificar que el usuario existe
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }

    // Obtener áreas asignadas
    const userAreas = await this.userAreaModel
      .find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      })
      .populate("areaId")
      .exec();

    // Agrupar por cliente y obtener proyectos
    const areasByClient: { [clientId: string]: any[] } = {};
    const projectIdsByClient: { [clientId: string]: Set<string> } = {};

    for (const assignment of userAreas) {
      const area = assignment.areaId as any;
      if (area) {
        const clientId = area.clientId.toString();
        if (!areasByClient[clientId]) {
          areasByClient[clientId] = [];
          projectIdsByClient[clientId] = new Set();
        }
        areasByClient[clientId].push({
          _id: area._id,
          name: area.name,
        });

        // Obtener proyectos del área
        const projects = await this.projectModel
          .find({ areaIds: area._id })
          .select("_id name")
          .exec();
        projects.forEach((p) =>
          projectIdsByClient[clientId].add(p._id.toString()),
        );
      }
    }

    const directClientIds = Array.from(
      new Set([
        ...(user.tenantIds || []).map((id) => id.toString()),
        ...(user.clientId ? [user.clientId.toString()] : []),
      ]),
    );
    const directProjectIds = (user.visibleProjectIds || []).map((id) =>
      id.toString(),
    );
    const directAreaIds = userAreas
      .map((assignment) => (assignment.areaId as any)?._id?.toString())
      .filter(Boolean);

    // Obtener solo clientes asignados directamente. Las areas no deben marcar
    // automaticamente al cliente como asignado.
    const clientIds = directClientIds;
    const clients = await this.clientModel
      .find({ _id: { $in: clientIds.map((id) => new Types.ObjectId(id)) } })
      .select("_id name displayName")
      .exec();

    const result = {
      userId,
      userName: user.email,
      clientIds,
      projectIds: directProjectIds,
      areaIds: directAreaIds,
      clients: clients.map((c) => ({
        _id: c._id,
        name: c.name,
        displayName: c.displayName,
        areas: areasByClient[c._id.toString()] || [],
        projects: Array.from(
          new Set([
            ...directProjectIds,
            ...Array.from(projectIdsByClient[c._id.toString()] || []),
          ]),
        ),
      })),
      totalAreas: userAreas.length,
      totalProjects: new Set([
        ...directProjectIds,
        ...Object.values(projectIdsByClient).flatMap((set) => Array.from(set)),
      ]).size,
      totalClients: clients.length,
    };

    return result;
  }

  /**
   * Reemplazar todas las áreas de un usuario
   * (Helper interno reutilizado de UserAreaService)
   */
  private async replaceUserAreas(
    userId: string,
    newAreaIds: string[],
    assignedBy: string,
  ): Promise<any> {
    // Desactivar todas las asignaciones existentes
    await this.userAreaModel.updateMany(
      { userId: new Types.ObjectId(userId), isActive: true },
      { isActive: false, unassignedAt: new Date() },
    );
    await this.userModel.findByIdAndUpdate(userId, {
      areaIds: newAreaIds.map((id) => new Types.ObjectId(id)),
    });

    // Crear nuevas asignaciones
    const assignments = [];
    for (const areaId of newAreaIds) {
      const area = await this.areaModel.findById(areaId);
      if (!area) {
        this.logger.warn(`Área ${areaId} no encontrada, ignorando`);
        continue;
      }

      const assignment = new this.userAreaModel({
        userId: new Types.ObjectId(userId),
        areaId: new Types.ObjectId(areaId),
        isActive: true,
        assignedBy: new Types.ObjectId(assignedBy),
        assignedAt: new Date(),
      });

      assignments.push(await assignment.save());
    }

    return assignments.map((a) => ({
      _id: a._id,
      areaId: a.areaId,
      assignedAt: a.assignedAt,
    }));
  }
}
