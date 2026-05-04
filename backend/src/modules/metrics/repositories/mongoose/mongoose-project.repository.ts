import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, PipelineStage } from "mongoose";
import { Project } from "../../../project/schemas/project.schema";
import { MetricsFilterDto } from "../../dto/metrics-filter.dto";
import { IProjectRepository } from "../interfaces/project.repository.interface";

@Injectable()
export class MongooseProjectRepository implements IProjectRepository {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
  ) {}

  private buildMatch(filters: MetricsFilterDto): Record<string, any> {
    const match: Record<string, any> = {};

    if (filters.tenantId) {
      match["tenantId"] = new Types.ObjectId(filters.tenantId);
    }
    if (filters.clientId) {
      match["clientId"] = new Types.ObjectId(filters.clientId);
    }
    if (filters.from || filters.to) {
      match["createdAt"] = {};
      if (filters.from) match["createdAt"]["$gte"] = new Date(filters.from);
      if (filters.to) {
        const to = new Date(filters.to);
        to.setHours(23, 59, 59, 999);
        match["createdAt"]["$lte"] = to;
      }
    }

    return match;
  }

  async countByFilters(filters: MetricsFilterDto): Promise<number> {
    return this.projectModel.countDocuments(this.buildMatch(filters));
  }

  async aggregateByStatus(filters: MetricsFilterDto): Promise<any[]> {
    const pipeline: PipelineStage[] = [
      { $match: this.buildMatch(filters) },
      {
        $group: {
          _id: "$projectStatus",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];
    return this.projectModel.aggregate(pipeline);
  }

  async aggregateUsageByClient(filters: MetricsFilterDto): Promise<any[]> {
    const pipeline: PipelineStage[] = [
      { $match: this.buildMatch(filters) },
      {
        $group: {
          _id: { tenantId: "$tenantId", clientId: "$clientId" },
          projectCount: { $sum: 1 },
          activeProjects: {
            $sum: { $cond: [{ $eq: ["$projectStatus", "ACTIVE"] }, 1, 0] },
          },
          closedProjects: {
            $sum: { $cond: [{ $eq: ["$projectStatus", "CLOSED"] }, 1, 0] },
          },
        },
      },
    ];
    return this.projectModel.aggregate(pipeline);
  }
}
