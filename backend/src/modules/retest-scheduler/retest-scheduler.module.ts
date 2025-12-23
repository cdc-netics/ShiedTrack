import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RetestSchedulerService } from './retest-scheduler.service';
import { Project, ProjectSchema } from '../project/schemas/project.schema';
import { Finding, FindingSchema } from '../finding/schemas/finding.schema';

/**
 * Módulo del programador de Retest
 * Usa @nestjs/schedule para ejecutar cron jobs diarios
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Finding.name, schema: FindingSchema },
    ]),
  ],
  providers: [RetestSchedulerService],
  exports: [RetestSchedulerService],
})
export class RetestSchedulerModule {}
