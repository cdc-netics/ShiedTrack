import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { existsSync, mkdirSync, createReadStream } from 'fs';
import { join } from 'path';

/**
 * Servicio de Backup y Restauración
 * Gestiona backups automáticos programados y restauración desde archivo
 */
@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  /**
   * Ruta absoluta para evitar problemas según desde dónde se levante el backend.
   * process.cwd() normalmente será la carpeta actual del proceso Node.
   */
  private readonly backupsDir = join(process.cwd(), 'backups');

  /**
   * Mantener últimos 30 backups
   */
  private readonly maxBackups = 30;

  constructor(@InjectConnection() private connection: Connection) {
    if (!existsSync(this.backupsDir)) {
      mkdirSync(this.backupsDir, { recursive: true });
      this.logger.log(`Directorio de backups creado: ${this.backupsDir}`);
    } else {
      this.logger.log(`Directorio de backups configurado: ${this.backupsDir}`);
    }
  }

  /**
   * Backup automático diario a las 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledBackup() {
    this.logger.log('Iniciando backup automático programado...');

    try {
      const result = await this.createBackup({
        userId: 'system',
        role: 'OWNER',
        email: 'system@shieldtrack.com',
      });

      this.logger.log(`Backup automático completado: ${result.filename}`);

      await this.cleanOldBackups();
    } catch (error: any) {
      this.logger.error(
        `Error en backup automático: ${error?.message || error}`,
        error?.stack,
      );
    }
  }

  /**
   * Crear backup completo de la base de datos usando mongodump
   */
  async createBackup(
    currentUser: any,
  ): Promise<{ filename: string; size: number; path: string }> {
    if (currentUser.role !== 'OWNER') {
      throw new ForbiddenException(
        'Solo OWNER puede crear backups del sistema',
      );
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-');

    const filename = `shieldtrack_backup_${timestamp}.tar.gz`;
    const fullPath = join(this.backupsDir, filename);

    this.logger.log(`Iniciando backup de sistema: ${filename}`);
    this.logger.log(`Usuario: ${currentUser.email}`);

    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

    const mongodumpCmd = this.resolveMongoTool('mongodump');
    const command = `${mongodumpCmd} --uri="${mongoUri}" --archive="${fullPath}" --gzip`;

    this.logger.log(`Ejecutando backup hacia: ${fullPath}`);

    return new Promise((resolve, reject) => {
      exec(command, async (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Error ejecutando mongodump: ${error.message}`);
          if (stderr) {
            this.logger.error(`stderr: ${stderr}`);
          }

          return reject(
            new BadRequestException(
              this.buildMongoToolErrorMessage('mongodump', error.message),
            ),
          );
        }

        try {
          const stats = await fs.stat(fullPath);

          this.logger.log(
            `Backup completado: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`,
          );

          if (stdout) {
            this.logger.debug(`stdout: ${stdout}`);
          }

          resolve({
            filename,
            size: stats.size,
            path: fullPath,
          });
        } catch (statError: any) {
          reject(
            new BadRequestException(
              `Backup creado, pero hubo un error al leer el archivo: ${statError.message}`,
            ),
          );
        }
      });
    });
  }

  /**
   * Restaurar base de datos desde archivo de backup
   */
  async restoreBackup(
    filename: string,
    currentUser: any,
  ): Promise<{ success: boolean; message: string }> {
    if (currentUser.role !== 'OWNER') {
      throw new ForbiddenException(
        'Solo OWNER puede restaurar backups del sistema',
      );
    }

    const fullPath = join(this.backupsDir, filename);

    if (!existsSync(fullPath)) {
      throw new BadRequestException(
        `Archivo de backup no encontrado: ${filename}`,
      );
    }

    this.logger.warn(`⚠️ INICIANDO RESTAURACIÓN DE BACKUP: ${filename}`);
    this.logger.warn(`Usuario: ${currentUser.email}`);
    this.logger.warn(
      'Esta operación sobrescribirá TODA la base de datos actual',
    );

    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack';

    const mongorestoreCmd = this.resolveMongoTool('mongorestore');
    const command = `${mongorestoreCmd} --uri="${mongoUri}" --archive="${fullPath}" --gzip --drop`;

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Error ejecutando mongorestore: ${error.message}`);
          if (stderr) {
            this.logger.error(`stderr: ${stderr}`);
          }

          return reject(
            new BadRequestException(
              this.buildMongoToolErrorMessage(
                'mongorestore',
                error.message,
              ),
            ),
          );
        }

        this.logger.log(`✅ Backup restaurado exitosamente: ${filename}`);
        if (stdout) {
          this.logger.log(`stdout: ${stdout}`);
        }

        resolve({
          success: true,
          message: `Base de datos restaurada exitosamente desde ${filename}`,
        });
      });
    });
  }

  /**
   * Listar todos los backups disponibles
   */
  async listBackups(): Promise<
    Array<{ filename: string; size: number; created: Date; sizeMB: string }>
  > {
    try {
      if (!existsSync(this.backupsDir)) {
        return [];
      }

      const files = await fs.readdir(this.backupsDir);

      const backupFiles = files.filter(
        (f) =>
          f.startsWith('shieldtrack_backup_') && f.endsWith('.tar.gz'),
      );

      const backupsInfo = await Promise.all(
        backupFiles.map(async (filename) => {
          const fullPath = join(this.backupsDir, filename);
          const stats = await fs.stat(fullPath);

          return {
            filename,
            size: stats.size,
            created: stats.birthtime,
            sizeMB: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
          };
        }),
      );

      return backupsInfo.sort(
        (a, b) => b.created.getTime() - a.created.getTime(),
      );
    } catch (error: any) {
      this.logger.error(`Error listando backups: ${error.message}`);
      return [];
    }
  }

  /**
   * Eliminar backup específico
   */
  async deleteBackup(
    filename: string,
    currentUser: any,
  ): Promise<{ success: boolean; message: string }> {
    if (currentUser.role !== 'OWNER') {
      throw new ForbiddenException('Solo OWNER puede eliminar backups');
    }

    const fullPath = join(this.backupsDir, filename);

    if (!existsSync(fullPath)) {
      throw new BadRequestException(
        `Archivo de backup no encontrado: ${filename}`,
      );
    }

    if (
      !filename.startsWith('shieldtrack_backup_') ||
      !filename.endsWith('.tar.gz')
    ) {
      throw new BadRequestException('Nombre de archivo inválido');
    }

    try {
      await fs.unlink(fullPath);

      this.logger.log(
        `Backup eliminado: ${filename} por ${currentUser.email}`,
      );

      return {
        success: true,
        message: `Backup ${filename} eliminado exitosamente`,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Error eliminando backup: ${error.message}`,
      );
    }
  }

  /**
   * Descargar archivo de backup
   */
  async downloadBackup(
    filename: string,
    currentUser: any,
  ): Promise<{ stream: any; filename: string; size: number }> {
    if (currentUser.role !== 'OWNER') {
      throw new ForbiddenException('Solo OWNER puede descargar backups');
    }

    const fullPath = join(this.backupsDir, filename);

    if (!existsSync(fullPath)) {
      throw new BadRequestException(
        `Archivo de backup no encontrado: ${filename}`,
      );
    }

    if (
      !filename.startsWith('shieldtrack_backup_') ||
      !filename.endsWith('.tar.gz')
    ) {
      throw new BadRequestException('Nombre de archivo inválido');
    }

    const stats = await fs.stat(fullPath);
    const stream = createReadStream(fullPath);

    return {
      stream,
      filename,
      size: stats.size,
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
      oldestBackup:
        backups.length > 0 ? backups[backups.length - 1].created : null,
      latestBackup: backups.length > 0 ? backups[0].created : null,
      nextScheduledBackup: '02:00 AM (diario)',
    };
  }

  /**
   * Limpiar backups antiguos (mantener solo los últimos N)
   */
  private async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();

      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);

        this.logger.log(
          `Limpiando ${toDelete.length} backups antiguos (mantener últimos ${this.maxBackups})`,
        );

        for (const backup of toDelete) {
          const fullPath = join(this.backupsDir, backup.filename);
          await fs.unlink(fullPath);
          this.logger.log(`Backup antiguo eliminado: ${backup.filename}`);
        }
      }
    } catch (error: any) {
      this.logger.error(
        `Error limpiando backups antiguos: ${error.message}`,
      );
    }
  }

  /**
   * Intenta resolver la ubicación del binario de MongoDB Tools.
   * Si no encuentra ruta conocida, devuelve el nombre del comando
   * para que el sistema lo busque por PATH.
   */
  private resolveMongoTool(toolName: 'mongodump' | 'mongorestore'): string {
    const exe = process.platform === 'win32' ? `${toolName}.exe` : toolName;

    if (process.platform === 'win32') {
      const commonPaths = [
        join('C:', 'Program Files', 'MongoDB', 'Tools', 'bin', exe),
        join('C:', 'Program Files', 'MongoDB', 'Database Tools', 'bin', exe),
        join('C:', 'Program Files (x86)', 'MongoDB', 'Tools', 'bin', exe),
        join('C:', 'Program Files (x86)', 'MongoDB', 'Database Tools', 'bin', exe),
      ];

      for (const fullPath of commonPaths) {
        if (existsSync(fullPath)) {
          this.logger.log(`Herramienta Mongo resuelta: ${fullPath}`);
          return `"${fullPath}"`;
        }
      }
    }

    return toolName;
  }

  /**
   * Construye un mensaje más claro para errores típicos de mongodump/mongorestore.
   */
  private buildMongoToolErrorMessage(
    toolName: 'mongodump' | 'mongorestore',
    originalMessage: string,
  ): string {
    const normalized = (originalMessage || '').toLowerCase();

    if (
      normalized.includes('is not recognized') ||
      normalized.includes('not recognized as an internal or external command') ||
      normalized.includes('enoent')
    ) {
      return `No se pudo ejecutar ${toolName}. Verifica que MongoDB Database Tools esté instalado y disponible para el proceso del backend.`;
    }

    return `Error ejecutando ${toolName}: ${originalMessage}`;
  }
}