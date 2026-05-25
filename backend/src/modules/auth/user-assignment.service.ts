import {
  Injectable,
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

  async updateAssignments(
    userId: string,
    assignmentIds: {
      clientIds?: string[];
      projectIds?: string[];
      areaIds?: string[];
    },
    assignedBy: string,
  ): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }

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

    const finalAreaIds = new Set<string>(
      (assignmentIds.areaIds || []).map((id) => id.toString()),
    );

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

      for (const project of projects) {
        if (project.areaIds && project.areaIds.length > 0) {
          project.areaIds.forEach((areaId) =>
            finalAreaIds.add(areaId.toString()),
          );
        }
      }

      result.assigned.projects = projects.map((p) => ({
        _id: p._id,
        name: p.name,
      }));
    }

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

      const areaIdsFromClients = await this.areaModel
        .find({
          clientId: { $in: clients.map((c) => c._id) },
        })
        .select("_id")
        .exec();

      areaIdsFromClients.forEach((area) =>
        finalAreaIds.add(area._id.toString()),
      );

      result.assigned.clients = clients.map((c) => ({
        _id: c._id,
        name: c.name,
      }));
    }

    result.assigned.areas = await this.replaceUserAreas(
      userId,
      Array.from(finalAreaIds),
      assignedBy,
    );

    return result;
  }

  async getAssignments(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }

    const userAreas = await this.userAreaModel
      .find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      })
      .populate("areaId")
      .exec();

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

        const projects = await this.projectModel
          .find({ areaIds: area._id })
          .select("_id name")
          .exec();
        projects.forEach((p) =>
          projectIdsByClient[clientId].add(p._id.toString()),
        );
      }
    }

    const clientIds = Object.keys(areasByClient);
    const clients = await this.clientModel
      .find({ _id: { $in: clientIds.map((id) => new Types.ObjectId(id)) } })
      .select("_id name displayName")
      .exec();

    const directAreaIds = userAreas
      .map((assignment) => (assignment.areaId as any)?._id?.toString?.())
      .filter(Boolean);
    const directProjectIds = Array.from(
      new Set(
        Object.values(projectIdsByClient).flatMap((set) => Array.from(set)),
      ),
    );

    return {
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
        projects: Array.from(projectIdsByClient[c._id.toString()] || []),
      })),
      totalAreas: userAreas.length,
      totalProjects: Object.values(projectIdsByClient).reduce(
        (sum, set) => sum + set.size,
        0,
      ),
      totalClients: clients.length,
    };
  }

  private async replaceUserAreas(
    userId: string,
    newAreaIds: string[],
    assignedBy: string,
  ): Promise<any> {
    await this.userAreaModel.updateMany(
      { userId: new Types.ObjectId(userId), isActive: true },
      { isActive: false, unassignedAt: new Date() },
    );

    const uniqueAreaIds = Array.from(
      new Set(newAreaIds.map((areaId) => areaId.toString())),
    );

    const assignments = [];
    const validAreaIds: string[] = [];
    for (const areaId of uniqueAreaIds) {
      const area = await this.areaModel.findById(areaId);
      if (!area) {
        this.logger.warn(`Area ${areaId} no encontrada, ignorando`);
        continue;
      }

      validAreaIds.push(areaId);

      const assignment = await this.userAreaModel
        .findOneAndUpdate(
          {
            userId: new Types.ObjectId(userId),
            areaId: new Types.ObjectId(areaId),
          },
          {
            $set: {
              isActive: true,
              assignedBy: new Types.ObjectId(assignedBy),
              assignedAt: new Date(),
            },
            $unset: {
              unassignedAt: "",
            },
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          },
        )
        .exec();

      assignments.push(assignment);
    }

    await this.userModel.findByIdAndUpdate(userId, {
      areaIds: validAreaIds.map((id) => new Types.ObjectId(id)),
    });

    return assignments.map((a) => ({
      _id: a._id,
      areaId: a.areaId,
      assignedAt: a.assignedAt,
    }));
  }
}
