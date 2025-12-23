import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { Finding, FindingSchema } from '../finding/schemas/finding.schema';
import { Project, ProjectSchema } from '../project/schemas/project.schema';
import { Client, ClientSchema } from '../client/schemas/client.schema';
import { Evidence, EvidenceSchema } from '../evidence/schemas/evidence.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Finding.name, schema: FindingSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Evidence.name, schema: EvidenceSchema },
    ]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
