import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CommonModule } from './common/common.module';
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
import { TenantModule } from './modules/tenant/tenant.module';
import { TenantContextGuard } from './common/guards/tenant-context.guard';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { RootController } from './root.controller';

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

    // Módulo común con servicios compartidos
    CommonModule,

    // Conexión a MongoDB con configuración robusta
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/shieldtrack',
        ),
        // Configuración de conexión robusta
        retryAttempts: 30, // Aumentado para trabajar con el servicio
        retryDelay: 2000,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4, // Usar IPv4 para evitar problemas con IPv6
        maxPoolSize: 10,
        minPoolSize: 2,
      }),
    }),

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
    TenantModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: TenantContextGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
  controllers: [RootController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar el middleware de contexto de tenant globalmente para todas las rutas
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
