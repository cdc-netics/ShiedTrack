import { Controller, Post, Get, Delete, Param, UseGuards, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';
import { Throttle } from '@nestjs/throttler';

/**
 * Controller de Backup y Restauración
 * SOLO accesible por rol OWNER
 */
@ApiTags('Backup')
@Controller('api/backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.OWNER)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('create')
  @Throttle({ default: { limit: 2, ttl: 3600000 } }) // Max 2 backups por hora
  @ApiOperation({ summary: 'Crear backup completo de la base de datos (SOLO OWNER)' })
  @ApiResponse({ status: 201, description: 'Backup creado exitosamente' })
  async createBackup(@CurrentUser() user: any) {
    return this.backupService.createBackup(user);
  }

  @Post('restore/:filename')
  @Throttle({ default: { limit: 1, ttl: 3600000 } }) // Max 1 restore por hora
  @ApiOperation({ 
    summary: 'Restaurar base de datos desde backup (PELIGROSO - SOLO OWNER)',
    description: 'ADVERTENCIA: Esta operación sobrescribirá TODA la base de datos actual' 
  })
  @ApiResponse({ status: 200, description: 'Base de datos restaurada exitosamente' })
  async restoreBackup(
    @Param('filename') filename: string,
    @CurrentUser() user: any
  ) {
    return this.backupService.restoreBackup(filename, user);
  }

  @Get('list')
  @ApiOperation({ summary: 'Listar todos los backups disponibles (SOLO OWNER)' })
  @ApiResponse({ status: 200, description: 'Lista de backups' })
  async listBackups() {
    return this.backupService.listBackups();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de backups (SOLO OWNER)' })
  @ApiResponse({ status: 200, description: 'Estadísticas de backups' })
  async getBackupStats() {
    return this.backupService.getBackupStats();
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Descargar archivo de backup (SOLO OWNER)' })
  @ApiResponse({ status: 200, description: 'Archivo de backup' })
  async downloadBackup(
    @Param('filename') filename: string,
    @CurrentUser() user: any,
    @Res() res: Response
  ) {
    const { stream, filename: fname, size } = await this.backupService.downloadBackup(filename, user);

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Length', size);
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);

    stream.pipe(res);
  }

  @Delete(':filename')
  @ApiOperation({ summary: 'Eliminar backup específico (SOLO OWNER)' })
  @ApiResponse({ status: 200, description: 'Backup eliminado' })
  async deleteBackup(
    @Param('filename') filename: string,
    @CurrentUser() user: any
  ) {
    return this.backupService.deleteBackup(filename, user);
  }
}
