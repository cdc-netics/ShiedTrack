import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { ClientModule } from './modules/client/client.module';
import { AreaModule } from './modules/area/area.module';
import { ProjectModule } from './modules/project/project.module';
import { FindingModule } from './modules/finding/finding.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { RetestSchedulerModule } from './modules/retest-scheduler/retest-scheduler.module';
import { AuditModule } from './modules/audit/audit.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { ExportModule } from './modules/export/export.module';
import { TemplateModule } from './modules/template/template.module';
import { BackupModule } from './modules/backup/backup.module';
import { EmailModule } from './modules/email/email.module';
import { CustomRoleModule } from './modules/custom-role/custom-role.module';

/**
 * Módulo raíz de la aplicación ShieldTrack
 * Orquesta todos los módulos funcionales y configuraciones globales
 */
@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Conexión a MongoDB
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/shieldtrack'),

    // Módulo de tareas programadas para Retest Scheduler
    ScheduleModule.forRoot(),

    // Módulos funcionales
    AuthModule,
    ClientModule,
    AreaModule,
    ProjectModule,
    FindingModule,
    EvidenceModule,
    RetestSchedulerModule,
    AuditModule,
    SystemConfigModule,
    ExportModule,
    TemplateModule,
    BackupModule,
    EmailModule,
    CustomRoleModule,
  ],
})
export class AppModule {}
