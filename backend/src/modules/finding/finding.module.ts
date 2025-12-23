import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FindingService } from './finding.service';
import { FindingController } from './finding.controller';
import { Finding, FindingSchema } from './schemas/finding.schema';
import { FindingUpdate, FindingUpdateSchema } from './schemas/finding-update.schema';
import { Project, ProjectSchema } from '../project/schemas/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Finding.name, schema: FindingSchema },
      { name: FindingUpdate.name, schema: FindingUpdateSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  providers: [FindingService],
  controllers: [FindingController],
  exports: [FindingService],
})
export class FindingModule {}
