import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { Finding } from '../../../finding/schemas/finding.schema';
import { MetricsFilterDto } from '../../dto/metrics-filter.dto';
import { IFindingRepository } from '../interfaces/finding.repository.interface';

@Injectable()
export class MongooseFindingRepository implements IFindingRepository {
  constructor(
    @InjectModel(Finding.name) private readonly findingModel: Model<Finding>,
  ) {}

  private buildMatch(filters: MetricsFilterDto): Record<string, any> {
    const match: Record<string, any> = {};

    if (filters.tenantId) {
      match['tenantId'] = new Types.ObjectId(filters.tenantId);
    }
    if (filters.projectId) {
      match['projectId'] = new Types.ObjectId(filters.projectId);
    }
    if (filters.from || filters.to) {
      match['createdAt'] = {};
      if (filters.from) match['createdAt']['$gte'] = new Date(filters.from);
      if (filters.to) {
        const to = new Date(filters.to);
        to.setHours(23, 59, 59, 999);
        match['createdAt']['$lte'] = to;
      }
    }

    return match;
  }

  async countByFilters(filters: MetricsFilterDto, additionalMatch: Record<string, any> = {}): Promise<number> {
    const match = { ...this.buildMatch(filters), ...additionalMatch };
    return this.findingModel.countDocuments(match);
  }

  async aggregateBySeverity(filters: MetricsFilterDto): Promise<any[]> {
    const pipeline: PipelineStage[] = [
      { $match: this.buildMatch(filters) },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];
    return this.findingModel.aggregate(pipeline);
  }

  async aggregateByStatus(filters: MetricsFilterDto): Promise<any[]> {
    const pipeline: PipelineStage[] = [
      { $match: this.buildMatch(filters) },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];
    return this.findingModel.aggregate(pipeline);
  }

  async aggregateUsageByTenant(filters: MetricsFilterDto): Promise<any[]> {
    const pipeline: PipelineStage[] = [
      { $match: this.buildMatch(filters) },
      {
        $group: {
          _id: '$tenantId',
          findingCount: { $sum: 1 },
          openFindings: {
            $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] },
          },
          criticalFindings: {
            $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] },
          },
        },
      },
    ];
    return this.findingModel.aggregate(pipeline);
  }

  async findForExport(filters: MetricsFilterDto): Promise<any[]> {
    return this.findingModel
      .find(this.buildMatch(filters))
      .select(
        'code internal_code title severity status retestIncluded closeReason closedAt projectId tenantId createdAt updatedAt',
      )
      .lean()
      .exec();
  }
}
