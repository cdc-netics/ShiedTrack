import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Client } from "../../../client/schemas/client.schema";
import { MetricsFilterDto } from "../../dto/metrics-filter.dto";
import { IClientRepository } from "../interfaces/client.repository.interface";

@Injectable()
export class MongooseClientRepository implements IClientRepository {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
  ) {}

  private buildMatch(filters: MetricsFilterDto): Record<string, any> {
    const match: Record<string, any> = {};

    if (filters.clientId) {
      match["_id"] = new Types.ObjectId(filters.clientId);
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
    return this.clientModel.countDocuments(this.buildMatch(filters));
  }
}
