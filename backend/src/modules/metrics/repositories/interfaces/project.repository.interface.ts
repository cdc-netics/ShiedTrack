import { MetricsFilterDto } from '../../dto/metrics-filter.dto';

export interface IProjectRepository {
  countByFilters(filters: MetricsFilterDto): Promise<number>;
  aggregateByStatus(filters: MetricsFilterDto): Promise<any[]>;
  aggregateUsageByClient(filters: MetricsFilterDto): Promise<any[]>;
}
