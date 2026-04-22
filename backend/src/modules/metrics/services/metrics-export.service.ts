import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { Types } from 'mongoose';
import { MetricsExportFilterDto, MetricsExportFormat } from '../dto/metrics-filter.dto';
import { IFindingRepository } from '../repositories/interfaces/finding.repository.interface';
import { IExportStrategy } from '../export-strategies/export-strategy.interface';
import { CsvExportStrategy } from '../export-strategies/csv-export.strategy';
import { JsonExportStrategy } from '../export-strategies/json-export.strategy';

@Injectable()
export class MetricsExportService {
  constructor(
    @Inject('IFindingRepository') private readonly findingRepository: IFindingRepository,
    private readonly csvExportStrategy: CsvExportStrategy,
    private readonly jsonExportStrategy: JsonExportStrategy,
  ) {}

  /**
   * Obtiene los hallazgos y los exporta en el formato solicitado.
   */
  async exportMetrics(filters: MetricsExportFilterDto, res: Response): Promise<void> {
    const findings = await this.findingRepository.findForExport(filters);

    const data = findings.map((f) => {
      const doc = f as any;
      return {
        id: (doc._id as Types.ObjectId).toString(),
        code: doc.code,
        internal_code: doc.internal_code,
        title: doc.title,
        severity: doc.severity,
        status: doc.status,
        retestIncluded: doc.retestIncluded,
        closeReason: doc.closeReason ?? null,
        closedAt: doc.closedAt ? (doc.closedAt as Date).toISOString() : null,
        projectId: doc.projectId?.toString() ?? null,
        tenantId: (doc.tenantId as Types.ObjectId)?.toString() ?? null,
        createdAt: (doc.createdAt as Date).toISOString(),
        updatedAt: (doc.updatedAt as Date).toISOString(),
      };
    });

    const format = filters.format ?? MetricsExportFormat.JSON;
    const strategy = this.getStrategy(format);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `shieldtrack-metrics-${timestamp}`;

    await strategy.export(data, res, filename);
  }

  private getStrategy(format: MetricsExportFormat): IExportStrategy {
    switch (format) {
      case MetricsExportFormat.CSV:
        return this.csvExportStrategy;
      case MetricsExportFormat.JSON:
        return this.jsonExportStrategy;
      default:
        throw new BadRequestException(`Export format ${format} is not supported.`);
    }
  }
}
