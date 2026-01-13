import { Controller, Get, Post, Param, Query, UseGuards, Res, Request, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

/**
 * Controller de Exportación
 * 3 niveles: Proyecto (Excel/CSV/JSON), Tenant (ZIP), Sistema (JSON backup)
 */
@ApiTags('Export')
@Controller('api/export')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * A. NIVEL PROYECTO - Exportar proyecto individual
   */
  @Get('project/:id/excel')
  @Roles(UserRole.ANALYST, UserRole.AREA_ADMIN, UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 exports por minuto
  @ApiOperation({ summary: 'Exportar proyecto a Excel (ANALYST+)' })
  async exportProjectExcel(
    @Param('id') projectId: string,
    @CurrentUser() user: any,
    @Res() res: Response
  ) {
    const stream = await this.exportService.exportProjectToExcel(projectId, user);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="proyecto_${projectId}_${Date.now()}.xlsx"`);
    
    stream.pipe(res);
  }

  @Get('project/:id/csv')
  @Roles(UserRole.ANALYST, UserRole.AREA_ADMIN, UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Exportar proyecto a CSV (ANALYST+)' })
  async exportProjectCSV(
    @Param('id') projectId: string,
    @CurrentUser() user: any,
    @Res() res: Response
  ) {
    const csv = await this.exportService.exportProjectToCSV(projectId, user);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="proyecto_${projectId}_${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('project/:id/json')
  @Roles(UserRole.ANALYST, UserRole.AREA_ADMIN, UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Exportar proyecto a JSON (ANALYST+)' })
  async exportProjectJSON(
    @Param('id') projectId: string,
    @CurrentUser() user: any
  ) {
    return this.exportService.exportProjectToJSON(projectId, user);
  }

  @Get('project/:id/zip')
  @Roles(UserRole.ANALYST, UserRole.AREA_ADMIN, UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Exportar proyecto a ZIP con evidencias (ANALYST+)' })
  async exportProjectZip(
    @Param('id') projectId: string,
    @CurrentUser() user: any,
    @Res() res: Response
  ) {
    const zipStream = await this.exportService.exportProjectAsZip(projectId, user);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="project_${projectId}_${Date.now()}.zip"`);
    zipStream.pipe(res);
  }

  /**
   * B. NIVEL TENANT - Exportar portfolio completo del cliente
   */
  @Get('client/:id/portfolio')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Solo 3 exports por minuto (proceso pesado)
  @ApiOperation({ summary: 'Exportar portfolio cliente en ZIP (CLIENT_ADMIN+)' })
  async exportClientPortfolio(
    @Param('id') clientId: string,
    @CurrentUser() user: any,
    @Res() res: Response
  ) {
    const zipStream = await this.exportService.exportClientPortfolio(clientId, user);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="client_${clientId}_${Date.now()}.zip"`);
    
    zipStream.pipe(res);
  }

  @Get('client/:id/csv')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Exportar todos los hallazgos de un cliente a CSV (CLIENT_ADMIN+)' })
  async exportClientCSV(
    @Param('id') clientId: string,
    @CurrentUser() user: any,
    @Res() res: Response
  ) {
    const csv = await this.exportService.exportClientPortfolioCSV(clientId, user);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="client_${clientId}_findings_${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('finding/:id/pdf')
  @Roles(UserRole.ANALYST, UserRole.AREA_ADMIN, UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Exportar hallazgo a PDF' })
  async exportFindingPdf(
    @Param('id') findingId: string,
    @CurrentUser() user: any,
    @Res() res: Response
  ) {
    const buffer = await this.exportService.exportFindingPdf(findingId, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="finding_${findingId}.pdf"`);
    res.send(buffer);
  }

  @Get('project/:id/pdf')
  @Roles(UserRole.ANALYST, UserRole.AREA_ADMIN, UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Exportar proyecto a PDF' })
  async exportProjectPdf(
    @Param('id') projectId: string,
    @CurrentUser() user: any,
    @Res() res: Response
  ) {
    const buffer = await this.exportService.exportProjectPdf(projectId, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="project_${projectId}.pdf"`);
    res.send(buffer);
  }

  /**
   * C. NIVEL SISTEMA - Backup completo de base de datos
   */
  @Get('system/backup-full')
  @Roles(UserRole.OWNER)
  @Throttle({ default: { limit: 1, ttl: 3600000 } }) // Solo 1 backup por hora (proceso MUY pesado)
  @ApiOperation({ summary: 'Backup completo del sistema (SOLO OWNER)' })
  async exportFullBackup(
    @CurrentUser() user: any,
    @Res() res: Response
  ) {
    const backup = await this.exportService.exportFullDatabaseBackup(user);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="shieldtrack_backup_${Date.now()}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  }

  @Post('system/backup')
  @Roles(UserRole.OWNER)
  @Throttle({ default: { limit: 1, ttl: 3600000 } })
  @ApiOperation({ summary: 'Ejecutar mongodump y generar archivo .tar.gz (SOLO OWNER)' })
  async createSystemBackup(
    @CurrentUser() user: any,
  ) {
    return this.exportService.createSystemBackup(user);
  }
}
