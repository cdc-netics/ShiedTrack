import { Injectable, Inject } from '@nestjs/common';
import { MetricsFilterDto } from '../dto/metrics-filter.dto';
import { IFindingRepository } from '../repositories/interfaces/finding.repository.interface';
import { IProjectRepository } from '../repositories/interfaces/project.repository.interface';
import { IClientRepository } from '../repositories/interfaces/client.repository.interface';

@Injectable()
export class MetricsQueryService {
  constructor(
    @Inject('IFindingRepository') private readonly findingRepository: IFindingRepository,
    @Inject('IProjectRepository') private readonly projectRepository: IProjectRepository,
    @Inject('IClientRepository') private readonly clientRepository: IClientRepository,
  ) {}

  /**
   * Retorna totales globales de clientes, proyectos y hallazgos para
   * el periodo y filtros especificados.
   */
  async getSummary(filters: MetricsFilterDto) {
    const [findingsCount, projectsCount, clientsCount, openFindings, closedFindings] =
      await Promise.all([
        this.findingRepository.countByFilters(filters),
        this.projectRepository.countByFilters(filters),
        this.clientRepository.countByFilters(filters),
        this.findingRepository.countByFilters(filters, { status: 'OPEN' }),
        this.findingRepository.countByFilters(filters, { status: 'CLOSED' }),
      ]);

    return {
      findings: {
        total: findingsCount,
        open: openFindings,
        closed: closedFindings,
        inProgress: findingsCount - openFindings - closedFindings,
      },
      projects: {
        total: projectsCount,
      },
      clients: {
        total: clientsCount,
      },
      filters: {
        from: filters.from ?? null,
        to: filters.to ?? null,
        tenantId: filters.tenantId ?? null,
        clientId: filters.clientId ?? null,
        projectId: filters.projectId ?? null,
      },
    };
  }

  /**
   * Agrupación de hallazgos por nivel de severidad.
   */
  async getFindingsBySeverity(filters: MetricsFilterDto) {
    const results = await this.findingRepository.aggregateBySeverity(filters);

    // Garantizar que todas las severidades aparecen, incluso con count 0
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'];
    const map = new Map(results.map((r) => [r._id, r.count]));

    return severities.map((severity) => ({
      severity,
      count: map.get(severity) ?? 0,
    }));
  }

  /**
   * Agrupación de hallazgos por estado del ciclo de vida.
   */
  async getFindingsByStatus(filters: MetricsFilterDto) {
    const results = await this.findingRepository.aggregateByStatus(filters);

    const statuses = ['OPEN', 'IN_PROGRESS', 'RETEST_REQUIRED', 'RETEST_PASSED', 'RETEST_FAILED', 'CLOSED'];
    const map = new Map(results.map((r) => [r._id, r.count]));

    return statuses.map((status) => ({
      status,
      count: map.get(status) ?? 0,
    }));
  }

  /**
   * Agrupación de proyectos por estado.
   */
  async getProjectsByStatus(filters: MetricsFilterDto) {
    const results = await this.projectRepository.aggregateByStatus(filters);

    const statuses = ['ACTIVE', 'CLOSED', 'ARCHIVED'];
    const map = new Map(results.map((r) => [r._id, r.count]));

    return statuses.map((status) => ({
      status,
      count: map.get(status) ?? 0,
    }));
  }

  /**
   * Métricas de uso por cliente: cantidad de proyectos y hallazgos por tenant/cliente.
   */
  async getClientsUsage(filters: MetricsFilterDto) {
    const [projectsData, findingsData] = await Promise.all([
      this.projectRepository.aggregateUsageByClient(filters),
      this.findingRepository.aggregateUsageByTenant(filters),
    ]);

    // Mapa de findings por tenantId
    const findingsMap = new Map(
      findingsData.map((f) => [f._id?.toString(), f]),
    );

    // Combinar resultados
    return projectsData.map((p) => {
      const tenantIdStr = p._id?.tenantId?.toString();
      const clientIdStr = p._id?.clientId?.toString();
      const findings = findingsMap.get(tenantIdStr) ?? {
        findingCount: 0,
        openFindings: 0,
        criticalFindings: 0,
      };

      return {
        tenantId: tenantIdStr ?? null,
        clientId: clientIdStr ?? null,
        projects: {
          total: p.projectCount,
          active: p.activeProjects,
          closed: p.closedProjects,
        },
        findings: {
          total: findings.findingCount,
          open: findings.openFindings,
          critical: findings.criticalFindings,
        },
      };
    });
  }
}
