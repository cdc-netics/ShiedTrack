import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { existsSync, mkdirSync, createReadStream } from 'fs';
import { join } from 'path';
import * as archiver from 'archiver';
import { PassThrough } from 'stream';

/**
 * Servicio de Backup y Restauración
 * Gestiona backups automáticos programados y restauración desde archivo
 */
@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupsDir = 'backups';
  private readonly maxBackups = 30; // Mantener últimos 30 backups

  constructor(
    @InjectConnection() private connection: Connection,
  ) {
    // Crear directorio de backups si no existe
    if (!existsSync(this.backupsDir)) {
      mkdirSync(this.backupsDir, { recursive: true });
      this.logger.log(`Directorio de backups creado: ${this.backupsDir}`);
    }
  }

  /**
   * Backup automático diario a las 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledBackup() {
    this.logger.log('Iniciando backup automático programado...');
    try {
      const result = await this.createBackup({ userId: 'system', role: 'OWNER', email: 'system@shieldtrack.com' });
      this.logger.log(`Backup automático completado: ${result.filename}`);
      
      // Limpieza de backups antiguos
      await this.cleanOldBackups();
    } catch (error) {
      this.logger.error(`Error en backup automático: ${error.message}`, error.stack);
    }
  }

  /**
   * Crear backup completo de la base de datos usando mongodump
   */
  async createBackup(currentUser: any): Promise<{ filename: string; size: number; path: string }> {
    if (currentUser.role !== 'OWNER') {
      throw new ForbiddenException('Solo OWNER puede crear backups del sistema');
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const filename = `shieldtrack_backup_${timestamp}.tar.gz`;
    const fullPath = join(this.backupsDir, filename);

    this.logger.log(`Iniciando backup de sistema: ${filename}`);
    this.logger.log(`Usuario: ${currentUser.email}`);

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';
    const command = `mongodump --uri="${mongoUri}" --archive="${fullPath}" --gzip`;

    return new Promise((resolve, reject) => {
      exec(command, async (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Error ejecutando mongodump: ${error.message}`);
          this.logger.error(`stderr: ${stderr}`);
          return reject(new BadRequestException(`Error creando backup: ${error.message}`));
        }

        try {
          const stats = await fs.stat(fullPath);
          this.logger.log(`Backup completado: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
          
          resolve({
            filename,
            size: stats.size,
            path: fullPath
          });
        } catch (statError) {
          reject(new BadRequestException(`Backup creado pero error al leer archivo: ${statError.message}`));
        }
      });
    });
  }

  /**
   * Restaurar base de datos desde archivo de backup
   */
  async restoreBackup(filename: string, currentUser: any): Promise<{ success: boolean; message: string }> {
    if (currentUser.role !== 'OWNER') {
      throw new ForbiddenException('Solo OWNER puede restaurar backups del sistema');
    }

    const fullPath = join(this.backupsDir, filename);

    if (!existsSync(fullPath)) {
      throw new BadRequestException(`Archivo de backup no encontrado: ${filename}`);
    }

    this.logger.warn(`⚠️  INICIANDO RESTAURACIÓN DE BACKUP: ${filename}`);
    this.logger.warn(`Usuario: ${currentUser.email}`);
    this.logger.warn(`Esta operación sobrescribirá TODA la base de datos actual`);

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';
    const command = `mongorestore --uri="${mongoUri}" --archive="${fullPath}" --gzip --drop`;

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Error ejecutando mongorestore: ${error.message}`);
          this.logger.error(`stderr: ${stderr}`);
          return reject(new BadRequestException(`Error restaurando backup: ${error.message}`));
        }

        this.logger.log(`✅ Backup restaurado exitosamente: ${filename}`);
        this.logger.log(`stdout: ${stdout}`);

        resolve({
          success: true,
          message: `Base de datos restaurada exitosamente desde ${filename}`
        });
      });
    });
  }

  /**
   * Listar todos los backups disponibles
   */
  async listBackups(): Promise<Array<{ filename: string; size: number; created: Date; sizeMB: string }>> {
    try {
      const files = await fs.readdir(this.backupsDir);
      const backupFiles = files.filter(f => f.startsWith('shieldtrack_backup_') && f.endsWith('.tar.gz'));

      const backupsInfo = await Promise.all(
        backupFiles.map(async (filename) => {
          const fullPath = join(this.backupsDir, filename);
          const stats = await fs.stat(fullPath);
          return {
            filename,
            size: stats.size,
            created: stats.birthtime,
            sizeMB: (stats.size / 1024 / 1024).toFixed(2) + ' MB'
          };
        })
      );

      // Ordenar por fecha de creación descendente
      return backupsInfo.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      this.logger.error(`Error listando backups: ${error.message}`);
      return [];
    }
  }

  /**
   * Eliminar backup específico
   */
  async deleteBackup(filename: string, currentUser: any): Promise<{ success: boolean; message: string }> {
    if (currentUser.role !== 'OWNER') {
      throw new ForbiddenException('Solo OWNER puede eliminar backups');
    }

    const fullPath = join(this.backupsDir, filename);

    if (!existsSync(fullPath)) {
      throw new BadRequestException(`Archivo de backup no encontrado: ${filename}`);
    }

    if (!filename.startsWith('shieldtrack_backup_')) {
      throw new BadRequestException('Nombre de archivo inválido');
    }

    try {
      await fs.unlink(fullPath);
      this.logger.log(`Backup eliminado: ${filename} por ${currentUser.email}`);
      return {
        success: true,
        message: `Backup ${filename} eliminado exitosamente`
      };
    } catch (error) {
      throw new BadRequestException(`Error eliminando backup: ${error.message}`);
    }
  }

  /**
   * Limpiar backups antiguos (mantener solo los últimos N)
   */
  private async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        this.logger.log(`Limpiando ${toDelete.length} backups antiguos (mantener últimos ${this.maxBackups})`);

        for (const backup of toDelete) {
          const fullPath = join(this.backupsDir, backup.filename);
          await fs.unlink(fullPath);
          this.logger.log(`Backup antiguo eliminado: ${backup.filename}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error limpiando backups antiguos: ${error.message}`);
    }
  }

  /**
   * Descargar archivo de backup
   */
  async downloadBackup(filename: string, currentUser: any): Promise<{ stream: any; filename: string; size: number }> {
    if (currentUser.role !== 'OWNER') {
      throw new ForbiddenException('Solo OWNER puede descargar backups');
    }

    const fullPath = join(this.backupsDir, filename);

    if (!existsSync(fullPath)) {
      throw new BadRequestException(`Archivo de backup no encontrado: ${filename}`);
    }

    if (!filename.startsWith('shieldtrack_backup_')) {
      throw new BadRequestException('Nombre de archivo inválido');
    }

    const stats = await fs.stat(fullPath);
    const stream = createReadStream(fullPath);

    return {
      stream,
      filename,
      size: stats.size
    };
  }

  /**
   * Obtener estadísticas de backups
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    totalSizeMB: string;
    oldestBackup: Date | null;
    latestBackup: Date | null;
    nextScheduledBackup: string;
  }> {
    const backups = await this.listBackups();
    
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    
    return {
      totalBackups: backups.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2) + ' MB',
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
      latestBackup: backups.length > 0 ? backups[0].created : null,
      nextScheduledBackup: '02:00 AM (diario)'
    };
  }
}
