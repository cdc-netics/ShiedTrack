import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { MetricsQueryService } from './services/metrics-query.service';
import { MetricsExportService } from './services/metrics-export.service';
import { MetricsFilterDto, MetricsExportFilterDto, MetricsExportFormat } from './dto/metrics-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

/**
 * Controlador de Métricas y Estadísticas
 *
 * Expone un conjunto de endpoints de solo lectura orientados a la exportación
 * y consumo de métricas agregadas por herramientas de BI externas como
 * Metabase o PowerBI.
 *
 * Todos los endpoints:
 *  - Requieren autenticación JWT (Bearer Token).
 *  - Están restringidos a roles OWNER o PLATFORM_ADMIN.
 *  - Aceptan filtros opcionales de rango de fechas y scoping por tenant/cliente/proyecto.
 */
@ApiTags('Metrics')
@Controller('api/metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN)
export class MetricsController {
  constructor(
    private readonly metricsQueryService: MetricsQueryService,
    private readonly metricsExportService: MetricsExportService,
  ) {}

  // ─── Query params comunes ────────────────────────────────────────────────
  private readonly commonQueryParams = [
    { name: 'from', required: false, description: 'Fecha de inicio (ISO 8601). Ej: 2025-01-01' },
    { name: 'to', required: false, description: 'Fecha de fin (ISO 8601). Ej: 2025-12-31' },
    { name: 'tenantId', required: false, description: 'ID del tenant (ObjectId)' },
    { name: 'clientId', required: false, description: 'ID del cliente (ObjectId)' },
    { name: 'projectId', required: false, description: 'ID del proyecto (ObjectId)' },
  ];

  // ─── Endpoints ────────────────────────────────────────────────────────────

  /**
   * GET /api/metrics/summary
   * Totales globales del sistema: hallazgos, proyectos y clientes.
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Resumen global de métricas',
    description:
      'Retorna totales de hallazgos (abiertos/cerrados/en progreso), proyectos y clientes. ' +
      'Acepta filtros de rango de fechas y scoping por tenant, cliente o proyecto.',
  })
  @ApiQuery({ name: 'from', required: false, description: 'Fecha de inicio (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha de fin (ISO 8601)' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'ID del tenant' })
  @ApiQuery({ name: 'clientId', required: false, description: 'ID del cliente' })
  @ApiQuery({ name: 'projectId', required: false, description: 'ID del proyecto' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de métricas',
    schema: {
      example: {
        findings: { total: 250, open: 80, closed: 130, inProgress: 40 },
        projects: { total: 15 },
        clients: { total: 8 },
        filters: { from: '2025-01-01', to: '2025-12-31', tenantId: null, clientId: null, projectId: null },
      },
    },
  })
  async getSummary(@Query() filters: MetricsFilterDto) {
    return this.metricsQueryService.getSummary(filters);
  }

  /**
   * GET /api/metrics/findings-by-severity
   * Distribución de hallazgos por severidad.
   */
  @Get('findings-by-severity')
  @ApiOperation({
    summary: 'Hallazgos agrupados por severidad',
    description:
      'Retorna el conteo de hallazgos para cada nivel de severidad ' +
      '(CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL). ' +
      'Siempre incluye los 5 niveles aunque alguno tenga count 0.',
  })
  @ApiQuery({ name: 'from', required: false, description: 'Fecha de inicio (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha de fin (ISO 8601)' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'ID del tenant' })
  @ApiQuery({ name: 'clientId', required: false, description: 'ID del cliente' })
  @ApiQuery({ name: 'projectId', required: false, description: 'ID del proyecto' })
  @ApiResponse({
    status: 200,
    description: 'Hallazgos por severidad',
    schema: {
      example: [
        { severity: 'CRITICAL', count: 12 },
        { severity: 'HIGH', count: 45 },
        { severity: 'MEDIUM', count: 98 },
        { severity: 'LOW', count: 67 },
        { severity: 'INFORMATIONAL', count: 28 },
      ],
    },
  })
  async getFindingsBySeverity(@Query() filters: MetricsFilterDto) {
    return this.metricsQueryService.getFindingsBySeverity(filters);
  }

  /**
   * GET /api/metrics/findings-by-status
   * Distribución de hallazgos por estado del ciclo de vida.
   */
  @Get('findings-by-status')
  @ApiOperation({
    summary: 'Hallazgos agrupados por estado',
    description:
      'Retorna el conteo de hallazgos para cada estado del ciclo de vida ' +
      '(OPEN, IN_PROGRESS, RETEST_REQUIRED, RETEST_PASSED, RETEST_FAILED, CLOSED). ' +
      'Siempre incluye todos los estados aunque alguno tenga count 0.',
  })
  @ApiQuery({ name: 'from', required: false, description: 'Fecha de inicio (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha de fin (ISO 8601)' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'ID del tenant' })
  @ApiQuery({ name: 'clientId', required: false, description: 'ID del cliente' })
  @ApiQuery({ name: 'projectId', required: false, description: 'ID del proyecto' })
  @ApiResponse({
    status: 200,
    description: 'Hallazgos por estado',
    schema: {
      example: [
        { status: 'OPEN', count: 80 },
        { status: 'IN_PROGRESS', count: 24 },
        { status: 'RETEST_REQUIRED', count: 16 },
        { status: 'RETEST_PASSED', count: 12 },
        { status: 'RETEST_FAILED', count: 8 },
        { status: 'CLOSED', count: 110 },
      ],
    },
  })
  async getFindingsByStatus(@Query() filters: MetricsFilterDto) {
    return this.metricsQueryService.getFindingsByStatus(filters);
  }

  /**
   * GET /api/metrics/projects-by-status
   * Distribución de proyectos por estado.
   */
  @Get('projects-by-status')
  @ApiOperation({
    summary: 'Proyectos agrupados por estado',
    description:
      'Retorna el conteo de proyectos por estado (ACTIVE, CLOSED, ARCHIVED). ' +
      'Siempre incluye los 3 estados aunque alguno tenga count 0.',
  })
  @ApiQuery({ name: 'from', required: false, description: 'Fecha de inicio (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha de fin (ISO 8601)' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'ID del tenant' })
  @ApiQuery({ name: 'clientId', required: false, description: 'ID del cliente' })
  @ApiResponse({
    status: 200,
    description: 'Proyectos por estado',
    schema: {
      example: [
        { status: 'ACTIVE', count: 8 },
        { status: 'CLOSED', count: 6 },
        { status: 'ARCHIVED', count: 1 },
      ],
    },
  })
  async getProjectsByStatus(@Query() filters: MetricsFilterDto) {
    return this.metricsQueryService.getProjectsByStatus(filters);
  }

  /**
   * GET /api/metrics/clients-usage
   * Métricas de uso desglosadas por cliente/tenant.
   */
  @Get('clients-usage')
  @ApiOperation({
    summary: 'Métricas de uso por cliente',
    description:
      'Retorna métricas operativas desglosadas por tenant/cliente: ' +
      'cantidad de proyectos (activos/cerrados) y hallazgos (totales/abiertos/críticos). ' +
      'Útil para comparar la carga de cada cliente en el sistema.',
  })
  @ApiQuery({ name: 'from', required: false, description: 'Fecha de inicio (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha de fin (ISO 8601)' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'ID del tenant' })
  @ApiQuery({ name: 'clientId', required: false, description: 'ID del cliente' })
  @ApiResponse({
    status: 200,
    description: 'Uso por cliente',
    schema: {
      example: [
        {
          tenantId: '66a0f5c3e4b08a1d2c3e4f50',
          clientId: '66a0f5c3e4b08a1d2c3e4f51',
          projects: { total: 5, active: 3, closed: 2 },
          findings: { total: 120, open: 40, critical: 8 },
        },
      ],
    },
  })
  async getClientsUsage(@Query() filters: MetricsFilterDto) {
    return this.metricsQueryService.getClientsUsage(filters);
  }

  /**
   * GET /api/metrics/export
   * Exportación plana de hallazgos para herramientas de BI externas.
   * Soporta formato JSON (default) y CSV.
   */
  @Get('export')
  @ApiOperation({
    summary: 'Exportar métricas de hallazgos para BI',
    description:
      'Retorna una proyección plana de hallazgos con los campos clave para ' +
      'ingesta directa en Metabase, PowerBI u otras herramientas de BI. ' +
      'Con `format=csv` devuelve un archivo descargable en texto plano (RFC 4180). ' +
      'Con `format=json` (default) devuelve un array JSON.',
  })
  @ApiQuery({ name: 'format', required: false, enum: MetricsExportFormat, description: 'Formato de exportación' })
  @ApiQuery({ name: 'from', required: false, description: 'Fecha de inicio (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha de fin (ISO 8601)' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'ID del tenant' })
  @ApiQuery({ name: 'clientId', required: false, description: 'ID del cliente' })
  @ApiQuery({ name: 'projectId', required: false, description: 'ID del proyecto' })
  @ApiResponse({ status: 200, description: 'Archivo de exportación de métricas' })
  async exportMetrics(
    @Query() filters: MetricsExportFilterDto,
    @Res() res: Response,
  ) {
    await this.metricsExportService.exportMetrics(filters, res);
  }
}

