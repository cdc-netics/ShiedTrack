import { MetricsFilterDto } from '../../dto/metrics-filter.dto';

export interface IFindingRepository {
  countByFilters(filters: MetricsFilterDto, additionalMatch?: Record<string, any>): Promise<number>;
  aggregateBySeverity(filters: MetricsFilterDto): Promise<any[]>;
  aggregateByStatus(filters: MetricsFilterDto): Promise<any[]>;
  aggregateUsageByTenant(filters: MetricsFilterDto): Promise<any[]>;
  findForExport(filters: MetricsFilterDto): Promise<any[]>;
}
