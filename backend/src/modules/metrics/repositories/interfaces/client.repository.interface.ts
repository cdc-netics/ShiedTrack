import { MetricsFilterDto } from '../../dto/metrics-filter.dto';

export interface IClientRepository {
  countByFilters(filters: MetricsFilterDto): Promise<number>;
}
